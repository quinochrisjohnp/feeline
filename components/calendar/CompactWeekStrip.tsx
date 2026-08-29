import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EMOTIONS, EmotionKey } from "@/types/models";
import { isSameDay } from "@/utils/date";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

interface CompactWeekStripProps {
  weekDates: Date[];
  selectedDate: Date;
  monthLabel: string;
  emotionForDate: (date: Date) => EmotionKey | undefined;
  onSelectDate: (date: Date) => void;
  onExpand: () => void;
}

/** Sticky replacement for the full month grid once the user scrolls past
 * it — shows just the week containing the selected date. Tapping it
 * scrolls the screen back to the top, which re-expands the full calendar. */
export default function CompactWeekStrip({
  weekDates,
  selectedDate,
  monthLabel,
  emotionForDate,
  onSelectDate,
  onExpand,
}: CompactWeekStripProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.monthLabel}>{monthLabel}</Text>
      <View style={styles.row}>
        {weekDates.map((date) => {
          const emotion = emotionForDate(date);
          const selected = isSameDay(date, selectedDate);
          return (
            <TouchableOpacity key={date.toISOString()} style={styles.dayWrapper} onPress={() => onSelectDate(date)}>
              <Text style={styles.weekdayLabel}>{date.toLocaleDateString(undefined, { weekday: "narrow" })}</Text>
              <View
                style={[
                  styles.circle,
                  emotion ? { backgroundColor: colors.emotion[emotion] } : styles.circleEmpty,
                  selected && styles.circleSelected,
                ]}
              >
                {emotion ? (
                  <Text style={styles.emoji}>{EMOTIONS[emotion].emoji}</Text>
                ) : (
                  <Text style={styles.dayNumber}>{date.getDate()}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity style={styles.expandHandle} onPress={onExpand} accessibilityLabel="Show full calendar">
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    ...shadows.card,
  },
  monthLabel: { ...typography.label, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between" },
  dayWrapper: { alignItems: "center" },
  weekdayLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  circle: { width: 32, height: 32, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  circleEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  circleSelected: { borderWidth: 2, borderColor: colors.textPrimary },
  emoji: { fontSize: 14 },
  dayNumber: { ...typography.caption, color: colors.textSecondary },
  expandHandle: { alignItems: "center", paddingTop: spacing.xs },
});