import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import EmotionIcon from "./EmotionIcon";
import type { EmotionKey } from "@/types/models";
import MockPhoto from "./MockPhoto";
import { colors, dimensions, radii, spacing, typography } from "@/constants/theme";

interface PlaceholderBoxProps {
  emotion?: EmotionKey;
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
  emotion,
  icon = "image-outline",
  label,
  backgroundColor = colors.placeholder,
  labelColor = colors.textSecondary,
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
      {emotion ? <EmotionIcon emotion={emotion} size={dimensions.iconLarge} /> :
        <MockPhoto icon={icon} size={dimensions.iconLarge} color={labelColor} label={label ?? "Image (Placeholder)"} />}
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