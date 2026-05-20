import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Colors } from '../theme/colors';
import { Todo, FlatTodo } from '../types';
import { TodoItem, INDENT_SIZE } from './TodoItem';

interface Props {
  todos: Todo[];
  colors: Colors;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onReorder: (todos: Todo[]) => void;
  onEdit: (id: string, text: string) => void;
}

/** Build a flat DFS list with depth from a parentId-based flat array */
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

/** Find the parentId for a dropped item at `toIndex` with `newDepth` */
function computeParentId(flatItems: FlatTodo[], toIndex: number, newDepth: number): string | null {
  if (newDepth === 0) return null;
  for (let i = toIndex - 1; i >= 0; i--) {
    if (flatItems[i].depth === newDepth - 1) return flatItems[i].todo.id;
    if (flatItems[i].depth < newDepth - 1) break;
  }
  return null;
}

// ── Animated drop indicator line ─────────────────────────────────────────────
interface IndicatorProps {
  dragDepth: Animated.SharedValue<number>;
  colors: Colors;
}

function DropIndicator({ dragDepth, colors }: IndicatorProps) {
  const style = useAnimatedStyle(() => ({
    paddingLeft: 16 + dragDepth.value * INDENT_SIZE,
  }));
  return (
    <Animated.View style={[styles.placeholderWrap, style]}>
      <View style={[styles.placeholderLine, { backgroundColor: colors.accent }]} />
    </Animated.View>
  );
}

export function TodoList({ todos, colors, onAdd, onDelete, onToggle, onReorder, onEdit }: Props) {
  const [input, setInput] = useState('');
  const flatItems = flattenTree(todos);

  const dragDepth = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const startDepth = useSharedValue(0);
  const dragDepthRef = useRef(0);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  };

  // Horizontal pan updates depth during active drag
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (!isDragging.value) return;
      const newDepth = Math.max(
        0,
        Math.round((startDepth.value * INDENT_SIZE + e.translationX) / INDENT_SIZE),
      );
      dragDepth.value = newDepth;
    })
    .runOnJS(false);

  const onDragBegin = useCallback(
    (index: number) => {
      const depth = flatItems[index]?.depth ?? 0;
      isDragging.value = true;
      startDepth.value = depth;
      dragDepth.value = depth;
      dragDepthRef.current = depth;
    },
    // flatItems identity changes each render; use length as a proxy to keep stable ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos],
  );

  const onDragEnd = useCallback(
    ({ data, to }: { data: FlatTodo[]; from: number; to: number }) => {
      isDragging.value = false;
      // Read final depth from shared value synchronously on JS thread
      const finalDepth = dragDepth.value;
      dragDepthRef.current = finalDepth;

      const newParentId = computeParentId(data, to, finalDepth);
      const movedId = data[to]?.todo.id;

      const rebuilt = data.map((fi, i) =>
        i === to && movedId
          ? { ...fi, todo: { ...fi.todo, parentId: newParentId }, depth: finalDepth }
          : fi,
      );

      onReorder(rebuilt.map(({ todo }) => todo));
    },
    [dragDepth, isDragging, onReorder],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<FlatTodo>) => (
      <ScaleDecorator activeScale={1.02}>
        <TodoItem
          todo={item.todo}
          depth={item.depth}
          isActive={isActive}
          drag={drag}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          colors={colors}
        />
      </ScaleDecorator>
    ),
    [onToggle, onDelete, onEdit, colors],
  );

  const renderPlaceholder = useCallback(
    () => <DropIndicator dragDepth={dragDepth} colors={colors} />,
    [dragDepth, colors],
  );

  const Empty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No tasks for this day</Text>
      <Text style={[styles.emptyHint, { color: colors.secondaryText }]}>Add one below ↓</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.listWrap}>
          <DraggableFlatList<FlatTodo>
            data={flatItems}
            keyExtractor={(item) => item.todo.id}
            renderItem={renderItem}
            renderPlaceholder={renderPlaceholder}
            onDragBegin={onDragBegin}
            onDragEnd={onDragEnd}
            ListEmptyComponent={<Empty />}
            contentContainerStyle={flatItems.length === 0 ? styles.emptyContainer : undefined}
            activationDistance={8}
          />
        </View>
      </GestureDetector>

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
  listWrap: { flex: 1 },
  emptyContainer: { flexGrow: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '500', marginBottom: 6 },
  emptyHint: { fontSize: 14 },
  placeholderWrap: {
    height: 32,
    justifyContent: 'center',
  },
  placeholderLine: {
    height: 2,
    borderRadius: 1,
    marginRight: 16,
  },
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
