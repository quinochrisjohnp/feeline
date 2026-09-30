import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import { colors, spacing, typography } from "@/constants/theme";

const FEATURES = [
  "Create and manage cat profiles",
  "Explore mock image-based emotion interpretations",
  "Keep mock scanned images during the current session",
  "View emotion detection history by date",
];

export default function AboutFeeline() {
  const router = useRouter();
  return (
    <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader title="About FeELINE" onBack={() => router.dismissTo("/settings")} />
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.body}>
        <Text style={styles.paragraph}>
          FeELINE is an academic and research-oriented mobile prototype for an AI-powered cat emotion detection
          application. It is designed to help users interpret observable emotional cues in cat images.
        </Text>
        <Text style={styles.paragraph}>
          This frontend demonstrates image-based interpretations using mock results in four categories: Happy,
          Neutral, Fearful, and Angry. It does not perform real AI analysis.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">The app allows users to:</Text>
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
          purposes. It is not veterinary diagnosis or professional veterinary advice.
        </Text>
      </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  paragraph: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  spaced: { marginTop: spacing.xs },
  subheading: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  bulletRow: { flexDirection: "row", marginBottom: spacing.xs, paddingLeft: spacing.xs },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8, marginRight: spacing.sm },
  bulletText: { ...typography.body, color: colors.textSecondary, flex: 1 },
});