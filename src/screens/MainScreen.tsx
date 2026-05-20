import React, { useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { CalendarPanel } from '../components/CalendarPanel';
import { TodoList } from '../components/TodoList';
import { useTodos } from '../hooks/useTodos';
import { lightColors, darkColors } from '../theme/colors';
import { getTodayString } from '../utils/date';

export default function MainScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const {
    todos,
    store,
    addTodo,
    editTodo,
    deleteTodo,
    toggleTodo,
    reorderTodos,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTodos(selectedDate);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Header
        date={selectedDate}
        calendarVisible={calendarVisible}
        onDateChange={setSelectedDate}
        onToggleCalendar={() => setCalendarVisible((v) => !v)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        colors={colors}
      />

      {calendarVisible && (
        <CalendarPanel
          selectedDate={selectedDate}
          store={store}
          onDayPress={setSelectedDate}
          colors={colors}
          isDark={isDark}
        />
      )}

      <TodoList
        todos={todos}
        colors={colors}
        onAdd={addTodo}
        onEdit={editTodo}
        onDelete={deleteTodo}
        onToggle={toggleTodo}
        onReorder={reorderTodos}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
