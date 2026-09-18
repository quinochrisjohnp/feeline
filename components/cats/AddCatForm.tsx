import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FormField from "@/components/common/FormField";
import Button from "@/components/common/Button";
import type { Cat, CatGender } from "@/types/models";
import { birthdateFromInput, getAgeYears, toDateOnly } from "@/utils/date";
import { generateId } from "@/utils/id";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

interface AddCatFormProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (cat: Cat) => void;
}

export default function AddCatForm({ visible, onCancel, onSave }: AddCatFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<CatGender>("Male");
  const [birthdate, setBirthdate] = useState("");

  const birthdateIso = birthdate.trim() ? birthdateFromInput(birthdate) : toDateOnly(new Date());
  const age = birthdateIso ? getAgeYears(birthdateIso) : 0;

  // Keep the existing age stepper, but it edits birthdate; age is always derived.
  const changeAge = (delta: number) => {
    const date = new Date((birthdateIso ?? toDateOnly(new Date())) + "T00:00:00");
    const day = date.getDate();
    date.setFullYear(date.getFullYear() - delta);
    if (date.getDate() !== day) date.setDate(0);
    const iso = toDateOnly(date);
    setBirthdate(iso.slice(5, 7) + "/" + iso.slice(8, 10) + "/" + iso.slice(0, 4));
  };

  const reset = () => {
    setName("");
    setGender("Male");
    setBirthdate("");
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleSave = () => {
    if (!name.trim() || !birthdateIso) return;
    const newCat: Cat = {
      id: generateId("cat"),
      name: name.trim(),
      gender,
      birthdate: birthdateIso,
      photoUri: null,
      coverUri: null,
    };
    onSave(newCat);
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <View style={styles.photoRow}>
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={36} color={colors.textMuted} />
                <View style={styles.cameraBadgeCover}>
                  <Ionicons name="camera" size={14} color={colors.textPrimary} />
                </View>
              </View>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                <View style={styles.cameraBadgeAvatar}>
                  <Ionicons name="camera" size={12} color={colors.textPrimary} />
                </View>
              </View>
            </View>

            <Text style={styles.title}>New Cat Profile</Text>

            <FormField label="Name" value={name} onChangeText={setName} placeholder="Name" />

            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {(["Male", "Female"] as CatGender[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.genderPill, gender === option && styles.genderPillActive]}
                    onPress={() => setGender(option)}
                  >
                    <Text style={styles.genderLabel}>{option}</Text>
                    <View style={[styles.radioOuter, gender === option && styles.radioOuterActive]}>
                      {gender === option ? <View style={styles.radioInner} /> : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Age (years)</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => changeAge(-1)}
                  disabled={age <= 0}
                >
                  <Ionicons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{age}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => changeAge(1)}
                  disabled={age >= 30}
                >
                  <Ionicons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <FormField label="Birthdate" value={birthdate} onChangeText={setBirthdate}
              placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation"
              error={!birthdateIso ? "Enter a valid date as MM/DD/YYYY." : undefined} />

            <View style={styles.actions}>
              <Button label="Cancel" variant="outline" onPress={handleCancel} style={styles.actionButton} />
              <Button
                label="Save"
                variant="primary"
                onPress={handleSave}
                disabled={!name.trim() || !birthdateIso}
                style={styles.actionButton}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "88%",
    ...shadows.floating,
  },
  photoRow: { alignItems: "center", marginBottom: spacing.md },
  coverPlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadgeCover: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginTop: -44,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadgeAvatar: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  title: { ...typography.subheading, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.textPrimary, marginBottom: spacing.xs },
  genderRow: { flexDirection: "row", gap: spacing.sm },
  genderPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  genderPillActive: { borderColor: colors.primary },
  genderLabel: { ...typography.body, color: colors.textPrimary },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.primary },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { ...typography.subheading, color: colors.textPrimary, minWidth: 32, textAlign: "center" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1 },
});