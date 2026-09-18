import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import { colors, spacing, typography } from "@/constants/theme";

const TERMS = [
  {
    title: "1. Emotion Prediction Accuracy",
    body: "FeELINE's emotion detection results are generated using AI-based image analysis and are not guaranteed to be 100% accurate.",
  },
  {
    title: "2. Informational & Educational Purpose",
    body: "The app is intended for informational and educational purposes only.",
  },
  {
    title: "3. Not a Substitute for Veterinary Advice",
    body: "FeELINE does not replace professional veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian for concerns about your cat's health or behavior.",
  },
  {
    title: "4. Responsibility for Uploaded Images",
    body: "Users are responsible for the images they upload and must ensure they have the right to use them within the app.",
  },
  {
    title: "5. Developer Liability",
    body: "The developers are not liable for any decisions made based on the app's emotion detection results.",
  },
  {
    title: "6. Updates to Features and Functionality",
    body: "Features and functionality may be updated, changed, or removed as the app continues to be developed.",
  },
  {
    title: "7. Misuse and Inappropriate Content",
    body: "Users must not upload inappropriate, harmful, or unrelated content through the app.",
  },
  {
    title: "8. Acceptance of Terms",
    body: "Continued use of FeELINE constitutes acceptance of these Terms and Conditions.",
  },
];

export default function TermsAndConditions() {
  return (
    <ScreenContainer scroll edges={["left", "right", "bottom"]} padded={false} contentContainerStyle={styles.content}>
      <DetailScreenHeader title="Terms and Conditions" />
      <View style={styles.body}>
        {TERMS.map((term) => (
          <View key={term.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{term.title}</Text>
            <Text style={styles.sectionBody}>{term.body}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs },
  sectionBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});