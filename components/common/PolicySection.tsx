import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";

interface PolicySectionProps {
  title: string;
  children: React.ReactNode;
}

/** Titled paragraph block used by Privacy Policy / Terms & Conditions. */
export default function PolicySection({ title, children }: PolicySectionProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  title: { ...typography.bodyMedium, fontFamily: fontFamily.heading, color: colors.textPrimary, marginBottom: spacing.xs },
  body: { ...typography.body, fontFamily: fontFamily.body, color: colors.textSecondary },
});
