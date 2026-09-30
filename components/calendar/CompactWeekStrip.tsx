import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { EmotionKey } from "@/types/models";
import { isSameDay } from "@/utils/date";
import CalendarDay from "./CalendarDay";
import { colors, shadows, spacing, typography } from "@/constants/theme";

interface CompactWeekStripProps {
  weekDates: Date[];
  selectedDate: Date;
  monthLabel: string;
  activityForDate: (date: Date) => { emotion?: EmotionKey; recordCount: number; birthdayCount: number };
  onSelectDate: (date: Date) => void;
  onExpand: () => void;
}

export default function CompactWeekStrip({ weekDates, selectedDate, monthLabel, activityForDate,
  onSelectDate, onExpand }: CompactWeekStripProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <View style={styles.row}>
        {weekDates.map((date) => <Text key={date.toISOString()} style={styles.weekdayLabel}>
          {date.toLocaleDateString(undefined, { weekday: "short" })}
        </Text>)}
      </View>
      <View style={styles.row}>
        {weekDates.map((date) => <CalendarDay key={date.toISOString()} day={date.getDate()}
          dateLabel={date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          inCurrentMonth={date.getMonth() === selectedDate.getMonth()}
          isSelected={isSameDay(date, selectedDate)} isToday={isSameDay(date, new Date())}
          {...activityForDate(date)} onPress={() => onSelectDate(date)} />)}
      </View>
      <TouchableOpacity style={styles.expandHandle} onPress={onExpand} accessibilityRole="button" accessibilityLabel="Show full calendar">
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { backgroundColor: colors.background, paddingHorizontal: spacing.xxs, paddingTop: spacing.xs, ...shadows.card },
  monthLabel: { ...typography.label, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xxs },
  row: { flexDirection: "row" },
  weekdayLabel: { ...typography.caption, color: colors.textSecondary, width: `${100 / 7}%`, textAlign: "center", marginBottom: spacing.xxs },
  expandHandle: { alignItems: "center", justifyContent: "center", minHeight: 44 },
});
