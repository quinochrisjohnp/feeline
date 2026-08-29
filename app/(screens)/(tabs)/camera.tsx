import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PlaceholderBox from "@/components/common/PlaceholderBox";
import CaptureButton from "@/components/camera/CaptureButton";
import WhatToAvoidModal from "@/components/camera/WhatToAvoidModal";
import type { EmotionKey } from "@/types/models";
import { colors, radii, shadows, spacing } from "@/constants/theme";

const EMOTION_KEYS: EmotionKey[] = ["happy", "neutral", "fear", "angry"];

// TODO(camera): Replace this viewfinder with expo-camera and wire capture
// to a real image once the AI pipeline is ready. Outcome selection below
// (normal/low-confidence/error) is a mock weighted random pick purely so
// all three result states in camera-result.tsx are reachable for testing.
export default function Camera() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [avoidVisible, setAvoidVisible] = useState(false);

  const handleCapture = () => {
    const roll = Math.random();
    const emotion = EMOTION_KEYS[Math.floor(Math.random() * EMOTION_KEYS.length)];

    if (roll < 0.15) {
      router.push({ pathname: "/camera-result", params: { outcome: "error" } });
      return;
    }

    if (roll < 0.35) {
      const confidence = String(15 + Math.floor(Math.random() * 30));
      router.push({ pathname: "/camera-result", params: { outcome: "low", emotion, confidence } });
      return;
    }

    const confidence = String(70 + Math.floor(Math.random() * 29));
    router.push({ pathname: "/camera-result", params: { outcome: "normal", emotion, confidence } });
  };

  return (
    <View style={styles.container}>
      <PlaceholderBox
        style={styles.fill}
        icon="camera-outline"
        label="Camera Preview (Placeholder)"
        backgroundColor={colors.black}
        labelColor="rgba(255,255,255,0.7)"
        borderRadius={0}
      />

      <View style={[styles.topRow, { top: insets.top + spacing.sm }]}>
        <View />
        <TouchableOpacity
          style={styles.roundIconButton}
          onPress={() => setAvoidVisible(true)}
          accessibilityLabel="Camera tips"
        >
          <Ionicons name="help-circle-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomControls, { bottom: insets.bottom + 120 }]}>
        <TouchableOpacity style={styles.thumbnail} onPress={() => router.push("/album")} accessibilityLabel="Open album">
          <Ionicons name="paw" size={22} color={colors.white} />
        </TouchableOpacity>

        <CaptureButton onPress={handleCapture} />

        <View style={styles.thumbnailSpacer} />
      </View>

      <WhatToAvoidModal visible={avoidVisible} onClose={() => setAvoidVisible(false)} />
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
});