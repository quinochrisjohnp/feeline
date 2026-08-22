import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface PlaceholderBoxProps {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  label?: string;
  backgroundColor?: string;
  labelColor?: string;
  borderRadius?: number;
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Generic placeholder used anywhere a real asset (photo, illustration, AI
 * result) doesn't exist yet. Preserves layout/dimensions so it can be
 * swapped for the real content later without redesigning the screen.
 */
export default function PlaceholderBox({
  icon = "image-outline",
  label,
  backgroundColor = colors.border,
  labelColor = colors.textMuted,
  borderRadius = radii.lg,
  aspectRatio,
  style,
}: PlaceholderBoxProps) {
  return (
    <View
      style={[
        styles.base,
        { backgroundColor, borderRadius },
        aspectRatio ? { aspectRatio } : null,
        style,
      ]}
    >
      <Ionicons name={icon} size={32} color={labelColor} />
      {label ? <Text style={[styles.label, { color: labelColor }]}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  label: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
});