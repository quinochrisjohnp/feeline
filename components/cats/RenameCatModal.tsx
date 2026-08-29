import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "@/components/common/Button";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

interface RenameCatModalProps {
  visible: boolean;
  initialName: string;
  onCancel: () => void;
  onSave: (newName: string) => void;
}

/** Renaming here renames the connected Cat Profile too — both read/write
 * through the same CatDataContext record. */
export default function RenameCatModal({ visible, initialName, onCancel, onSave }: RenameCatModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Rename Album</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Album name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
          />
          <View style={styles.actions}>
            <Button label="Cancel" variant="outline" onPress={onCancel} style={styles.actionButton} />
            <Button label="Save" onPress={handleSave} disabled={!name.trim()} style={styles.actionButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  card: { width: "100%", backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg, ...shadows.floating },
  title: { ...typography.subheading, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
    marginBottom: spacing.md,
  },
  actions: { flexDirection: "row", gap: spacing.sm },
  actionButton: { flex: 1 },
});