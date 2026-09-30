import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, dimensions, interaction, radii, spacing, typography } from "@/constants/theme";

interface SettingRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

export default function SettingRow({
  icon,
  label,
  onPress,
  destructive = false,
  showChevron = true,
}: SettingRowProps) {
  const tint = destructive ? colors.dangerStrong : colors.textPrimary;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={interaction.pressedOpacity} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.iconWrap, destructive && styles.iconWrapDanger]}>
        <Ionicons name={icon} size={dimensions.iconSmall} color={tint} />
      </View>
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      {showChevron && !destructive ? (
        <Ionicons name="chevron-forward" size={dimensions.iconSmall} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, minHeight: dimensions.settingRow, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  iconWrap: {
    width: dimensions.settingIcon,
    height: dimensions.settingIcon,
    borderRadius: radii.pill,
    backgroundColor: colors.placeholder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  iconWrapDanger: { backgroundColor: colors.dangerSoft },
  label: { ...typography.body, flex: 1 },
});