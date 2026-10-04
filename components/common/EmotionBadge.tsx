import EmotionIcon from "./EmotionIcon";
import { normalizeEmotionKey } from "@/utils/emotion";
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
  const key = normalizeEmotionKey(emotion);
  const label = key ? EMOTIONS[key].label : "Emotion unavailable";

  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel={label}>
      <EmotionIcon emotion={emotion} size={size} />
      {showLabel ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  label: { ...typography.label, color: colors.textPrimary },
});