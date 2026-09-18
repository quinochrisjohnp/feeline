import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import { colors, spacing, typography } from "@/constants/theme";

const FEATURES = [
  "Create and manage cat profiles",
  "Detect Cat Emotions",
  "Store scanned images",
  "Track cats emotion over time in dates",
];

export default function AboutFeeline() {
  return (
    <ScreenContainer scroll edges={["left", "right", "bottom"]} padded={false} contentContainerStyle={styles.content}>
      <DetailScreenHeader title="About FeELINE" />
      <View style={styles.body}>
        <Text style={styles.paragraph}>
          FeELINE is an AI-powered cat emotion detection application designed to help cat owners better understand
          their pets&apos; emotional states.
        </Text>
        <Text style={styles.paragraph}>
          Using image-based analysis, the app identifies common feline emotions such as Happy, Neutral, Fearful, and
          Angry.
        </Text>

        <Text style={styles.subheading}>The app allows users to:</Text>
        {FEATURES.map((feature) => (
          <View key={feature} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{feature}</Text>
          </View>
        ))}

        <Text style={[styles.paragraph, styles.spaced]}>
          FeELINE aims to promote better pet care by providing insights into a cat&apos;s emotional well-being
          through accessible and user-friendly technology.
        </Text>
        <Text style={styles.paragraph}>
          This application is developed as part of an academic project and is intended for educational and research
          purposes.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  paragraph: { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  spaced: { marginTop: spacing.xs },
  subheading: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  bulletRow: { flexDirection: "row", marginBottom: spacing.xs, paddingLeft: spacing.xs },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8, marginRight: spacing.sm },
  bulletText: { ...typography.body, color: colors.textSecondary, flex: 1 },
});