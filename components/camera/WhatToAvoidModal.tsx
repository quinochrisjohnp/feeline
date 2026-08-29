import React from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/common/Button";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
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

            <Button label="Continue" onPress={onClose} fullWidth style={styles.continueButton} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", paddingHorizontal: spacing.lg },
  sheet: { backgroundColor: colors.white, borderRadius: radii.xl, padding: spacing.lg, maxHeight: "85%", ...shadows.floating },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginBottom: spacing.xs },
  title: { ...typography.heading, color: colors.textPrimary },
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
  continueButton: { marginTop: spacing.sm },
});