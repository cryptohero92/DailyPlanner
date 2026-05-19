import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { formatHeader, shiftDay } from '../utils/date';

interface Props {
  date: string;
  calendarVisible: boolean;
  onDateChange: (d: string) => void;
  onToggleCalendar: () => void;
  colors: Colors;
}

export function Header({ date, calendarVisible, onDateChange, onToggleCalendar, colors }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: colors.headerBackground, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={() => onDateChange(shiftDay(date, -1))}
        style={styles.navBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.navArrow, { color: colors.accent }]}>{'‹'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onToggleCalendar} style={styles.center} activeOpacity={0.7}>
        <Text style={[styles.dateText, { color: colors.text }]}>{formatHeader(date)}</Text>
        <Text style={[styles.calIcon, { color: calendarVisible ? colors.accent : colors.secondaryText }]}>
          {'  📅'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDateChange(shiftDay(date, 1))}
        style={styles.navBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.navArrow, { color: colors.accent }]}>{'›'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '300',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  calIcon: {
    fontSize: 16,
  },
});
