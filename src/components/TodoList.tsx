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

// How many pixels of rightward drag = one extra depth level
const PX_PER_LEVEL = 60;

interface Props {
  todos: Todo[];
  colors: Colors;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onReorder: (todos: Todo[]) => void;
  onEdit: (id: string, text: string) => void;
}

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

function computeParentId(flatItems: FlatTodo[], toIndex: number, newDepth: number): string | null {
  if (newDepth === 0) return null;
  for (let i = toIndex - 1; i >= 0; i--) {
    if (flatItems[i].depth === newDepth - 1) return flatItems[i].todo.id;
    if (flatItems[i].depth < newDepth - 1) break;
  }
  return null;
}

// ── Drop indicator line ───────────────────────────────────────────────────────
// Mirrors the reference images: same level = line flush left, child = indented
interface IndicatorProps {
  dragDepth: Animated.SharedValue<number>;
  colors: Colors;
}

function DropIndicator({ dragDepth, colors }: IndicatorProps) {
  const lineStyle = useAnimatedStyle(() => ({
    marginLeft: 16 + dragDepth.value * INDENT_SIZE,
  }));
  return (
    <View style={styles.placeholderWrap}>
      <Animated.View style={[styles.placeholderLine, { backgroundColor: colors.accent }, lineStyle]} />
    </View>
  );
}

export function TodoList({ todos, colors, onAdd, onDelete, onToggle, onReorder, onEdit }: Props) {
  const [input, setInput] = useState('');

  const dragDepth    = useSharedValue(0);
  const startDepth   = useSharedValue(0);
  const startAbsX    = useSharedValue(0);
  const isDragging   = useSharedValue(false);

  const flatItemsRef = useRef<FlatTodo[]>([]);
  const flatItems    = flattenTree(todos);
  flatItemsRef.current = flatItems;

  // ── Passive gesture that observes touch X during DraggableFlatList drag ──
  // manualActivation(true) keeps this in BEGAN state permanently, so it never
  // competes with DraggableFlatList's internal gesture but still receives
  // onTouchesMove events throughout the drag.
  const trackGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      const t = e.changedTouches[0];
      if (t) startAbsX.value = t.absoluteX;
    })
    .onTouchesMove((e) => {
      if (!isDragging.value) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const deltaX  = t.absoluteX - startAbsX.value;
      const newDepth = Math.max(0, Math.round(startDepth.value + deltaX / PX_PER_LEVEL));
      dragDepth.value = newDepth;
    });

  const onDragBegin = useCallback((index: number) => {
    const depth = flatItemsRef.current[index]?.depth ?? 0;
    isDragging.value  = true;
    startDepth.value  = depth;
    dragDepth.value   = depth;
  }, [isDragging, startDepth, dragDepth]);

  const onDragEnd = useCallback(
    ({ data, to }: { data: FlatTodo[]; from: number; to: number }) => {
      isDragging.value = false;
      const finalDepth  = dragDepth.value;
      const newParentId = computeParentId(data, to, finalDepth);
      const movedId     = data[to]?.todo.id;

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

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  };

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
      <GestureDetector gesture={trackGesture}>
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
  container:      { flex: 1 },
  listWrap:       { flex: 1 },
  emptyContainer: { flexGrow: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyText:  { fontSize: 17, fontWeight: '500', marginBottom: 6 },
  emptyHint:  { fontSize: 14 },
  placeholderWrap: {
    height: 28,
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
