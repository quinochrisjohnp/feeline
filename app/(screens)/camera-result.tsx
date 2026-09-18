import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FullBleedScreen from "@/components/common/FullBleedScreen";
import PlaceholderBox from "@/components/common/PlaceholderBox";
import Button from "@/components/common/Button";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import type { EmotionKey } from "@/types/models";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

type Outcome = "normal" | "low" | "error";

export default function CameraResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ outcome?: string; emotion?: string; confidence?: string; imageUri?: string; capturedAt?: string }>();

  const outcome = (params.outcome as Outcome) ?? "normal";
  const emotion = (params.emotion as EmotionKey | undefined) || undefined;
  const confidence = params.confidence ? Number(params.confidence) : undefined;

  const handleRetake = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/camera");
  };

  const handleSave = () => {
    router.push({
      pathname: "/camera-save",
      params: { emotion: emotion ?? "", confidence: String(confidence ?? ""), imageUri: params.imageUri, capturedAt: params.capturedAt },
    });
  };

  if (outcome === "error") {
    return (
      <FullBleedScreen>
        <PlaceholderBox
          style={styles.fill}
          icon="camera-outline"
          label="Captured Photo (Placeholder)"
          backgroundColor={colors.black}
          labelColor="rgba(255,255,255,0.6)"
          borderRadius={0}
        />
        <TouchableOpacity
          style={[styles.roundIconButton, { top: insets.top + spacing.sm, left: spacing.md }]}
          onPress={handleRetake}
          accessibilityLabel="Retake photo"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.centerOverlay}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Emotion Detection Error.</Text>
            <Text style={styles.errorMessage}>Please try again.</Text>
            <Button label="Continue" onPress={handleRetake} style={styles.errorButton} />
          </View>
        </View>
      </FullBleedScreen>
    );
  }

  const isLow = outcome === "low";

  return (
    <FullBleedScreen>
      <PlaceholderBox
        style={styles.fill}
        icon="image-outline"
        label="Captured Photo (Placeholder)"
        backgroundColor={colors.black}
        labelColor="rgba(255,255,255,0.6)"
        borderRadius={0}
      />

      <View style={[styles.topRow, { top: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.roundIconButton} onPress={handleRetake} accessibilityLabel="Retake photo">
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        {!isLow && <Button label="Save" variant="outline" size="sm" onPress={handleSave} />}
      </View>

      <View style={styles.resultWrapper}>
        <EmotionResultCard emotionKey={emotion} confidence={confidence} variant={isLow ? "lowConfidence" : "normal"} />
      </View>
    </FullBleedScreen>
  );
}

const styles = StyleSheet.create({
  fill: StyleSheet.absoluteFillObject,
  topRow: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roundIconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  resultWrapper: { position: "absolute", left: 0, right: 0, bottom: 0 },
  centerOverlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  errorCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.floating,
  },
  errorTitle: { ...typography.subheading, color: colors.textPrimary, textAlign: "center" },
  errorMessage: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg, textAlign: "center" },
  errorButton: { minWidth: 160 },
});