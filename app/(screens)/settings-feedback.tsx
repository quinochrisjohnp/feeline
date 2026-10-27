import { useWellnessNavigationSafety } from "@/context/WellnessContext";
import DocumentSurface from "@/components/common/DocumentSurface";
import React, { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

// ============================================================
// FEEDBACK SUBJECT OPTIONS
// ============================================================

const SUBJECT_OPTIONS = [
  "Bug Report",
  "Feature Suggestion",
  "Emotion Detection Concern",
  "App Experience",
  "Others",
] as const;

type Field = "title" | "subject" | "message";

type FeedbackValues = Record<Field, string>;

export default function GiveFeedback() {
  const router = useRouter();

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjectVisible, setSubjectVisible] = useState(false);

  useWellnessNavigationSafety(subjectVisible);

  const [values, setValues] = useState<FeedbackValues>({
    title: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<Field, string>>
  >({});

  const submitting = useRef(false);

  const titleRef = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);

  const goBack = () => router.dismissTo("/settings");

  // ============================================================
  // UPDATE FORM VALUES
  // ============================================================

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

  // ============================================================
  // SUBMIT FEEDBACK
  // ============================================================

  const handleSubmit = async () => {
    if (submitting.current || success) return;

    const next: Partial<Record<Field, string>> = {};

    for (const field of [
      "title",
      "subject",
      "message",
    ] as const) {
      if (!values[field].trim()) {
        next[field] = `Please fill in the ${field} field.`;
      }
    }

    if (values.title.trim().length > 50) {
      next.title = "Title must be 50 characters or less.";
    }

    if (
      values.subject &&
      !SUBJECT_OPTIONS.some(
        (option) => option === values.subject
      )
    ) {
      next.subject = "Please select a valid subject.";
    }

    if (values.message.trim().length > 255) {
      next.message = "Message must be 255 characters or less.";
    }

    setErrors(next);

    if (next.title) {
      titleRef.current?.focus();
      return;
    }

    if (next.subject) {
      Keyboard.dismiss();
      setSubjectVisible(true);
      return;
    }

    if (next.message) {
      messageRef.current?.focus();
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

  // ============================================================
  // FEEDBACK FORM
  // ============================================================

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
        <DocumentSurface>
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

          {/* TITLE */}
          <FormField
            ref={titleRef}
            label="Title"
            maxLength={50}
            value={values.title}
            error={errors.title}
            onChangeText={(text) => change("title", text)}
            placeholder="Enter feedback title"
            returnKeyType="next"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              setSubjectVisible(true);
            }}
          />

          {/* SUBJECT DROPDOWN */}
          <FormField
            label="Subject"
            value={values.subject}
            error={errors.subject}
            placeholder="Select a subject"
            accessibilityState={{ expanded: subjectVisible }}
            onSelect={() => {
              Keyboard.dismiss();
              setSubjectVisible(current => !current);
            }}
          />

          {subjectVisible && (
            <View style={styles.subjectDropdown} accessibilityLabel="Subject choices">
            {SUBJECT_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.subjectOption,
                  values.subject === option &&
                    styles.selectedOption,
                  pressed && styles.pressedOption,
                ]}
                onPress={() => {
                  change("subject", option);
                  setSubjectVisible(false);
                }}
                accessibilityRole="button"
                accessibilityState={{
                  selected: values.subject === option,
                }}
              >
                <Text
                  style={[
                    styles.subjectText,
                    values.subject === option &&
                      styles.selectedText,
                  ]}
                >
                  {option}
                </Text>

                {values.subject === option && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primaryDark}
                  />
                )}
              </Pressable>
            ))}


            </View>
          )}

          {/* MESSAGE */}
          <FormField
            ref={messageRef}
            label="Message"
            onFocus={() => setSubjectVisible(false)}
            maxLength={255}
            value={values.message}
            error={errors.message}
            onChangeText={(text) => change("message", text)}
            placeholder="Tell us what's on your mind..."
            multiline
            scrollEnabled
            style={styles.message}
          />

          {/* SUBMIT */}
          <Button
            label={loading ? "Submitting..." : "Submit"}
            onPress={handleSubmit}
            disabled={loading || success}
            variant="primary"
            loading={loading}
            style={styles.submit}
          />
        </DocumentSurface>
      </ScrollView>

      {/* SUCCESS MODAL */}
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

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  submit: {
    alignSelf: "center",
    minWidth: 160,
    marginTop: spacing.sm,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
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

  subjectDropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.xxs,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },

  subjectOption: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedOption: {
    backgroundColor: colors.background,
  },

  pressedOption: {
    opacity: 0.7,
  },

  subjectText: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },

  selectedText: {
    fontFamily: fontFamily.medium,
    color: colors.primaryDark,
  },
});