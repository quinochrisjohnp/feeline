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
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}
      accessibilityRole="button" accessibilityLabel={`${catName}, ${EMOTIONS[emotion].label}, ${time}. Open photo`}>
      <View style={[styles.icon, { backgroundColor: colors.emotion[emotion] }]}>
        <Text>{EMOTIONS[emotion].emoji}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.catName}>{catName}</Text>
        <Text style={styles.emotion}>{EMOTIONS[emotion].label}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: 44, paddingVertical: spacing.sm, gap: spacing.xs },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs },
  catName: { ...typography.body, color: colors.textSecondary, flexShrink: 1 },
  emotion: { ...typography.bodyMedium, color: colors.textPrimary },
  time: { ...typography.caption, color: colors.textSecondary, maxWidth: "30%" },
});
