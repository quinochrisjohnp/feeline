import DialogActions from "@/components/common/DialogActions";
import React from "react";
import { StyleSheet, Text } from "react-native";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";
import type { CameraDetectionNotice } from "@/utils/cameraPresentation";

export default function CameraErrorModal({ notice, onClose, onPhotoTips, onSettings }: {
  notice: CameraDetectionNotice; onClose(): void; onPhotoTips(): void; onSettings?: () => void;
}) {
  return <ModalSurface visible onClose={onClose}>
    <Text style={styles.title} accessibilityRole="header">{notice.title}</Text>
    <Text style={styles.message} accessibilityRole="alert">{notice.message}</Text>
    <DialogActions first={{ label: "Try another photo", onPress: onClose }}
      second={{ label: "View photo tips", variant: "outline", onPress: onPhotoTips }} />
    {onSettings ? <Button label="Open Settings" size="compact" variant="text" onPress={onSettings} /> : null}
  </ModalSurface>;
}
const styles = StyleSheet.create({
  title: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, textAlign: "center" },
  message: { ...typography.body, fontFamily: fontFamily.body, textAlign: "center", color: colors.textSecondary, marginVertical: spacing.sm },
});
