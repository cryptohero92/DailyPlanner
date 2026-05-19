import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '../theme/colors';
import { Todo } from '../types';

interface Props {
  todo: Todo;
  isActive: boolean;
  drag: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  colors: Colors;
}

export function TodoItem({ todo, isActive, drag, onToggle, onDelete, colors }: Props) {
  const swipeRef = useRef<Swipeable>(null);

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

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: isActive ? colors.dragActive : colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
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

        {/* Text */}
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

        {/* Drag handle — long press to reorder */}
        <TouchableOpacity onLongPress={drag} delayLongPress={150} style={styles.handle} activeOpacity={0.5}>
          <Text style={[styles.handleIcon, { color: colors.secondaryText }]}>⠿</Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkboxWrap: {
    marginRight: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  label: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  handle: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  handleIcon: {
    fontSize: 20,
    lineHeight: 24,
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
