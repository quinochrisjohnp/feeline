import { parseDetectionRoute, normalizeEmotion, normalizeConfidence } from "@/services/detection";

import React, {
  useEffect,
  useRef,
} from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import ScreenContainer from "@/components/common/ScreenContainer";
import FullBleedScreen from "@/components/common/FullBleedScreen";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import Button from "@/components/common/Button";
import MockCapturePhoto from "@/components/camera/MockCapturePhoto";
import EmotionResultCard from "@/components/camera/EmotionResultCard";

import type {
  EmotionKey,
} from "@/types/models";

import {
  colors,
  dimensions,
  radii,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return undefined;
  }

  return value;
}

function isEmotionKey(
  value: string
): value is EmotionKey {
  return (
    value === "happy" ||
    value === "neutral" ||
    value === "fear" ||
    value === "angry"
  );
}

export default function CameraResult() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const leaving = useRef(false);

  // PERFORMANCE MEASUREMENT
  const captureStartTimestamp = firstParam(
    params.captureStartTimestamp
  );

  const accepted = parseDetectionRoute(params.result);
  const imageUri = accepted?.imageUrl;
  const capturedAt = firstParam(params.capturedAt);
  const source = firstParam(params.source);
  const catId = accepted?.catId;
  const imageId = accepted?.imageId;
  const detectionId = accepted?.detectionId;
  const emotionParam = accepted ? normalizeEmotion(accepted.emotion) : undefined;
  const confidenceParam = accepted ? normalizeConfidence(accepted.confidence) : NaN;
  const recommendations = JSON.stringify(accepted?.recommendations ?? []);

  const confidence = Number(confidenceParam);

  const valid =
    !!accepted &&
    !!capturedAt && Number.isFinite(Date.parse(capturedAt)) && new Date(capturedAt).toISOString() === capturedAt &&
    !!imageUri &&
    !!capturedAt &&
    !!detectionId &&
    !!imageId &&
    !!catId &&
    !!emotionParam &&
    isEmotionKey(emotionParam) &&
    Number.isFinite(confidence);

  // ==========================================================
  // PERFORMANCE: Measure result screen appearance
  // ==========================================================

  useEffect(() => {
    if (!valid || !captureStartTimestamp) {
      return;
    }

    const start = Number(captureStartTimestamp);

    if (!Number.isFinite(start) || start <= 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const totalSeconds = (Date.now() - start) / 1000;

      console.log(
        `[PERFORMANCE] Capture to Result Screen: ${totalSeconds.toFixed(3)} seconds`
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [captureStartTimestamp, valid]);

  const handleRetake = () => {
    router.dismissTo("/camera");
  };

  const handleSave = () => {
    if (leaving.current || !valid) {
      return;
    }

    leaving.current = true;

    router.replace({
      pathname: "/camera-save",
      params: {
        result: JSON.stringify(accepted),
        imageUri,
        capturedAt,
        source: source ?? "camera",
        catId,
        imageId,
        detectionId,
        emotion: emotionParam,
        confidence: String(confidence),
        recommendations: recommendations ?? "[]",
      },
    });
  };

  if (
    !valid ||
    !emotionParam ||
    !isEmotionKey(emotionParam)
  ) {
    return (
      <FullBleedScreen statusBarStyle="dark">
        <ScreenContainer
          edges={["left", "right", "bottom"]}
          padded={false}
          backgroundColor={colors.black}
        >
          <DetailScreenHeader
            title="Emotion Result"
            onBack={handleRetake}
          />

          <ScrollView
            contentContainerStyle={styles.errorContent}
          >
            {imageUri ? (
              <MockCapturePhoto imageUri={imageUri} />
            ) : null}

            <View style={styles.errorCard}>
              <Text
                style={styles.errorTitle}
                accessibilityRole="header"
              >
                Emotion Detection Error.
              </Text>

              <Text style={styles.message}>
                The detection result is unavailable.
                Please try again.
              </Text>

              <Button
                label="Try Again"
                onPress={handleRetake}
                fullWidth
              />
            </View>
          </ScrollView>
        </ScreenContainer>
      </FullBleedScreen>
    );
  }

  return (
    <ScreenContainer
      edges={["left", "right", "bottom"]}
      padded={false}
    >
      <DetailScreenHeader
        title="Emotion Result"
        onBack={handleRetake}
        rightElement={
          <Button
            label="Save"
            size="sm"
            variant="outline"
            onPress={handleSave}
          />
        }
      />

      <ScrollView
        contentContainerStyle={styles.resultContent}
      >
        <View style={styles.photo}>
          <MockCapturePhoto imageUri={imageUri} />
        </View>

        <EmotionResultCard
          emotionKey={emotionParam}
          confidence={confidence}
          recommendations={recommendations}
          variant="normal"
          onRetry={handleRetake}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  resultContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },

  photo: {
    flexGrow: 1,
    minHeight: 240,
    margin: spacing.lg,
  },

  errorContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.lg,
  },

  errorCard: {
    width: "100%",
    maxWidth: dimensions.dialogMaxWidth,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.floating,
  },

  errorTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    textAlign: "center",
  },

  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
    textAlign: "center",
  },
});
