import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { EMOTIONS, EmotionKey } from "@/types/models";
import { colors, dimensions, spacing, typography } from "@/constants/theme";

interface EmotionBadgeProps {
  emotion: EmotionKey;
  size?: number;
  showLabel?: boolean;
}

export default function EmotionBadge({ emotion, size = dimensions.emotionBadge, showLabel = false }: EmotionBadgeProps) {
  const meta = EMOTIONS[emotion];

  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel={meta.label}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.emotion[emotion] },
        ]}
      >
        <Text style={{ fontSize: size * 0.5 }}>{meta.emoji}</Text>
      </View>
      {showLabel ? <Text style={styles.label}>{meta.label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  circle: { alignItems: "center", justifyContent: "center" },
  label: { ...typography.label, color: colors.textPrimary },
});