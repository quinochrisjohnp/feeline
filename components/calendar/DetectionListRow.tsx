import EmotionIcon from "@/components/common/EmotionIcon";
import { normalizeEmotionKey } from "@/utils/emotion";
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
  const key = normalizeEmotionKey(emotion);
  const label = key ? EMOTIONS[key].label : "Emotion unavailable";
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}
      accessibilityRole="button" accessibilityLabel={`${catName}, ${label}, ${time}. Open photo`}>
      <EmotionIcon emotion={emotion} size={30} />
      <View style={styles.text}>
        <Text style={styles.catName}>{catName}</Text>
        <Text style={styles.emotion}>{label}</Text>
      </View>
      <Text style={styles.time}>{time}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: 44, paddingVertical: spacing.sm, gap: spacing.xs },
  text: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs },
  catName: { ...typography.body, color: colors.textSecondary, flexShrink: 1 },
  emotion: { ...typography.bodyMedium, color: colors.textPrimary },
  time: { ...typography.caption, color: colors.textSecondary, maxWidth: "30%" },
});
