import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/constants/theme";

interface DetailScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  tintColor?: string;
  rightElement?: React.ReactNode;
  transparent?: boolean;
}

/** Back-button + title header used on every "deep" screen (Settings pages,
 * and Camera/Album flows in later phases) that sit outside the tab bar. */
export default function DetailScreenHeader({
  title,
  subtitle,
  onBack,
  tintColor = colors.textPrimary,
  rightElement,
  transparent = false,
}: DetailScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        { paddingTop: insets.top + spacing.sm },
        transparent ? styles.transparent : styles.opaque,
      ]}
    >
      <TouchableOpacity onPress={handleBack} accessibilityLabel="Go back" style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={tintColor} />
      </TouchableOpacity>
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: tintColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: tintColor }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{rightElement}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  opaque: { backgroundColor: colors.background },
  transparent: { backgroundColor: "transparent" },
  backButton: { width: 32 },
  titleWrap: { flex: 1 },
  title: { ...typography.subheading },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  right: { width: 32, alignItems: "flex-end" },
});