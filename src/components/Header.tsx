import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { formatHeader, shiftDay } from '../utils/date';

const HISTORY_WIDTH = 80;

interface Props {
  date: string;
  calendarVisible: boolean;
  onDateChange: (d: string) => void;
  onToggleCalendar: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  colors: Colors;
}

export function Header({
  date,
  calendarVisible,
  onDateChange,
  onToggleCalendar,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  colors,
}: Props) {
  return (
    <View style={[styles.container, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
      {/* Left spacer — same width as history group to keep nav truly centered */}
      <View style={styles.spacer} />

      {/* Date navigation — centered */}
      <View style={styles.navGroup}>
        <TouchableOpacity
          onPress={() => onDateChange(shiftDay(date, -1))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
        >
          <Text style={[styles.navArrow, { color: colors.accent }]}>{'‹'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onToggleCalendar} style={styles.dateBtn} activeOpacity={0.7}>
          <Text style={[styles.dateText, { color: colors.text }]}>{formatHeader(date)}</Text>
          <Text style={[styles.calIcon, { color: calendarVisible ? colors.accent : colors.secondaryText }]}>
            {'  📅'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDateChange(shiftDay(date, 1))}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
        >
          <Text style={[styles.navArrow, { color: colors.accent }]}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      {/* Undo / Redo — pinned right */}
      <View style={styles.historyGroup}>
        <TouchableOpacity
          onPress={onUndo}
          disabled={!canUndo}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
        >
          <Text style={[styles.historyIcon, { color: canUndo ? colors.accent : colors.border }]}>{'↩'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRedo}
          disabled={!canRedo}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
        >
          <Text style={[styles.historyIcon, { color: canRedo ? colors.accent : colors.border }]}>{'↪'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spacer: {
    width: HISTORY_WIDTH,
  },
  navGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '300',
    paddingHorizontal: 4,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  calIcon: {
    fontSize: 15,
  },
  historyGroup: {
    width: HISTORY_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  historyIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
});
