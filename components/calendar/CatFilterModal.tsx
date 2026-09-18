import React from "react";
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

interface CatFilterModalProps {
  visible: boolean;
  options: { id: string; name: string }[];
  selectedCatId: string | null;
  onSelect: (catId: string | null) => void;
  onClose: () => void;
}

export default function CatFilterModal({ visible, options: destinations, selectedCatId, onSelect, onClose }: CatFilterModalProps) {
  const options = [
    { id: null as string | null, name: "All Cats" },
    ...destinations,
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.sheet}>
          <Text style={styles.title}>Select</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item.id ?? "all"}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <View style={styles.avatar}>
                  <Ionicons name="paw" size={16} color={colors.textMuted} />
                </View>
                <Text style={styles.rowLabel}>{item.name}</Text>
                {selectedCatId === item.id ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            )}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", paddingHorizontal: spacing.lg },
  sheet: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg, maxHeight: "70%", ...shadows.floating },
  title: { ...typography.subheading, color: colors.textPrimary, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
});