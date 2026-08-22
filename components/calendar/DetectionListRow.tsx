import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EMOTIONS, EmotionKey } from "@/types/models";
import { colors, spacing, typography } from "@/constants/theme";

interface DetectionListRowProps {
  catName: string;
  emotion: EmotionKey;
  time: string;
  onPress?: () => void;
}

export default function DetectionListRow({ catName, emotion, time, onPress }: DetectionListRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.dot, { backgroundColor: colors.emotion[emotion] }]} />
      <Text style={styles.catName}>{catName}</Text>
      <View style={styles.divider} />
      <Text style={styles.emotion}>{EMOTIONS[emotion].label}</Text>
      <Text style={styles.time}>{time}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs },
  catName: { ...typography.body, color: colors.textSecondary, marginRight: spacing.sm },
  divider: { width: 1, height: 18, backgroundColor: colors.border, marginRight: spacing.sm },
  emotion: { ...typography.bodyMedium, color: colors.textPrimary, marginRight: spacing.xs },
  time: { ...typography.caption, color: colors.textMuted },
});