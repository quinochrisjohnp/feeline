import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import ConfirmModal from "@/components/common/ConfirmModal";
import AddCatForm from "@/components/cats/AddCatForm";
import { useCatData, UNKNOWN_CAT_ID } from "@/context/CatDataContext";
import type { Cat, EmotionKey } from "@/types/models";
import { colors, radii, spacing, typography } from "@/constants/theme";

type SaveStep = "select" | "confirmSave" | "saved";

export default function CameraSave() {
  const router = useRouter();
  const params = useLocalSearchParams<{ emotion?: string; confidence?: string }>();
  const { cats, addCat, addDetectionRecord } = useCatData();

  const emotion = (params.emotion as EmotionKey | undefined) || undefined;
  const confidence = params.confidence ? Number(params.confidence) : undefined;

  const [step, setStep] = useState<SaveStep>("select");
  const [pendingCatId, setPendingCatId] = useState<string | null>(null);
  const [pendingCatName, setPendingCatName] = useState<string>("");
  const [addingCat, setAddingCat] = useState(false);
  const [catSavedNotice, setCatSavedNotice] = useState(false);

  const options: { id: string; name: string }[] = [
    ...cats.map((cat) => ({ id: cat.id, name: cat.name })),
    { id: UNKNOWN_CAT_ID, name: "Unknown Cats" },
  ];

  const handleSelect = (catId: string, catName: string) => {
    setPendingCatId(catId);
    setPendingCatName(catName);
    setStep("confirmSave");
  };

  const handleConfirmSave = () => {
    if (!pendingCatId || !emotion) return;
    addDetectionRecord({
      catId: pendingCatId,
      emotion,
      confidence: confidence ?? 0,
      recordedAt: new Date().toISOString(),
      imageUri: null,
    });
    setStep("saved");
  };

  const handleContinue = () => {
    router.replace("/camera");
  };

  const handleAddCatSave = (cat: Cat) => {
    addCat(cat);
    setAddingCat(false);
    setCatSavedNotice(true);
  };

  if (step === "saved") {
    return (
      <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
        <DetailScreenHeader title="Save" />
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={36} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Image Saved!</Text>
          <TouchableOpacity onPress={handleContinue}>
            <Text style={styles.continueLink}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader
        title="Save"
        rightElement={
          <TouchableOpacity onPress={() => setAddingCat(true)} accessibilityLabel="Add cat profile">
            <Ionicons name="add" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={options}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => handleSelect(item.id, item.name)}>
            <View style={styles.avatar}>
              <Ionicons name="paw" size={20} color={colors.textMuted} />
            </View>
            <Text style={styles.rowLabel}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />

      <ConfirmModal
        visible={step === "confirmSave"}
        title={`Save image in ${pendingCatName}?`}
        confirmLabel="Save"
        onConfirm={handleConfirmSave}
        onCancel={() => setStep("select")}
      />

      <AddCatForm visible={addingCat} onCancel={() => setAddingCat(false)} onSave={handleAddCatSave} />

      <ConfirmModal
        visible={catSavedNotice}
        title="Cat Profile Saved!"
        confirmLabel="Continue"
        hideCancel
        onConfirm={() => setCatSavedNotice(false)}
        onCancel={() => setCatSavedNotice(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  rowLabel: { ...typography.subheading, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  successTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.md },
  continueLink: { ...typography.bodyMedium, color: colors.accent },
});