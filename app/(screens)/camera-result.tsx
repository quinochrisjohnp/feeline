import React, { useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import Button from "@/components/common/Button";
import MockCapturePhoto from "@/components/camera/MockCapturePhoto";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import { detectMockCapture, parseMockCapture } from "@/services/mockDetection";
import { colors, dimensions, radii, shadows, spacing, typography } from "@/constants/theme";

export default function CameraResult() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const capture = parseMockCapture(params);
  const result = capture ? detectMockCapture(capture) : null;
  const leaving = useRef(false);
  const handleRetake = () => router.dismissTo("/camera");
  const handleSave = () => {
    if (leaving.current || !capture || result?.outcome !== "normal") return;
    leaving.current = true;
    // Only one pending deep screen: completed saves cannot reveal an old result on Back.
    router.replace({ pathname: "/camera-save", params: { ...capture } });
  };

  const isError = !result || result.outcome === "error";
  return (
    <ScreenContainer module="camera" edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader transparent title="Emotion Result" onBack={handleRetake}
        rightElement={result?.outcome === "normal" ? <Button label="Save" size="sm" variant="outline" onPress={handleSave} /> : undefined} />
      <ScrollView style={styles.resultContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator
        accessibilityLabel="Image and emotion result" bounces={false}>
        {capture ? <View style={styles.photo}>
          <MockCapturePhoto key={capture.imageUri} imageUri={capture.imageUri}
            imageWidth={capture.width ? Number(capture.width) : undefined}
            imageHeight={capture.height ? Number(capture.height) : undefined} />
        </View> : null}
        <Text style={styles.mockNote}>Simulated prototype result - no AI image analysis was performed. Not a veterinary diagnosis.</Text>
        <View>
          {isError ? <View style={styles.errorCard}>
            <Text style={styles.errorTitle} accessibilityRole="header">Emotion Detection Error.</Text>
            <Text style={styles.message}>{result?.outcome === "error" ? result.message : "This image is unavailable. Please try again."}</Text>
            <Button label="Try Again" onPress={handleRetake} fullWidth />
          </View> : <EmotionResultCard emotionKey={result.emotion} confidence={result.confidence}
            variant={result.outcome === "low" ? "lowConfidence" : "normal"} onRetry={handleRetake} />}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  resultContent: { flex: 1 },
  photo: { marginHorizontal: spacing.md, marginVertical: spacing.xs },
  scrollContent: { paddingBottom: spacing.md },
  errorCard: { width: "100%", maxWidth: dimensions.dialogMaxWidth, alignSelf: "center",
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadows.floating },
  errorTitle: { ...typography.subheading, color: colors.textPrimary, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, marginVertical: spacing.sm, textAlign: "center" },
  mockNote: { ...typography.caption, color: colors.textSecondary, marginVertical: spacing.xs, marginHorizontal: spacing.md, textAlign: "center" },
});
