import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import { colors, radii, spacing, typography } from "@/constants/theme";

interface WhatToAvoidModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: "blurry", label: "Blurry Images", image: require("../images/cat_blurred.png") },
  { key: "dark", label: "Dark Images", image: require("../images/cat_dark.png") },
  { key: "notCats", label: "Not Cats", image: require("../images/dog.png") },
  { key: "cropped", label: "Cropped Image", image: require("../images/cat_cropped.png") },
  { key: "deformities", label: "Physical Deformities", image: require("../images/cat_deformaties.png") },
];

export default function WhatToAvoidModal({ visible, onClose }: WhatToAvoidModalProps) {
  return (
    <ModalSurface compact visible={visible} onClose={onClose}>
      <View style={styles.titleRow}>
        <Ionicons name="warning-outline" size={22} color={colors.textPrimary} />
        <Text style={styles.title}>What to Avoid</Text>
        <Ionicons name="warning-outline" size={22} color={colors.textPrimary} />
      </View>
      <Text style={styles.subtitle}>These images may lead to less accurate emotion detection results.</Text>

      <View style={styles.grid}>
        {[CATEGORIES.slice(0, 2), CATEGORIES.slice(2, 4), CATEGORIES.slice(4)].map((row, index) => (
          <View key={index} style={styles.row}>
          {row.map((category) => (
          <View key={category.key} style={styles.card}>
            <View style={styles.cardImage}>
              <Image source={category.image} resizeMode="cover" style={styles.image} accessibilityLabel={category.label} />
            </View>
            <Text style={styles.cardLabel}>{category.label}</Text>
          </View>
          ))}
          </View>
        ))}
      </View>

      <Text style={styles.note}>Examples illustrate image limitations. Physical differences do not make a cat invalid;
        this prototype may have difficulty interpreting some images.</Text>
      <Button label="Continue" onPress={onClose} fullWidth style={styles.continueButton} />
    </ModalSurface>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginBottom: spacing.xs },
  title: { ...typography.subheading, color: colors.textPrimary, flexShrink: 1, textAlign: "center" },
  subtitle: { ...typography.caption, color: colors.textMuted, textAlign: "center", marginBottom: spacing.xs },
  grid: { flex: 1, minHeight: 0, gap: spacing.xxs },
  row: { flex: 1, minHeight: 0, flexDirection: "row", justifyContent: "center", gap: spacing.xs },
  card: { width: "48%", minHeight: 0, alignItems: "center" },
  cardImage: {
    width: "100%", flex: 1, minHeight: 0,
    borderRadius: radii.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
  },
  cardLabel: { ...typography.caption, color: colors.textPrimary, textAlign: "center" },
  note: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  image: { width: "100%", height: "100%" },
  continueButton: { marginTop: spacing.xxs },
});