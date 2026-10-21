import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MockPhoto from "@/components/common/MockPhoto";
import type { Cat } from "@/types/models";
import { colors, fontFamily, radii, spacing, typography } from "@/constants/theme";
export default function WellnessCatHeader({ cat }: { cat: Cat }) {
  return <View style={styles.row}>
    <View style={styles.photo}><MockPhoto imageUri={cat.photoUri} icon="paw" size={28} label={cat.name + " profile photo"} /></View>
    <Text style={styles.name}>{cat.name}</Text>
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  photo: { width: 44, height: 44, borderRadius: radii.pill, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.placeholder },
  name: { ...typography.bodyMedium, fontFamily: fontFamily.heading, color: colors.textPrimary, flex: 1 },
});
