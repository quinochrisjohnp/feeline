import DialogActions from "./DialogActions";
import React from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Button from "./Button";
import ModalSurface from "./ModalSurface";
import { colors, dimensions, fontFamily, spacing, typography } from "@/constants/theme";

interface ConfirmModalProps {
  visible: boolean;
  balanced?: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Hides the Cancel button for single-action "info" dialogs like
   * "Image Saved! / Continue" or "Cat Profile Saved! / Continue". */
  hideCancel?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  balanced = true,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  hideCancel = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < dimensions.compactWidth || fontScale > 1.3;
  return (
    <ModalSurface visible={visible} onClose={() => { if (!busy) onCancel(); }}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {balanced && !hideCancel ? <DialogActions
            first={{ label: cancelLabel, variant: "outline", onPress: onCancel, disabled: busy }}
            second={{ label: confirmLabel, onPress: onConfirm, loading: busy, variant: destructive ? "danger" : "primary" }} /> : <View style={[styles.actions, stacked && styles.stacked]}>
            {(!hideCancel || destructive) && (
              <Button label={cancelLabel} variant="text" size="compact" onPress={onCancel} disabled={busy} style={!stacked && styles.actionButton} />
            )}
            <Button
              size="compact" label={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              onPress={onConfirm}
              loading={busy}
              style={!stacked && styles.actionButton}
            />
          </View>}
    </ModalSurface>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, textAlign: "center" },
  message: { ...typography.body, fontFamily: fontFamily.body, fontSize: 15, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  stacked: { flexDirection: "column" },
  actionButton: { flex: 1 },
});
