import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Button from "@/components/common/Button";
import EmotionIcon from "@/components/common/EmotionIcon";
import type { EmotionKey } from "@/types/models";
import { EMOTIONS } from "@/types/models";
import { normalizeEmotionKey } from "@/utils/emotion";

import {
  colors,
  dimensions,
  radii,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";
interface EmotionResultCardProps {
  embedded?: boolean;
  emotionKey?: EmotionKey;
  confidence?: number;

  // Recommendations received from the backend
  // through Expo Router navigation parameters.
  recommendations?: string | string[];

  variant?: "normal" | "lowConfidence";
  onRetry?: () => void;
}

export default function EmotionResultCard({
  embedded = false,
  emotionKey,
  confidence,
  recommendations,
  variant = "normal",
  onRetry,
}: EmotionResultCardProps) {
  const key = normalizeEmotionKey(emotionKey);
  const meta = key ? EMOTIONS[key] : null;

  const isPlaceholder = !meta;

  const isLowConfidence = variant === "lowConfidence" && !!emotionKey;

  // ========================================================
  // PARSE DATABASE RECOMMENDATIONS
  // ========================================================

  const actions: string[] = [];

  try {
    let parsed: unknown = recommendations ?? [];

    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }

    if (Array.isArray(parsed)) {
      actions.push(
        ...parsed.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        ),
      );
    }
  } catch (error) {
    console.warn("[FeELINE] Failed to parse recommendations:", error);
  }

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <View style={[styles.card, embedded && { borderRadius: 0, shadowOpacity: 0, elevation: 0, paddingTop: 0 }]}>
      {!embedded && <View style={styles.handle} />}

      <View style={styles.headerRow}>
        <View style={styles.emotionBadge}>
          <EmotionIcon emotion={emotionKey} size={dimensions.emotionBadge} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.emotionLabel}>
            {isPlaceholder ? "Emotion Result" : meta!.label}
          </Text>

          <Text style={styles.emotionSub}>
            {isPlaceholder ? "Result unavailable" : "AI Emotion Detection"}
          </Text>
        </View>

        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {isPlaceholder ? "--%" : `${confidence ?? 0}%`}
          </Text>

          <Text style={styles.confidenceCaption}>Confidence</Text>
        </View>
      </View>

      {isLowConfidence ? (
        <View>
          <Text style={styles.lowConfidenceText}>
            This emotion prediction has a{" "}
            <Text style={styles.bold}>low confidence level</Text>. The image may
            not provide enough information for a reliable interpretation.
          </Text>

          <Text style={[styles.lowConfidenceText, styles.bold, styles.spaced]}>
            Try another clear, well-lit image.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Recommended Actions:</Text>

          {actions.length > 0 ? (
            actions.map((action, index) => (
              <View key={`${index}-${action}`} style={styles.actionRow}>
                <View style={styles.bullet} />

                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.actionText}>
              Recommendations are currently unavailable.
            </Text>
          )}
        </>
      )}

      <Text style={styles.confidenceCaption}>FeELINE interprets observable cues and does not provide a veterinary diagnosis.</Text>
      {onRetry ? (
        <Button
          label="Try Again"
          onPress={onRetry}
          variant={isLowConfidence ? "primary" : "outline"}
          style={styles.spaced}
        />
      ) : null}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.floating,
  },

  handle: {
    alignSelf: "center",
    width: dimensions.sheetHandleWidth,
    height: dimensions.sheetHandleHeight,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },

  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.md,
  },

  emotionBadge: {
    width: dimensions.emotionBadge,
    height: dimensions.emotionBadge,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  headerText: {
    flexGrow: 1,
    flexBasis: dimensions.actionMinWidth,
    marginRight: spacing.xs,
  },

  emotionLabel: {
    ...typography.subheading,
    color: colors.textPrimary,
  },

  emotionSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  confidenceBadge: {
    alignItems: "center",
  },

  confidenceText: {
    ...typography.subheading,
    color: colors.textPrimary,
  },

  confidenceCaption: {
    ...typography.caption,
    color: colors.textMuted,
  },

  sectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  actionRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: spacing.xs,
  },

  actionText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },

  lowConfidenceText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: typography.body.lineHeight,
  },

  bold: {
    fontWeight: "700",
  },

  spaced: {
    marginTop: spacing.md,
  },
});
