import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import { colors, dimensions, radii, spacing, typography } from "@/constants/theme";

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = "paw-outline",
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={dimensions.iconLarge} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  iconWrap: {
    width: dimensions.emptyStateIcon,
    height: dimensions.emptyStateIcon,
    borderRadius: radii.pill,
    backgroundColor: colors.placeholder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.subheading, color: colors.textPrimary, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  action: { marginTop: spacing.lg },
});