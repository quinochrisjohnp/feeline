import React from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Button from "./Button";
import ModalSurface from "./ModalSurface";
import { colors, dimensions, spacing, typography } from "@/constants/theme";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Hides the Cancel button for single-action "info" dialogs like
   * "Image Saved! / Continue" or "Cat Profile Saved! / Continue". */
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < dimensions.compactWidth || fontScale > 1.3;
  return (
    <ModalSurface visible={visible} onClose={onCancel}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={[styles.actions, stacked && styles.stacked]}>
            {(!hideCancel || destructive) && (
              <Button label={cancelLabel} variant="outline" onPress={onCancel} style={!stacked && styles.actionButton} />
            )}
            <Button
              label={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              onPress={onConfirm}
              style={!stacked && styles.actionButton}
            />
          </View>
    </ModalSurface>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.subheading, color: colors.textPrimary, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  stacked: { flexDirection: "column" },
  actionButton: { flex: 1 },
});
