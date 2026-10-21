import React from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { colors, dimensions, fontFamily, interaction, radii, shadows, spacing, typography } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "text" | "google" | "icon" | "dangerText";
type ButtonSize = "md" | "sm" | "compact" | "default";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export default function Button({ label, onPress, variant = "primary", size = "md", fullWidth = false,
  loading = false, disabled = false, leftIcon, accessibilityLabel, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  const ink = disabled ? colors.textSecondary : textStyles[variant].color;

  return (
    <Pressable
      style={({ pressed }) => [styles.base, (size === "sm" || size === "compact") ? styles.sizeSm : styles.sizeMd,
        variantStyles[variant], variant === "icon" && styles.iconButton, fullWidth && styles.fullWidth, style,
        disabled && styles.disabled, pressed && !isDisabled && styles.pressed]}
      onPress={onPress} disabled={isDisabled} accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <View style={[styles.contentRow, loading && styles.hidden]}>
        {leftIcon ? <View style={variant !== "icon" && styles.iconSlot}>{leftIcon}</View> : null}
        {variant !== "icon" ? <Text style={[styles.label, textStyles[variant], { color: ink }]}>{label}</Text> : null}
      </View>
      {loading && <ActivityIndicator style={styles.spinner} color={ink} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  sizeMd: { minHeight: dimensions.button, paddingVertical: spacing.xs },
  sizeSm: { minHeight: dimensions.touchTarget, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  iconButton: { width: dimensions.touchTarget, minWidth: dimensions.touchTarget, paddingHorizontal: 0 },
  fullWidth: { alignSelf: "stretch" },
  disabled: { backgroundColor: colors.divider, borderColor: colors.border, elevation: 0, shadowOpacity: 0 },
  pressed: { opacity: interaction.pressedOpacity },
  contentRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  hidden: { opacity: 0 },
  spinner: { position: "absolute" },
  iconSlot: { marginRight: spacing.xs },
  label: { ...typography.button, fontFamily: fontFamily.medium, fontSize: 15, textAlign: "center", flexShrink: 1 },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.textPrimary },
  secondary: { backgroundColor: colors.primary },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.dangerStrong },
  text: { backgroundColor: "transparent" },
  icon: { backgroundColor: "transparent" },
  dangerText: { backgroundColor: "transparent" },
  google: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.card },
};
const textStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.textInverse },
  secondary: { color: colors.textPrimary },
  outline: { color: colors.textPrimary },
  danger: { color: colors.textInverse },
  text: { color: colors.textPrimary, textDecorationLine: "underline" },
  icon: { color: colors.textPrimary },
  dangerText: { color: colors.dangerStrong },
  google: { color: colors.textPrimary },
};
