import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/constants/theme";

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
  const tint = destructive ? colors.danger : colors.textPrimary;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, destructive && styles.iconWrapDanger]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      {showChevron && !destructive ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  iconWrapDanger: { backgroundColor: colors.dangerSoft },
  label: { ...typography.body, flex: 1 },
});