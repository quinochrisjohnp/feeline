import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface CalendarHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function CalendarHeader({ label, onPrev, onNext, onToday }: CalendarHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label} accessibilityRole="header">{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.today} onPress={onToday} accessibilityRole="button" accessibilityLabel="Go to today">
          <Text style={styles.todayLabel}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onPrev} accessibilityRole="button" accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onNext} accessibilityRole="button" accessibilityLabel="Next month">
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { ...typography.subheading, color: colors.textPrimary, flexShrink: 1 },
  controls: { flexDirection: "row", gap: spacing.xxs },
  today: { minHeight: 44, minWidth: 44, paddingHorizontal: spacing.xs, justifyContent: "center" },
  todayLabel: { ...typography.label, color: colors.textPrimary },
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
});
