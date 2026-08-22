import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EMOTIONS, EmotionKey } from "@/types/models";
import { RECOMMENDED_ACTIONS } from "@/data/recommendations";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

interface EmotionResultCardProps {
  /** When omitted, the card renders in Phase-1 placeholder mode (used by
   * the live Camera screen, which has no real detection yet). */
  emotionKey?: EmotionKey;
  confidence?: number;
}

// TODO(ai): Feed real detection output into this card once the emotion
// model is integrated.
const PLACEHOLDER_ACTIONS = [
  "Point the camera at your cat and take a clear, well-lit photo.",
  "Emotion detection results will appear here once the AI model is connected.",
  "Recommended actions for your cat will be shown in this section.",
];

export default function EmotionResultCard({ emotionKey, confidence }: EmotionResultCardProps) {
  const isPlaceholder = !emotionKey;
  const meta = emotionKey ? EMOTIONS[emotionKey] : null;
  const actions = emotionKey ? RECOMMENDED_ACTIONS[emotionKey] : PLACEHOLDER_ACTIONS;

  return (
    <View style={styles.card}>
      <View style={styles.handle} />

      <View style={styles.headerRow}>
        <View style={[styles.emotionBadge, meta ? { backgroundColor: colors.emotion[meta.key] } : null]}>
          {isPlaceholder ? (
            <Ionicons name="help-outline" size={22} color={colors.textSecondary} />
          ) : (
            <Text style={styles.emoji}>{meta!.emoji}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.emotionLabel}>{isPlaceholder ? "Emotion Result" : meta!.label}</Text>
          <Text style={styles.emotionSub}>{isPlaceholder ? "Placeholder" : "Detected Emotion"}</Text>
        </View>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{isPlaceholder ? "--%" : `${confidence ?? 0}%`}</Text>
          <Text style={styles.confidenceCaption}>Confident</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recommended Actions:</Text>
      {actions.map((action) => (
        <View key={action} style={styles.actionRow}>
          <View style={styles.bullet} />
          <Text style={styles.actionText}>{action}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.floating,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  emotionBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  emoji: { fontSize: 22 },
  headerText: { flex: 1 },
  emotionLabel: { ...typography.subheading, color: colors.textPrimary },
  emotionSub: { ...typography.caption, color: colors.textMuted },
  confidenceBadge: { alignItems: "center" },
  confidenceText: { ...typography.subheading, color: colors.textPrimary },
  confidenceCaption: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.sm },
  actionRow: { flexDirection: "row", marginBottom: spacing.xs },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8, marginRight: spacing.xs },
  actionText: { ...typography.body, color: colors.textSecondary, flex: 1 },
});