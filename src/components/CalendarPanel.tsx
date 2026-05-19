import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Colors } from '../theme/colors';
import { TodosStore } from '../types';

interface Props {
  selectedDate: string;
  store: TodosStore;
  onDayPress: (date: string) => void;
  colors: Colors;
  isDark: boolean;
}

export function CalendarPanel({ selectedDate, store, onDayPress, colors, isDark }: Props) {
  const markedDates: Record<string, object> = {};

  // Dot markers for dates that have todos
  for (const date of Object.keys(store)) {
    if ((store[date]?.length ?? 0) > 0) {
      markedDates[date] = { marked: true, dotColor: colors.accent };
    }
  }

  // Selected day overrides (keep dot if it exists)
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] ?? {}),
    selected: true,
    selectedColor: colors.accent,
    selectedTextColor: '#FFFFFF',
  };

  const theme = {
    backgroundColor: colors.calendarBackground,
    calendarBackground: colors.calendarBackground,
    textSectionTitleColor: colors.secondaryText,
    dayTextColor: colors.text,
    textDisabledColor: isDark ? '#3A3A3C' : '#C7C7CC',
    todayTextColor: colors.accent,
    selectedDayBackgroundColor: colors.accent,
    selectedDayTextColor: '#FFFFFF',
    dotColor: colors.accent,
    selectedDotColor: '#FFFFFF',
    arrowColor: colors.accent,
    monthTextColor: colors.text,
    textMonthFontSize: 16,
    textMonthFontWeight: '700' as const,
    textDayFontSize: 14,
    textDayHeaderFontSize: 12,
    textDayHeaderFontWeight: '600' as const,
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: DateData) => onDayPress(day.dateString)}
        markedDates={markedDates}
        theme={theme}
        enableSwipeMonths
        firstDay={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
