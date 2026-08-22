import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface CalendarHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

export default function CalendarHeader({ label, onPrev, onNext }: CalendarHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={onPrev} accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onNext} accessibilityLabel="Next month">
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  label: { ...typography.heading, color: colors.textPrimary },
  controls: { flexDirection: "row", gap: spacing.sm },
  button: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
});