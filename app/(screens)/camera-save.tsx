import React, { useCallback, useRef, useState } from "react";
import { BackHandler, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import ConfirmModal from "@/components/common/ConfirmModal";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import MockPhoto from "@/components/common/MockPhoto";
import AddCatForm from "@/components/cats/AddCatForm";
import { useCatData } from "@/context/CatDataContext";
import { selectAlbumById, selectAlbumName } from "@/context/catDataSelectors";
import { detectMockCapture, parseMockCapture } from "@/services/mockDetection";
import type { Cat } from "@/types/models";
import { colors, dimensions, radii, spacing, typography } from "@/constants/theme";

type SaveStep = "select" | "confirmSave" | "saved";

export default function CameraSave() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state, addCat, saveCapture } = useCatData();
  const capture = parseMockCapture(params);
  const result = capture ? detectMockCapture(capture) : null;
  const [step, setStep] = useState<SaveStep>("select");
  const [pendingAlbumId, setPendingAlbumId] = useState<string | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const [catSavedNotice, setCatSavedNotice] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saved = useRef(false);
  const catSubmitted = useRef(false);

  const handleContinue = useCallback(() => router.dismissTo("/camera"), [router]);
  const handleBack = useCallback(() => {
    if (saved.current || !capture) handleContinue();
    else router.replace({ pathname: "/camera-result", params: { ...capture } });
  }, [capture, handleContinue, router]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]));

  const handleConfirmSave = () => {
    if (saved.current || !capture || result?.outcome !== "normal") return;
    if (!pendingAlbumId || !selectAlbumById(state, pendingAlbumId)) {
      setStep("select");
      setSaveError("That album is no longer available. Please choose another.");
      return;
    }
    // Synchronous latch also blocks a second tap before React renders the success state.
    saved.current = true;
    saveCapture({
      albumId: pendingAlbumId, emotion: result.emotion, confidence: result.confidence,
      capturedAt: capture.capturedAt, imageUri: capture.imageUri,
    });
    setStep("saved");
  };

  const openAddCat = () => {
    catSubmitted.current = false;
    setAddingCat(true);
  };
  const handleAddCatSave = (cat: Cat) => {
    if (catSubmitted.current) return;
    catSubmitted.current = true;
    addCat(cat);
    setAddingCat(false);
    setCatSavedNotice(true);
  };

  if (!capture || result?.outcome !== "normal") {
    return (
      <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
        <DetailScreenHeader title="Save" onBack={handleContinue} />
        <EmptyState icon="camera-outline" title="No result to save"
          message="Try another mock capture to get a result eligible for saving."
          actionLabel="Back to Camera" onAction={handleContinue} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader title="Save" onBack={handleBack} rightElement={
        <TouchableOpacity style={styles.addButton} onPress={openAddCat} accessibilityRole="button" accessibilityLabel="New Cat Profile">
          <Ionicons name="add" size={dimensions.icon} color={colors.textPrimary} />
        </TouchableOpacity>
      } />
      <FlatList
        data={state.albums}
        keyExtractor={(album) => album.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.question} accessibilityRole="header">Which cat should this image be saved to?</Text>
            <View style={styles.preview}>
              <MockPhoto imageUri={capture.imageUri} size={dimensions.iconLarge} label="Captured mock photo" />
              <Text style={styles.note}>Mock photo · Saved for this session only.</Text>
            </View>
            {saveError ? <Text style={styles.error} accessibilityRole="alert">{saveError}</Text> : null}
          </View>
        }
        renderItem={({ item: album }) => (
          <TouchableOpacity style={styles.row} accessibilityRole="button"
            accessibilityLabel={`Save to ${selectAlbumName(state, album.id)}`}
            onPress={() => { setSaveError(null); setPendingAlbumId(album.id); setStep("confirmSave"); }}>
            <View style={styles.avatar}><Ionicons name="paw" size={dimensions.icon} color={colors.textSecondary} /></View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{selectAlbumName(state, album.id)}</Text>
              {album.kind === "unknown" ? <Text style={styles.note}>For cats without a profile</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={dimensions.iconSmall} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        ListFooterComponent={<Button label="New Cat Profile" variant="outline" onPress={openAddCat} style={styles.newCat} />}
      />
      <ConfirmModal visible={step === "confirmSave"}
        title={`Save image in ${pendingAlbumId ? selectAlbumName(state, pendingAlbumId) : "this album"}?`}
        message="The mock image and its result will be kept for this session."
        confirmLabel="Save" onConfirm={handleConfirmSave} onCancel={() => setStep("select")} />
      <AddCatForm visible={addingCat} onCancel={() => setAddingCat(false)} onSave={handleAddCatSave} />
      <ConfirmModal visible={catSavedNotice} title="Cat Profile Saved!"
        message="Your new cat is ready in the list. Choose it to save this mock image."
        confirmLabel="Continue" hideCancel onConfirm={() => setCatSavedNotice(false)} onCancel={() => setCatSavedNotice(false)} />
      <ConfirmModal visible={step === "saved"} title="Image Saved!"
        message="Your mock image and result are in the selected album. Reloading restores the initial mock data."
        confirmLabel="Continue" hideCancel onConfirm={handleContinue} onCancel={handleContinue} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addButton: { minWidth: dimensions.touchTarget, minHeight: dimensions.touchTarget, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  intro: { paddingVertical: spacing.md },
  question: { ...typography.bodyMedium, color: colors.textPrimary },
  preview: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  note: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  error: { ...typography.body, color: colors.dangerStrong, marginTop: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  avatar: { width: dimensions.touchTarget, height: dimensions.touchTarget, borderRadius: radii.md,
    backgroundColor: colors.placeholder, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowLabel: { ...typography.subheading, color: colors.textPrimary },
  newCat: { marginTop: spacing.lg },
});
