import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, dimensions, getTabBarClearance, spacing } from "@/constants/theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: readonly Edge[];
  padded?: boolean;
  backgroundColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Opt in for forms; layout stays unchanged for existing fixed screens. */
  keyboardAware?: boolean;
  keyboardVerticalOffset?: number;
  tabBar?: boolean;
  verticalPadding?: boolean;
  constrainWidth?: boolean;
}

export default function ScreenContainer({ children, scroll = false, edges = ["top", "left", "right", "bottom"],
  padded = true, backgroundColor = colors.background, contentContainerStyle, style, keyboardAware = false,
  keyboardVerticalOffset = 0, tabBar = false, verticalPadding = false, constrainWidth = false }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const contentStyle = [padded && styles.padded, verticalPadding && styles.verticalPadding,
    constrainWidth && styles.constrained, contentContainerStyle,
    tabBar && { paddingBottom: getTabBarClearance(edges.includes("bottom") ? 0 : insets.bottom) }];
  const content = scroll ? (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      contentContainerStyle={[styles.scrollContent, ...contentStyle]}>
      {children}
    </ScrollView>
  ) : <View style={[styles.flex, ...contentStyle]}>{children}</View>;

  return (
    <SafeAreaView edges={edges as Edge[]} style={[styles.safe, { backgroundColor }, style]}>
      {keyboardAware ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={keyboardVerticalOffset}>{content}</KeyboardAvoidingView>
      ) : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  padded: { paddingHorizontal: spacing.lg },
  verticalPadding: { paddingVertical: spacing.md },
  constrained: { width: "100%", maxWidth: dimensions.contentMaxWidth, alignSelf: "center" },
});
