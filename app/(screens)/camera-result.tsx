import React, { useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import FullBleedScreen from "@/components/common/FullBleedScreen";
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

  if (!result || result.outcome === "error") {
    return (
      <FullBleedScreen statusBarStyle="dark">
        <ScreenContainer edges={["left", "right", "bottom"]} padded={false} backgroundColor={colors.black}>
          <DetailScreenHeader title="Emotion Result" onBack={handleRetake} />
          <ScrollView contentContainerStyle={styles.errorContent}>
            {capture ? <MockCapturePhoto imageUri={capture.imageUri} /> : null}
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle} accessibilityRole="header">Emotion Detection Error.</Text>
              <Text style={styles.message}>{result?.outcome === "error" ? result.message : "This image is unavailable. Please try again."}</Text>
              <Text style={styles.mockNote}>Simulated prototype result - no AI image analysis was performed.</Text>
              <Button label="Try Again" onPress={handleRetake} fullWidth />
            </View>
          </ScrollView>
        </ScreenContainer>
      </FullBleedScreen>
    );
  }

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader title="Emotion Result" onBack={handleRetake}
        rightElement={result.outcome === "normal" ? <Button label="Save" size="sm" variant="outline" onPress={handleSave} /> : undefined} />
      <ScrollView contentContainerStyle={styles.resultContent}>
        <View style={styles.photo}>
          <MockCapturePhoto imageUri={capture!.imageUri} />
        </View>
        <Text style={styles.mockNote}>Simulated prototype result - no AI image analysis was performed.</Text>
        <EmotionResultCard emotionKey={result.emotion} confidence={result.confidence}
          variant={result.outcome === "low" ? "lowConfidence" : "normal"} onRetry={handleRetake} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  resultContent: { flexGrow: 1, paddingBottom: spacing.md },
  photo: { flexGrow: 1, minHeight: 240, margin: spacing.lg },
  errorContent: { flexGrow: 1, justifyContent: "center", padding: spacing.lg, gap: spacing.lg },
  errorCard: { width: "100%", maxWidth: dimensions.dialogMaxWidth, alignSelf: "center",
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, ...shadows.floating },
  errorTitle: { ...typography.subheading, color: colors.textPrimary, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, marginVertical: spacing.sm, textAlign: "center" },
  mockNote: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: "center" },
});
