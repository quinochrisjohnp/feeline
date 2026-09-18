import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.sheet}>
          <Text style={styles.title} numberOfLines={1}>
            {albumName}
          </Text>

          <TouchableOpacity style={styles.row} onPress={onRename}>
            <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.rowLabel}>Rename</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.rowLabel, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelRow} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
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
    ...shadows.floating,
  },
  title: { ...typography.label, color: colors.textMuted, textAlign: "center", marginBottom: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  cancelRow: { alignItems: "center", paddingTop: spacing.md, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  cancelLabel: { ...typography.bodyMedium, color: colors.textSecondary },
});
