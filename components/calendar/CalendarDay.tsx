import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EMOTIONS, EmotionKey } from "@/types/models";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface CalendarDayProps {
  day: number;
  inCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  emotion?: EmotionKey;
  onPress: () => void;
}

export default function CalendarDay({
  day,
  inCurrentMonth,
  isSelected,
  isToday,
  emotion,
  onPress,
}: CalendarDayProps) {
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.7}>
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
      <Text style={[styles.dayLabel, !inCurrentMonth && styles.dayLabelMuted]}>{day}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", width: `${100 / 7}%`, marginBottom: spacing.sm },
  circle: { width: 38, height: 38, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  circleEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  circleSelected: { borderWidth: 2, borderColor: colors.textPrimary },
  circleToday: { borderWidth: 2, borderColor: colors.primary },
  emoji: { fontSize: 18 },
  dayLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  dayLabelMuted: { color: colors.textMuted },
});