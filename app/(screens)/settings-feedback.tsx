import React, { useRef, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import FormField from "@/components/common/FormField";
import Button from "@/components/common/Button";
import ConfirmModal from "@/components/common/ConfirmModal";
import { colors, dimensions, radii, spacing, typography } from "@/constants/theme";

type Field = "title" | "email" | "subject" | "message";

export default function GiveFeedback() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);
  const [values, setValues] = useState({ title: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const submitted = useRef(false);
  const titleRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const subjectRef = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);
  const refs = { title: titleRef, email: emailRef, subject: subjectRef, message: messageRef };
  const goBack = () => router.dismissTo("/settings");
  const change = (field: Field, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const handleSubmit = () => {
    if (submitted.current) return;
    const next: Partial<Record<Field, string>> = {};
    for (const field of ["title", "email", "subject", "message"] as const) {
      if (!values[field].trim()) next[field] = `Please fill in the ${field} field.`;
    }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    setErrors(next);
    const first = (Object.keys(next) as Field[])[0];
    if (first) { refs[first].current?.focus(); return; }
    submitted.current = true;
    Keyboard.dismiss();
    setSuccess(true);
  };

  return (
    <ScreenContainer keyboardAware edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader title="Give us Feedback" onBack={goBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.body}>
          <Text style={styles.heading} accessibilityRole="header">Feedback Form</Text>
          <Text style={styles.note}>Mock feedback only. Nothing entered here is sent or saved.</Text>
          <FormField ref={titleRef} label="Title" value={values.title} error={errors.title}
            onChangeText={(text) => change("title", text)} placeholder="Title" returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()} />
          <FormField ref={emailRef} label="Email" value={values.email} error={errors.email}
            onChangeText={(text) => change("email", text)} placeholder="you@example.com"
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} returnKeyType="next"
            onSubmitEditing={() => subjectRef.current?.focus()} />
          <FormField ref={subjectRef} label="Subject" value={values.subject} error={errors.subject}
            onChangeText={(text) => change("subject", text)} placeholder="Subject" returnKeyType="next"
            onSubmitEditing={() => messageRef.current?.focus()} />
          <FormField ref={messageRef} label="Message" value={values.message} error={errors.message}
            onChangeText={(text) => change("message", text)} placeholder="Tell us what's on your mind..."
            multiline scrollEnabled style={styles.message} />
          <Button label="Submit" onPress={handleSubmit} disabled={success} fullWidth />
        </View>
      </ScrollView>
      <ConfirmModal visible={success} title="Thank you for your Feedback!"
        message="This was a mock submission. Your feedback was not sent or saved."
        confirmLabel="Continue" hideCancel onConfirm={goBack} onCancel={goBack} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  body: { width: "100%", maxWidth: dimensions.contentMaxWidth, alignSelf: "center", backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: radii.xl },
  heading: { ...typography.subheading, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.sm },
  note: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  message: { minHeight: dimensions.messageInput, maxHeight: 240 },
});
