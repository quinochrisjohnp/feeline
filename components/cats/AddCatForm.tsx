import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FormField from "@/components/common/FormField";
import Button from "@/components/common/Button";
import type { Cat, CatGender } from "@/types/models";
import { birthdateFromInput, getAgeYears, toDateOnly } from "@/utils/date";
import { generateId } from "@/utils/id";
import { colors, dimensions, radii, shadows, spacing, typography } from "@/constants/theme";

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

  const [nameTouched, setNameTouched] = useState(false);
  const [birthdateTouched, setBirthdateTouched] = useState(false);
  const submitted = useRef(false);
  useEffect(() => { if (visible) submitted.current = false; }, [visible]);
  const birthdateIso = birthdateFromInput(birthdate);
  const validBirthdate = !!birthdateIso && birthdateIso <= toDateOnly(new Date());
  const age = validBirthdate ? getAgeYears(birthdateIso!) : null;

  const reset = () => {
    setName("");
    setGender("Male");
    setBirthdate("");
    setNameTouched(false);
    setBirthdateTouched(false);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleSave = () => {
    if (submitted.current || !name.trim() || !validBirthdate || !birthdateIso) return;
    submitted.current = true;
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
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl),
          paddingLeft: Math.max(insets.left, spacing.lg), paddingRight: Math.max(insets.right, spacing.lg) }]}>
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

            <Text style={styles.title} accessibilityRole="header">New Cat Profile</Text>
            <Text style={styles.mockNote}>Profile and cover images are placeholders. No photo picker is connected.</Text>

            <FormField label="Name" value={name} onChangeText={setName} placeholder="Name"
              onBlur={() => setNameTouched(true)} hint="Required"
              error={nameTouched && !name.trim() ? "Enter a cat name." : undefined} />

            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {(["Male", "Female"] as CatGender[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    accessibilityRole="radio" accessibilityLabel={option} accessibilityState={{ checked: gender === option }}
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

            <FormField label="Birthdate" value={birthdate} onChangeText={setBirthdate}
              placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation"
              onBlur={() => setBirthdateTouched(true)} hint="Required - MM/DD/YYYY"
              error={(birthdateTouched || birthdate.length >= 10) && !validBirthdate
                ? "Enter a valid birthdate that is not in the future." : undefined} />
            <Text style={styles.age}>Age: {age === null ? "--" : age} years</Text>
            <Text style={styles.mockNote}>Age is calculated from the birthdate.</Text>

            <View style={styles.actions}>
              <Button label="Cancel" variant="outline" onPress={handleCancel} style={styles.actionButton} />
              <Button
                label="Save"
                variant="primary"
                onPress={handleSave}
                disabled={!name.trim() || !validBirthdate}
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
    minHeight: dimensions.touchTarget,
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
  genderLabel: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
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
  age: { ...typography.bodyMedium, color: colors.textPrimary },
  mockNote: { ...typography.caption, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.md },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flexGrow: 1, flexBasis: dimensions.actionMinWidth },
});
