import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EMOTIONS, EmotionKey } from "@/types/models";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface CalendarDayProps {
  day: number;
  dateLabel: string;
  recordCount?: number;
  birthdayCount?: number;
  inCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  emotion?: EmotionKey;
  onPress: () => void;
}

export default function CalendarDay({
  day,
  dateLabel,
  recordCount = 0,
  birthdayCount = 0,
  inCurrentMonth,
  isSelected,
  isToday,
  emotion,
  onPress,
}: CalendarDayProps) {
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.7}
      accessibilityRole="button" accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${dateLabel}${isToday ? ", today" : ""}, ${recordCount} detections${emotion ? `, latest ${EMOTIONS[emotion].label}` : ""}${birthdayCount ? `, ${birthdayCount} birthdays` : ""}`}>
      <View
        style={[
          styles.circle,
          emotion ? { backgroundColor: colors.emotion[emotion] } : styles.circleEmpty,
          isSelected && styles.circleSelected,
          isToday && !isSelected && styles.circleToday,
        ]}
      >
        {emotion ? <Text style={styles.emoji}>{EMOTIONS[emotion].emoji}</Text> : null}
      </View>
      <Text style={[styles.dayLabel, !inCurrentMonth && styles.dayLabelMuted]}>{day}{birthdayCount ? " 🎂" : ""}</Text>
      {recordCount > 1 ? <Text style={styles.count}>{recordCount}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", width: `${100 / 7}%`, minHeight: 60, marginBottom: spacing.xs },
  count: { position: "absolute", top: 0, right: 0, borderRadius: radii.pill, paddingHorizontal: 3, backgroundColor: colors.textPrimary, color: colors.white, fontSize: 10 },
  circle: { width: 38, height: 38, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  circleEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  circleSelected: { borderWidth: 2, borderColor: colors.textPrimary },
  circleToday: { borderWidth: 2, borderColor: colors.primary },
  emoji: { fontSize: 18 },
  dayLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  dayLabelMuted: { color: colors.textMuted },
});
