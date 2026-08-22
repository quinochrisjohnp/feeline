import React from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/constants/theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: readonly Edge[];
  padded?: boolean;
  backgroundColor?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenContainer({
  children,
  scroll = false,
  edges = ["top", "left", "right", "bottom"],
  padded = true,
  backgroundColor = colors.background,
  contentContainerStyle,
  style,
}: ScreenContainerProps) {
  return (
    <SafeAreaView edges={edges as Edge[]} style={[styles.safe, { backgroundColor }, style]}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[padded && styles.padded, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.padded, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
});