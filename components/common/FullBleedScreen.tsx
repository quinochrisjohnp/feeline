import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { StatusBar } from "expo-status-bar";

interface FullBleedScreenProps {
  children: React.ReactNode;
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
  backgroundColor = "#000000",
  statusBarStyle = "light",
  style,
}: FullBleedScreenProps) {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <StatusBar style={statusBarStyle} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});