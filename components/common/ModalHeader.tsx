import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";
export default function ModalHeader({ title, onClose, onEdit, disabled = false }: {
  title: string; onClose(): void; onEdit?: () => void; disabled?: boolean;
}) {
  return <View style={styles.row}>
    <Text style={styles.title} accessibilityRole="header">{title}</Text>
    {onEdit ? <Button variant="icon" label="Edit reminder" disabled={disabled} onPress={onEdit}
      leftIcon={<Ionicons name="pencil-outline" size={20} color={colors.textPrimary} />} /> : null}
    <Button variant="icon" label="Close" disabled={disabled} onPress={onClose}
      leftIcon={<Ionicons name="close" size={22} color={colors.textPrimary} />} />
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  title: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, flex: 1 },
});
