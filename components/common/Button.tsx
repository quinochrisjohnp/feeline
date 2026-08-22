import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

type ButtonVariant = "primary" | "outline" | "danger" | "google";
type ButtonSize = "md" | "sm";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === "sm" ? styles.sizeSm : styles.sizeMd,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "danger" ? colors.white : colors.textPrimary}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
          <Text style={[styles.label, textStyles[variant]]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  sizeMd: { paddingVertical: spacing.sm + 2 },
  sizeSm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.5 },
  contentRow: { flexDirection: "row", alignItems: "center" },
  iconSlot: { marginRight: spacing.xs },
  label: { ...typography.button },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.textPrimary },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  danger: { backgroundColor: colors.danger },
  google: { backgroundColor: colors.white, ...shadows.card },
};

const textStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.white },
  outline: { color: colors.textPrimary },
  danger: { color: colors.white },
  google: { color: colors.textPrimary },
};