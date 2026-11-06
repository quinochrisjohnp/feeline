import { useWellnessNavigationSafety } from "@/context/WellnessContext";
import DocumentSurface from "@/components/common/DocumentSurface";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";

const FEATURES = [
  "Capture a cat photo or choose one from your gallery for AI-based interpretation",
  "View Happy, Neutral, Fearful, or Angry cues with confidence and recommended actions",
  "Create up to 20 cat profiles and organize saved images in their albums",
  "Use Unknown Cats for images not assigned to a personal cat profile",
  "Browse detection history, birthdays, and check-in reminders in the Calendar",
  "Set local check-in reminders after repeated Angry or Fearful results",
  "Share app issues and suggestions through Give us Feedback",
];

export default function AboutFeeline() {
  useWellnessNavigationSafety(false);
  const router = useRouter();
  return (
    <ScreenContainer module="settings" edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader transparent title="About FeELINE" onBack={() => router.dismissTo("/settings")} />
      <ScrollView contentContainerStyle={styles.content}>
      <DocumentSurface>
        <Text style={styles.paragraph}>
          FeELINE is a thesis-based mobile application focused on recognizing observable
          emotional cues in Puspin cats from images. It helps cat owners reflect on visual
          cues and keep an organized record of their cats, photos, and detection results.
        </Text>
        <Text style={styles.paragraph}>
          A captured or selected image is sent to the connected AI service, which interprets
          cues in four categories: Happy, Neutral, Fearful, and Angry. These labels are
          estimates from a single image, not proof of what a cat feels. Lighting, pose,
          image quality, and the model’s limitations can affect results.
        </Text>

        <Text style={styles.subheading} accessibilityRole="header">The app allows users to:</Text>
        {FEATURES.map((feature) => (
          <View key={feature} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{feature}</Text>
          </View>
        ))}

        <Text style={[styles.paragraph, styles.spaced]}>
          Confidence reflects the model’s prediction, not a guarantee of accuracy. Accepted
          results below 50% include a caution while keeping their recommendations available.
          Consider the photo together with your cat’s behavior and surroundings. Check-in
          reminders are prompts to observe your cat, not medical alerts or continuous monitoring.
        </Text>
        <Text style={styles.paragraph}>
          Developed for academic, educational, and research purposes, FeELINE does not diagnose
          illness or replace veterinary advice, diagnosis, or treatment. Google sign-in connects
          you to your account; analysis and account data require network services. Review the
          Privacy Policy and Terms and Conditions for information about uploads, stored data,
          and responsible use. Send questions or suggestions through Give us Feedback.
        </Text>
      </DocumentSurface>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  paragraph: { ...typography.body, fontFamily: fontFamily.body, color: colors.textSecondary, marginBottom: spacing.md },
  spaced: { marginTop: spacing.xs },
  subheading: { ...typography.bodyMedium, fontFamily: fontFamily.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  bulletRow: { flexDirection: "row", marginBottom: spacing.xs, paddingLeft: spacing.xs },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8, marginRight: spacing.sm },
  bulletText: { ...typography.body, color: colors.textSecondary, flex: 1 },
});