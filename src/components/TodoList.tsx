import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Colors } from '../theme/colors';
import { Todo } from '../types';
import { TodoItem } from './TodoItem';

interface Props {
  todos: Todo[];
  colors: Colors;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onReorder: (todos: Todo[]) => void;
}

export function TodoList({ todos, colors, onAdd, onDelete, onToggle, onReorder }: Props) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Todo>) => (
    <ScaleDecorator activeScale={1.02}>
      <TodoItem
        todo={item}
        isActive={isActive}
        drag={drag}
        onToggle={onToggle}
        onDelete={onDelete}
        colors={colors}
      />
    </ScaleDecorator>
  );

  const Empty = () => (
    <View style={styles.emptyWrap}>
      <Text style={[styles.emptyIcon]}>📋</Text>
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
      <DraggableFlatList<Todo>
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => onReorder(data)}
        ListEmptyComponent={<Empty />}
        contentContainerStyle={todos.length === 0 ? styles.emptyContainer : undefined}
        activationDistance={8}
      />

      {/* Add task input */}
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
  container: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
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
