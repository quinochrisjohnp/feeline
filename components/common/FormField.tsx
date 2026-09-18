import React, { forwardRef, useId, useState } from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, dimensions, interaction, radii, spacing, typography } from "@/constants/theme";

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /** For an existing picker/sheet. This component never opens a native picker. */
  onSelect?: () => void;
}

/** Shared text, email, date, multiline and selectable field presentation. */
const FormField = forwardRef<TextInput, FormFieldProps>(function FormField({
  label, error, hint, disabled = false, containerStyle, onSelect, style, multiline,
  editable = true, readOnly = false, onFocus, onBlur, accessibilityLabel, accessibilityHint, ...props
}, ref) {
  const [focused, setFocused] = useState(false);
  const labelId = useId();
  const inactive = disabled || !editable || readOnly;
  const fieldStyle = [styles.chrome, styles.input, multiline && styles.multiline, inactive && styles.inactive,
    style, focused && styles.focused, !!error && styles.invalid];
  const description = [accessibilityHint, error || hint].filter(Boolean).join(". ");

  return (
    <View style={[styles.field, containerStyle]}>
      <Text nativeID={labelId} style={styles.label}>{label}</Text>
      {onSelect ? (
        <Pressable onPress={onSelect} disabled={inactive} accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabel ?? label}: ${props.value || props.placeholder || "Select"}`}
          accessibilityHint={description} accessibilityState={{ disabled: inactive }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={({ pressed }) => [styles.chrome, inactive && styles.inactiveSurface,
            focused && styles.focused, !!error && styles.invalid, styles.select, pressed && styles.pressed]}>
          <Text style={[styles.value, !props.value && styles.placeholder]}>{props.value || props.placeholder || "Select"}</Text>
          <Ionicons name="chevron-down" size={dimensions.iconSmall} color={colors.textSecondary} />
        </Pressable>
      ) : (
        <TextInput {...props} ref={ref} editable={!inactive} multiline={multiline}
          style={fieldStyle} placeholderTextColor={colors.textMuted} selectionColor={colors.primaryDark}
          textAlignVertical={multiline ? "top" : "center"}
          accessibilityLabel={accessibilityLabel ?? label} accessibilityLabelledBy={labelId}
          accessibilityHint={description} accessibilityState={{ disabled: disabled }}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }} />
      )}
      {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>
        : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

export default FormField;

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs },
  input: { ...typography.body, color: colors.textPrimary },
  chrome: { minHeight: dimensions.input,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  multiline: { minHeight: dimensions.messageInput, borderRadius: radii.lg },
  focused: { borderColor: colors.focus },
  invalid: { borderColor: colors.dangerStrong },
  inactive: { backgroundColor: colors.background, color: colors.textSecondary },
  inactiveSurface: { backgroundColor: colors.background },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  error: { ...typography.caption, color: colors.dangerStrong, marginTop: spacing.xxs },
  select: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  value: { ...typography.body, color: colors.textPrimary, flex: 1 },
  placeholder: { color: colors.textMuted },
  pressed: { opacity: interaction.pressedOpacity },
});
