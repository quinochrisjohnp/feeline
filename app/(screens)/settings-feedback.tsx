
import React, { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import FormField from "@/components/common/FormField";
import Button from "@/components/common/Button";
import ConfirmModal from "@/components/common/ConfirmModal";
import { apiFetch } from "@/services/api";

import {
  colors,
  dimensions,
  fontFamily,
  radii,
  spacing,
  typography,
} from "@/constants/theme";

type Field = "title" | "email" | "subject" | "message";

type FeedbackValues = Record<Field, string>;

export default function GiveFeedback() {
  const router = useRouter();

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [values, setValues] = useState<FeedbackValues>({
    title: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<Field, string>>
  >({});

  const submitting = useRef(false);

  const titleRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const subjectRef = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);

  const refs = {
    title: titleRef,
    email: emailRef,
    subject: subjectRef,
    message: messageRef,
  };

  const goBack = () => router.dismissTo("/settings");

  const change = (field: Field, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleSubmit = async () => {
    if (submitting.current || success) return;

    const next: Partial<Record<Field, string>> = {};

    for (const field of [
      "title",
      "email",
      "subject",
      "message",
    ] as const) {
      if (!values[field].trim()) {
        next[field] = `Please fill in the ${field} field.`;
      }
    }

    if (
      values.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        values.email.trim()
      )
    ) {
      next.email = "Please enter a valid email address.";
    }

    if (values.title.trim().length > 150) {
      next.title = "Title must be 150 characters or less.";
    }

    if (values.email.trim().length > 255) {
      next.email = "Email must be 255 characters or less.";
    }

    if (values.subject.trim().length > 255) {
      next.subject = "Subject must be 255 characters or less.";
    }

    if (values.message.trim().length > 5000) {
      next.message = "Message must be 5000 characters or less.";
    }

    setErrors(next);

    const first = (Object.keys(next) as Field[])[0];

    if (first) {
      refs[first].current?.focus();
      return;
    }

    submitting.current = true;
    setLoading(true);
    Keyboard.dismiss();

    try {
      const response = await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          title: values.title.trim(),
          email: values.email.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.status !== "success") {
        throw new Error(
          result.message ||
            result.error ||
            "Failed to submit feedback."
        );
      }

      // Show success only after the backend confirms saving.
      setSuccess(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit feedback. Please try again.";

      Alert.alert("Feedback Submission Failed", message);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      module="settings"
      keyboardAware
      edges={["left", "right", "bottom"]}
      padded={false}
    >
      <DetailScreenHeader
        transparent
        title="Give us Feedback"
        onBack={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.body}>
          <Text
            style={styles.heading}
            accessibilityRole="header"
          >
            Feedback Form
          </Text>

          <Text style={styles.note}>
            Share your thoughts and suggestions to help us
            improve FeELINE.
          </Text>

          <FormField
            ref={titleRef}
            label="Title"
            value={values.title}
            error={errors.title}
            onChangeText={(text) => change("title", text)}
            placeholder="Title"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <FormField
            ref={emailRef}
            label="Email"
            value={values.email}
            error={errors.email}
            onChangeText={(text) => change("email", text)}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => subjectRef.current?.focus()}
          />

          <FormField
            ref={subjectRef}
            label="Subject"
            value={values.subject}
            error={errors.subject}
            onChangeText={(text) => change("subject", text)}
            placeholder="Subject"
            returnKeyType="next"
            onSubmitEditing={() => messageRef.current?.focus()}
          />

          <FormField
            ref={messageRef}
            label="Message"
            value={values.message}
            error={errors.message}
            onChangeText={(text) => change("message", text)}
            placeholder="Tell us what's on your mind..."
            multiline
            scrollEnabled
            style={styles.message}
          />

          <Button
            label={loading ? "Submitting..." : "Submit"}
            onPress={handleSubmit}
            disabled={loading || success}
            style={{ alignSelf: "flex-end" }}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={success}
        title="Thank you for your Feedback!"
        message="Your feedback has been submitted successfully."
        confirmLabel="Continue"
        hideCancel
        onConfirm={goBack}
        onCancel={goBack}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  body: {
    width: "100%",
    maxWidth: dimensions.contentMaxWidth,
    alignSelf: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  heading: {
    ...typography.subheading,
    fontFamily: fontFamily.heading,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  note: {
    ...typography.caption,
    fontFamily: fontFamily.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  message: {
    minHeight: dimensions.messageInput,
    maxHeight: 240,
  },
});
