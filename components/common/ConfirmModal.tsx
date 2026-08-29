import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            {!hideCancel && (
              <Button label={cancelLabel} variant="outline" onPress={onCancel} style={styles.actionButton} />
            )}
            <Button
              label={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              onPress={onConfirm}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.floating,
  },
  title: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionButton: { flex: 1 },
});