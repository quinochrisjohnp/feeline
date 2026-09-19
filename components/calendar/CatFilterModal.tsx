import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalSurface from "@/components/common/ModalSurface";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface CatFilterModalProps {
  visible: boolean;
  options: { id: string; name: string }[];
  selectedCatId: string | null;
  onSelect: (catId: string | null) => void;
  onClose: () => void;
}

export default function CatFilterModal({ visible, options: destinations, selectedCatId, onSelect, onClose }: CatFilterModalProps) {
  const options = [{ id: null as string | null, name: "All Cats" }, ...destinations];
  return (
    <ModalSurface visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Select</Text>
        <TouchableOpacity style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close cat filter">
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      {options.map((item) => (
        <TouchableOpacity key={item.id ?? "all"} style={styles.row} accessibilityRole="radio"
          accessibilityLabel={item.name} accessibilityState={{ checked: selectedCatId === item.id }}
          onPress={() => { onSelect(item.id); onClose(); }}>
          <View style={styles.avatar}><Ionicons name="paw" size={20} color={colors.textSecondary} /></View>
          <Text style={styles.rowLabel}>{item.name}</Text>
          {selectedCatId === item.id ? <Ionicons name="checkmark" size={22} color={colors.textPrimary} /> : null}
        </TouchableOpacity>
      ))}
    </ModalSurface>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  title: { ...typography.subheading, color: colors.textPrimary },
  close: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", minHeight: 56, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
});
