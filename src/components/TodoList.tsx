import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '../theme/colors';
import { Todo, FlatTodo } from '../types';
import { TodoItem, INDENT_SIZE, ROW_HEIGHT } from './TodoItem';

// Horizontal pixels of drag = one extra depth level
const PX_PER_LEVEL = 38;

interface Props {
  todos: Todo[];
  colors: Colors;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onReorder: (todos: Todo[]) => void;
  onEdit: (id: string, text: string) => void;
}

/** DFS-flatten the parentId-based array into an ordered list with depths */
function flattenTree(todos: Todo[]): FlatTodo[] {
  const childMap = new Map<string | null, Todo[]>();
  for (const todo of todos) {
    const key = todo.parentId ?? null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(todo);
  }
  const result: FlatTodo[] = [];
  function visit(parentId: string | null, depth: number) {
    for (const todo of childMap.get(parentId) ?? []) {
      result.push({ todo, depth });
      visit(todo.id, depth + 1);
    }
  }
  visit(null, 0);
  return result;
}

// ── Shared drag state passed to every row ────────────────────────────────────
interface DragState {
  activeIndex: SharedValue<number>;
  blockStart: SharedValue<number>;
  blockEnd: SharedValue<number>;
  headDepth: SharedValue<number>;
  transY: SharedValue<number>;
  dropGap: SharedValue<number>;
  dropDepth: SharedValue<number>;
  depthsSV: SharedValue<number[]>;
  countSV: SharedValue<number>;
}

// ── A single draggable row ───────────────────────────────────────────────────
interface RowProps {
  item: FlatTodo;
  index: number;
  colors: Colors;
  drag: DragState;
  commitDrop: (bStart: number, bEnd: number, gap: number, depth: number) => void;
  setDragging: (b: boolean) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

function DraggableRow({
  item,
  index,
  colors,
  drag,
  commitDrop,
  setDragging,
  onToggle,
  onDelete,
  onEdit,
}: RowProps) {
  const { activeIndex, blockStart, blockEnd, headDepth, transY, dropGap, dropDepth, depthsSV, countSV } =
    drag;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(220)
        .onStart(() => {
          const d = depthsSV.value;
          let be = index;
          for (let i = index + 1; i < d.length; i++) {
            if (d[i] > d[index]) be = i;
            else break;
          }
          activeIndex.value = index;
          blockStart.value = index;
          blockEnd.value = be;
          headDepth.value = d[index];
          transY.value = 0;
          dropGap.value = index;
          dropDepth.value = d[index];
          runOnJS(setDragging)(true);
        })
        .onUpdate((e) => {
          transY.value = e.translationY;
          const count = countSV.value;

          // vertical → drop gap
          let g = Math.round((blockStart.value * ROW_HEIGHT + e.translationY) / ROW_HEIGHT);
          if (g > blockStart.value && g <= blockEnd.value) {
            g = e.translationY < 0 ? blockStart.value : blockEnd.value + 1;
          }
          if (g < 0) g = 0;
          if (g > count) g = count;
          dropGap.value = g;

          // horizontal → depth, clamped to a valid level for that gap
          const d = depthsSV.value;
          let aboveIdx = g - 1;
          if (aboveIdx >= blockStart.value && aboveIdx <= blockEnd.value) {
            aboveIdx = blockStart.value - 1;
          }
          const maxDepth = aboveIdx >= 0 ? d[aboveIdx] + 1 : 0;
          let raw = Math.round(headDepth.value + e.translationX / PX_PER_LEVEL);
          if (raw < 0) raw = 0;
          if (raw > maxDepth) raw = maxDepth;
          dropDepth.value = raw;
        })
        .onEnd(() => {
          runOnJS(commitDrop)(blockStart.value, blockEnd.value, dropGap.value, dropDepth.value);
        })
        .onFinalize(() => {
          activeIndex.value = -1;
          transY.value = 0;
          runOnJS(setDragging)(false);
        }),
    // shared values are stable; rebuild only when index/commitDrop change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, commitDrop],
  );

  const rowStyle = useAnimatedStyle(() => {
    const inBlock =
      activeIndex.value >= 0 && index >= blockStart.value && index <= blockEnd.value;
    if (!inBlock) {
      return { transform: [{ translateY: 0 }, { translateX: 0 }], zIndex: 0, elevation: 0 };
    }
    return {
      transform: [
        { translateY: transY.value },
        { translateX: (dropDepth.value - headDepth.value) * INDENT_SIZE },
      ],
      zIndex: 999,
      elevation: 8,
      opacity: 0.96,
    };
  });

  return (
    <Animated.View style={[styles.rowContainer, rowStyle]}>
      <TodoItem
        todo={item.todo}
        depth={item.depth}
        handleGesture={pan}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        colors={colors}
      />
    </Animated.View>
  );
}

// ── Drop indicator line (same level = flush, child = indented) ────────────────
function DropLine({ drag, colors }: { drag: DragState; colors: Colors }) {
  const style = useAnimatedStyle(() => ({
    opacity: drag.activeIndex.value >= 0 ? 1 : 0,
    top: drag.dropGap.value * ROW_HEIGHT - 1,
    marginLeft: 12 + drag.dropDepth.value * INDENT_SIZE,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.dropLine, { backgroundColor: colors.accent }, style]}
    />
  );
}

export function TodoList({ todos, colors, onAdd, onDelete, onToggle, onReorder, onEdit }: Props) {
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const flatItems = useMemo(() => flattenTree(todos), [todos]);
  const flatItemsRef = useRef<FlatTodo[]>(flatItems);
  flatItemsRef.current = flatItems;

  // Drag shared values
  const drag: DragState = {
    activeIndex: useSharedValue(-1),
    blockStart: useSharedValue(0),
    blockEnd: useSharedValue(0),
    headDepth: useSharedValue(0),
    transY: useSharedValue(0),
    dropGap: useSharedValue(0),
    dropDepth: useSharedValue(0),
    depthsSV: useSharedValue<number[]>([]),
    countSV: useSharedValue(0),
  };

  useEffect(() => {
    drag.depthsSV.value = flatItems.map((f) => f.depth);
    drag.countSV.value = flatItems.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatItems]);

  const commitDrop = useCallback(
    (bStart: number, bEnd: number, gap: number, depth: number) => {
      const items = flatItemsRef.current;
      if (!items.length) return;

      const blockSize = bEnd - bStart + 1;
      const block = items.slice(bStart, bEnd + 1);
      const rest = [...items.slice(0, bStart), ...items.slice(bEnd + 1)];

      let insertAt = gap <= bStart ? gap : gap - blockSize;
      if (insertAt < 0) insertAt = 0;
      if (insertAt > rest.length) insertAt = rest.length;

      const newFlat = [...rest.slice(0, insertAt), ...block, ...rest.slice(insertAt)];

      // parent for the dragged head: nearest item above with depth = depth-1
      let parentId: string | null = null;
      if (depth > 0) {
        for (let i = insertAt - 1; i >= 0; i--) {
          const it = newFlat[i];
          if (it.depth === depth - 1) {
            parentId = it.todo.id;
            break;
          }
          if (it.depth < depth - 1) break;
        }
      }

      const newTodos: Todo[] = newFlat.map((fi, i) =>
        i === insertAt ? { ...fi.todo, parentId } : fi.todo,
      );

      const unchanged =
        newTodos.length === items.length &&
        newTodos.every(
          (t, i) => t.id === items[i].todo.id && t.parentId === items[i].todo.parentId,
        );
      if (!unchanged) onReorder(newTodos);
    },
    [onReorder],
  );

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {flatItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No tasks for this day</Text>
          <Text style={[styles.emptyHint, { color: colors.secondaryText }]}>Add one below ↓</Text>
        </View>
      ) : (
        <ScrollView scrollEnabled={!isDragging} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {flatItems.map((item, index) => (
              <DraggableRow
                key={item.todo.id}
                item={item}
                index={index}
                colors={colors}
                drag={drag}
                commitDrop={commitDrop}
                setDragging={setIsDragging}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
            <DropLine drag={drag} colors={colors} />
          </View>
        </ScrollView>
      )}

      <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
          placeholder="Add a new task…"
          placeholderTextColor={colors.secondaryText}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          blurOnSubmit={false}
          maxLength={250}
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent, opacity: input.trim() ? 1 : 0.4 }]}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { position: 'relative' },
  rowContainer: { height: ROW_HEIGHT },
  dropLine: {
    position: 'absolute',
    left: 0,
    right: 16,
    height: 2,
    borderRadius: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '500', marginBottom: 6 },
  emptyHint: { fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '400',
  },
});
