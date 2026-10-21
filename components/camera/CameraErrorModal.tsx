import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalSurface from "@/components/common/ModalSurface";
import ModalHeader from "@/components/common/ModalHeader";
import Button from "@/components/common/Button";
import { colors, dimensions, spacing, typography } from "@/constants/theme";
import type { CameraDetectionNotice } from "@/utils/cameraPresentation";

export default function CameraErrorModal({ notice, onClose, onPhotoTips, onSettings }: {
  notice: CameraDetectionNotice; onClose(): void; onPhotoTips(): void; onSettings?: () => void;
}) {
  return <ModalSurface visible onClose={onClose}>
    <ModalHeader title={notice.title} onClose={onClose} />
    <Ionicons name={notice.photoTips ? "camera-outline" : "alert-circle-outline"}
      size={dimensions.icon} color={colors.textPrimary} accessible={false} />
    <Text style={styles.message} accessibilityRole="alert">{notice.message}</Text>
    <View style={styles.actions}>
      <Button label="Try another photo" size="compact" onPress={onClose} />
      <Button label="View photo tips" size="compact" variant="text" onPress={onPhotoTips} />
      {onSettings ? <Button label="Open Settings" size="compact" variant="text" onPress={onSettings} /> : null}
    </View>
  </ModalSurface>;
}
const styles = StyleSheet.create({
  message: { ...typography.body, color: colors.textSecondary, marginVertical: spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, justifyContent: "flex-end" },
});
