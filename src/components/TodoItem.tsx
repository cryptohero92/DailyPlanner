import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '../theme/colors';
import { Todo } from '../types';

export const INDENT_SIZE = 24;

interface Props {
  todo: Todo;
  depth: number;
  isActive: boolean;
  drag: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  colors: Colors;
}

export function TodoItem({ todo, depth, isActive, drag, onToggle, onDelete, onEdit, colors }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const startEdit = useCallback(() => {
    setEditText(todo.text);
    setEditing(true);
  }, [todo.text]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onEdit(todo.id, trimmed);
    } else {
      setEditText(todo.text);
    }
  }, [editText, todo.id, todo.text, onEdit]);

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: colors.danger }]}
      onPress={() => {
        swipeRef.current?.close();
        onDelete(todo.id);
      }}
      activeOpacity={0.8}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const indentLeft = 16 + depth * INDENT_SIZE;

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: isActive ? colors.dragActive : colors.surface,
            borderBottomColor: colors.border,
            paddingLeft: indentLeft,
          },
        ]}
      >
        {/* Vertical connector line for child items */}
        {depth > 0 && (
          <View
            style={[
              styles.depthLine,
              { left: indentLeft - INDENT_SIZE + 10, backgroundColor: colors.border },
            ]}
          />
        )}

        {/* Drag handle — left side, long press to drag */}
        {!editing && (
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={200}
            style={styles.handle}
            activeOpacity={0.5}
          >
            <Text style={[styles.handleIcon, { color: colors.secondaryText }]}>⠿</Text>
          </TouchableOpacity>
        )}

        {/* Checkbox */}
        <TouchableOpacity onPress={() => onToggle(todo.id)} style={styles.checkboxWrap} activeOpacity={0.7}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: todo.completed ? colors.success : colors.checkboxBorder,
                backgroundColor: todo.completed ? colors.success : 'transparent',
              },
            ]}
          >
            {todo.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Text or inline editor */}
        {editing ? (
          <TextInput
            style={[styles.editInput, { color: colors.text }]}
            value={editText}
            onChangeText={setEditText}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
            autoFocus
            returnKeyType="done"
            maxLength={250}
          />
        ) : (
          <TouchableOpacity style={styles.labelWrap} onPress={startEdit} activeOpacity={0.6}>
            <Text
              style={[
                styles.label,
                { color: todo.completed ? colors.secondaryText : colors.text },
                todo.completed && styles.strikethrough,
              ]}
              numberOfLines={3}
            >
              {todo.text}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  depthLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
  },
  handle: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  handleIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  checkboxWrap: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
