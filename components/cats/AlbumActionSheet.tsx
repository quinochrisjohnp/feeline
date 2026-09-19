import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, dimensions, radii, shadows, spacing, typography } from "@/constants/theme";

interface AlbumActionSheetProps {
  visible: boolean;
  albumName: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Contextual Rename/Delete sheet shown after long-pressing an album in
 * Cat Album. Not visible during normal browsing. */
export default function AlbumActionSheet({ visible, albumName, onRename, onDelete, onClose }: AlbumActionSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose}
          accessibilityLabel="Close album actions" accessibilityRole="button" />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <ScrollView>
          <Text style={styles.title} accessibilityRole="header">
            {albumName}
          </Text>

          <TouchableOpacity style={styles.row} onPress={onRename} accessibilityRole="button">
            <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.rowLabel}>Rename</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={onDelete} accessibilityRole="button">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.rowLabel, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelRow} onPress={onClose} accessibilityRole="button">
            <Text style={styles.cancelLabel}>Cancel</Text>
          </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "85%",
    ...shadows.floating,
  },
  title: { ...typography.label, color: colors.textMuted, textAlign: "center", marginBottom: spacing.md },
  row: {
    minHeight: dimensions.touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  cancelRow: { minHeight: dimensions.touchTarget, alignItems: "center", paddingTop: spacing.md, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  cancelLabel: { ...typography.bodyMedium, color: colors.textSecondary },
});
