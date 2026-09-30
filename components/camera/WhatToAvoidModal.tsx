import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface WhatToAvoidModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: "blurry", label: "Blurry Images", icon: "camera-outline" as const },
  { key: "dark", label: "Dark Images", icon: "moon-outline" as const },
  { key: "notCats", label: "Not Cats", icon: "paw-outline" as const },
  { key: "cropped", label: "Cropped Image", icon: "crop-outline" as const },
  { key: "deformities", label: "Physical Deformities", icon: "alert-circle-outline" as const },
];

export default function WhatToAvoidModal({ visible, onClose }: WhatToAvoidModalProps) {
  return (
    <ModalSurface visible={visible} onClose={onClose}>
      <View style={styles.titleRow}>
        <Ionicons name="warning-outline" size={22} color={colors.textPrimary} />
        <Text style={styles.title}>What to Avoid</Text>
        <Ionicons name="warning-outline" size={22} color={colors.textPrimary} />
      </View>
      <Text style={styles.subtitle}>These images may lead to less accurate emotion detection results.</Text>

      <View style={styles.grid}>
        {CATEGORIES.map((category) => (
          <View key={category.key} style={styles.card}>
            <View style={styles.cardImage}>
              <Ionicons name={category.icon} size={30} color={colors.textMuted} />
            </View>
            <Text style={styles.cardLabel}>{category.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>Examples are placeholders. Physical differences do not make a cat invalid;
        this prototype may have difficulty interpreting some images.</Text>
      <Button label="Continue" onPress={onClose} fullWidth style={styles.continueButton} />
    </ModalSurface>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginBottom: spacing.xs },
  title: { ...typography.subheading, color: colors.textPrimary, flexShrink: 1, textAlign: "center" },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", marginBottom: spacing.md, alignItems: "center" },
  cardImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  cardLabel: { ...typography.label, color: colors.textPrimary, textAlign: "center" },
  note: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  continueButton: { marginTop: spacing.sm },
});