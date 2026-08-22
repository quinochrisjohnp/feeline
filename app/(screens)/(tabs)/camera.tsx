import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PlaceholderBox from "@/components/common/PlaceholderBox";
import Button from "@/components/common/Button";
import CaptureButton from "@/components/camera/CaptureButton";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import { colors, radii, shadows, spacing } from "@/constants/theme";

type CaptureState = "idle" | "captured";

// TODO(camera): Replace this whole screen's viewfinder with expo-camera once
// the AI pipeline is ready. TODO(ai): Wire real emotion detection into
// EmotionResultCard instead of the static placeholder.
export default function Camera() {
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleCapture = () => setCaptureState("captured");
  const handleRetake = () => setCaptureState("idle");

  const handleSave = () => {
    // TODO(backend): upload the captured image once storage/API is ready.
    Alert.alert("Saved", "Image saved to Unknown Cats. (Placeholder action)");
    setCaptureState("idle");
  };

  const handleHelp = () => {
    Alert.alert(
      "What to avoid",
      "Blurry images, dark images, images without cats, cropped images, or images with physical deformities may reduce detection accuracy."
    );
  };

  return (
    <View style={styles.container}>
      <PlaceholderBox
        style={styles.fill}
        icon={captureState === "captured" ? "image-outline" : "camera-outline"}
        label={
          captureState === "captured"
            ? "Captured Photo (Placeholder)"
            : "Camera Preview (Placeholder)"
        }
        backgroundColor={colors.black}
        labelColor="rgba(255,255,255,0.7)"
        borderRadius={0}
      />

      <View style={[styles.topRow, { top: insets.top + spacing.sm }]}>
        {captureState === "captured" ? (
          <TouchableOpacity
            style={styles.roundIconButton}
            onPress={handleRetake}
            accessibilityLabel="Retake photo"
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {captureState === "captured" ? (
          <Button label="Save" variant="outline" size="sm" onPress={handleSave} />
        ) : (
          <TouchableOpacity
            style={styles.roundIconButton}
            onPress={handleHelp}
            accessibilityLabel="Camera tips"
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {captureState === "idle" && (
        <View style={[styles.bottomControls, { bottom: insets.bottom + 120 }]}>
          <TouchableOpacity
            style={styles.thumbnail}
            onPress={() => router.push("/album")}
            accessibilityLabel="Open album"
          >
            <Ionicons name="paw" size={22} color={colors.white} />
          </TouchableOpacity>

          <CaptureButton onPress={handleCapture} />

          <View style={styles.thumbnailSpacer} />
        </View>
      )}

      {captureState === "captured" && (
        <View style={styles.resultWrapper}>
          <EmotionResultCard />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
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
  bottomControls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailSpacer: { width: 48, height: 48 },
  resultWrapper: { position: "absolute", left: 0, right: 0, bottom: 0 },
});