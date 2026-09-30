import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import FormField from "@/components/common/FormField";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import { colors, dimensions, spacing, typography } from "@/constants/theme";

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
    <ModalSurface visible={visible} onClose={onCancel}>
          <Text style={styles.title} accessibilityRole="header">Rename Album</Text>
          <FormField
            label="Album name"
            value={name}
            onChangeText={setName}
            placeholder="Album name"
            error={!name.trim() ? "Enter an album name." : undefined}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <View style={styles.actions}>
            <Button label="Cancel" variant="outline" onPress={onCancel} style={styles.actionButton} />
            <Button label="Save" onPress={handleSave} disabled={!name.trim()} style={styles.actionButton} />
          </View>
    </ModalSurface>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.subheading, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.md },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  actionButton: { flexGrow: 1, flexBasis: dimensions.actionMinWidth },
});
