import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, dimensions, interaction, radii, shadows } from "@/constants/theme";

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export default function CaptureButton({ onPress, disabled }: CaptureButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.ring, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={interaction.pressedOpacity}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel="Capture photo"
    >
      <View style={styles.inner}>
        <Ionicons name="aperture-outline" size={30} color={colors.textPrimary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: dimensions.capture,
    height: dimensions.capture,
    borderRadius: radii.pill,
    backgroundColor: colors.cameraRing,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.floating,
  },
  inner: {
    width: dimensions.captureInner,
    height: dimensions.captureInner,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: interaction.disabledOpacity },
});