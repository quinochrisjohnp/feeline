import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "@/constants/theme";
import { StatusBar } from "expo-status-bar";
import ModuleBackground from "./ModuleBackground";
import type { BackgroundModule } from "@/constants/moduleBackgrounds";

interface FullBleedScreenProps {
  children: React.ReactNode;
  module?: BackgroundModule;
  backgroundColor?: string;
  statusBarStyle?: "light" | "dark" | "auto";
  style?: StyleProp<ViewStyle>;
}

/**
 * Edge-to-edge wrapper for screens that must occupy the entire display
 * with no unintended white gaps (camera viewfinder, photo detail, full
 * emotion-result screens). Deliberately does NOT use SafeAreaView — the
 * background should extend behind the notch/home indicator. Screens using
 * this apply their own safe-area insets (via useSafeAreaInsets) only to
 * the specific elements that need to avoid overlapping system UI, e.g.
 * through DetailScreenHeader.
 */
export default function FullBleedScreen({
  children,
  module,
  backgroundColor = colors.cameraBackground,
  statusBarStyle = "light",
  style,
}: FullBleedScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {module ? <ModuleBackground module={module} /> : null}
      <StatusBar style={statusBarStyle} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
