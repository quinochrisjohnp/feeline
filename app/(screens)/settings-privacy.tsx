import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import PolicySection from "@/components/common/PolicySection";
import { colors, spacing, typography } from "@/constants/theme";

export default function PrivacyPolicy() {
  return (
    <ScreenContainer scroll edges={["left", "right", "bottom"]} padded={false} contentContainerStyle={styles.content}>
      <DetailScreenHeader title="Privacy Policy" />
      <View style={styles.body}>
        <PolicySection title="Google Login">
          The app uses Google authentication for secure login and only accesses basic account information such as
          the user&apos;s name and email address.
        </PolicySection>

        <PolicySection title="Image Data">
          Images uploaded for emotion detection are stored locally or securely within the app system for analysis
          purposes only.
        </PolicySection>

        <PolicySection title="Cat Profile Data">
          Information such as cat name, birthdate, gender, and emotion history is stored to improve user experience
          and tracking.
        </PolicySection>

        <PolicySection title="Data Usage">
          Collected data is used solely for app functionality and research purposes. Personal data is not sold or
          shared with third parties.
        </PolicySection>

        <PolicySection title="Data Deletion">Users may delete their stored data through app settings.</PolicySection>

        <PolicySection title="Security">
          Reasonable measures are taken to protect stored information from unauthorized access.
        </PolicySection>

        <Text style={styles.consent}>
          By continuing to use FeELINE, you consent to the collection and use of your information as described in
          this Privacy Policy.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  consent: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18, fontStyle: "italic" },
});