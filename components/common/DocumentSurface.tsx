import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, dimensions, radii, spacing } from "@/constants/theme";
export default function DocumentSurface({ children }: { children: React.ReactNode }) {
  return <View style={styles.surface}>{children}</View>;
}
const styles = StyleSheet.create({ surface: { width: "100%", maxWidth: dimensions.contentMaxWidth,
  alignSelf: "center", backgroundColor: colors.background, borderRadius: radii.lg,
  borderWidth: 1, borderColor: colors.border, padding: spacing.md } });
