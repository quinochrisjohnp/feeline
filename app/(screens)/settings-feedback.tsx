import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import FormField from "@/components/common/FormField";
import Button from "@/components/common/Button";
import { colors, radii, spacing, typography } from "@/constants/theme";

type FeedbackView = "form" | "success";

// TODO(backend): submit to a real feedback endpoint once the API exists.
export default function GiveFeedback() {
  const router = useRouter();
  const [view, setView] = useState<FeedbackView>("form");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!title.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Please fill in all fields before submitting.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setView("success");
  };

  if (view === "success") {
    return (
      <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
        <DetailScreenHeader title="Give us Feedback" />
        <View style={styles.successBody}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={36} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successMessage}>Your feedback has been sent.</Text>
          <Button label="Done" onPress={() => router.back()} style={styles.successButton} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll keyboardAware edges={["left", "right", "bottom"]} padded={false} contentContainerStyle={styles.content}>
      <DetailScreenHeader title="Give us Feedback" />
      <View style={styles.body}>
        <FormField label="Title" value={title} onChangeText={setTitle} placeholder="Title" />
        <FormField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com"
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <FormField label="Subject" value={subject} onChangeText={setSubject} placeholder="Subject" />
        <FormField label="Message" value={message} onChangeText={setMessage}
          placeholder="Tell us what's on your mind..." multiline />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Submit" onPress={handleSubmit} fullWidth style={styles.submitButton} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  submitButton: { marginTop: spacing.sm },
  successBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  successTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.xs },
  successMessage: { ...typography.body, color: colors.textMuted, textAlign: "center", marginBottom: spacing.xl },
  successButton: { minWidth: 160 },
});