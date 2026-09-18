import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EMOTIONS, EmotionKey } from "@/types/models";
import { RECOMMENDED_ACTIONS } from "@/data/recommendations";
import { colors, dimensions, radii, shadows, spacing, typography } from "@/constants/theme";

interface EmotionResultCardProps {
  /** Omitted → Phase-1 placeholder mode (used by screens with no real
   * detection wired up yet, if any remain). */
  emotionKey?: EmotionKey;
  confidence?: number;
  /** "lowConfidence" replaces the recommended-actions list with the
   * low-confidence warning copy from the prototype. */
  variant?: "normal" | "lowConfidence";
}

const PLACEHOLDER_ACTIONS = [
  "Try a mock capture to explore the four emotion categories.",
  "This prototype simulates interpretations of observable emotional cues.",
  "Suggestions are for observation and gentle interaction, not diagnosis.",
];

export default function EmotionResultCard({ emotionKey, confidence, variant = "normal" }: EmotionResultCardProps) {
  const meta = emotionKey ? EMOTIONS[emotionKey] : null;
  const isPlaceholder = !meta;
  const isLowConfidence = variant === "lowConfidence" && !!emotionKey;
  const actions = meta ? RECOMMENDED_ACTIONS[meta.key] : PLACEHOLDER_ACTIONS;

  return (
    <View style={styles.card}>
      <View style={styles.handle} />

      <View style={styles.headerRow}>
        <View accessible accessibilityRole="image" accessibilityLabel={meta?.label ?? "Mock emotion result"} style={[styles.emotionBadge, meta ? { backgroundColor: colors.emotion[meta.key] } : null]}>
          {isPlaceholder ? (
            <Ionicons name="help-outline" size={22} color={colors.textSecondary} />
          ) : (
            <Text style={styles.emoji}>{meta!.emoji}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.emotionLabel}>{isPlaceholder ? "Emotion Result" : meta!.label}</Text>
          <Text style={styles.emotionSub}>{isPlaceholder ? "Placeholder" : "Observable cues · Mock result"}</Text>
        </View>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{isPlaceholder ? "--%" : `${confidence ?? 0}%`}</Text>
          <Text style={styles.confidenceCaption}>Confidence</Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>Simulated interpretation of observable cues, not a veterinary diagnosis.</Text>

      {isLowConfidence ? (
        <View>
          <Text style={styles.lowConfidenceText}>
            This mock interpretation has a <Text style={styles.bold}>low confidence level</Text>.
            The visible cues may be unclear.
          </Text>
          <Text style={[styles.lowConfidenceText, styles.bold, styles.spaced]}>Try another clear, well-lit image.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Recommended Actions:</Text>
          {actions.map((action) => (
            <View key={action} style={styles.actionRow}>
              <View style={styles.bullet} />
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.floating,
  },
  handle: { alignSelf: "center", width: dimensions.sheetHandleWidth, height: dimensions.sheetHandleHeight, borderRadius: radii.pill, backgroundColor: colors.border, marginBottom: spacing.md },
  headerRow: { flexDirection: "row", flexWrap: "wrap", rowGap: spacing.sm, alignItems: "center", marginBottom: spacing.md },
  emotionBadge: {
    width: dimensions.emotionBadge,
    height: dimensions.emotionBadge,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  emoji: typography.emoji,
  headerText: { flexGrow: 1, flexBasis: dimensions.actionMinWidth, marginRight: spacing.xs },
  emotionLabel: { ...typography.subheading, color: colors.textPrimary },
  emotionSub: { ...typography.caption, color: colors.textSecondary },
  confidenceBadge: { alignItems: "center" },
  confidenceText: { ...typography.subheading, color: colors.textPrimary },
  confidenceCaption: { ...typography.caption, color: colors.textMuted },
  disclaimer: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  sectionTitle: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.sm },
  actionRow: { flexDirection: "row", marginBottom: spacing.xs },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8, marginRight: spacing.xs },
  actionText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  lowConfidenceText: { ...typography.body, color: colors.textPrimary, lineHeight: typography.body.lineHeight },
  bold: { fontWeight: "700" },
  spaced: { marginTop: spacing.md },
});