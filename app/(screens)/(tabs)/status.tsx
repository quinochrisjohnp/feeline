import React, { useCallback, useLayoutEffect, useState } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenContainer from "@/components/common/ScreenContainer";
import CatCoverCard from "@/components/cats/CatCoverCard";
import CatProfileHeader from "@/components/cats/CatProfileHeader";
import EmotionBadge from "@/components/common/EmotionBadge";
import EmptyState from "@/components/common/EmptyState";
import Button from "@/components/common/Button";
import ConfirmModal from "@/components/common/ConfirmModal";
import AddCatForm from "@/components/cats/AddCatForm";
import { useCatData } from "@/context/CatDataContext";
import { selectAlbumForCat, selectCatById, selectLatestDetectionForCat } from "@/context/catDataSelectors";
import { EMOTIONS } from "@/types/models";
import type { Cat } from "@/types/models";
import { getAgeYears, formatShortDate } from "@/utils/date";
import { colors, dimensions, radii, shadows, spacing, typography } from "@/constants/theme";

export default function Status() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [createdNotice, setCreatedNotice] = useState(false);
  const { state, addCat } = useCatData();
  const { cats } = state;
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [addingCat, setAddingCat] = useState(false);

  const selectedCat = selectCatById(state, selectedCatId ?? "");
  const navigation = useNavigation();
  const showingProfile = !!selectedCat;

  useLayoutEffect(() => {
    navigation.setOptions({ tabBarStyle: showingProfile ? { display: "none" } : undefined });
  }, [navigation, showingProfile]);

  useFocusEffect(useCallback(() => {
    if (!showingProfile) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setSelectedCatId(null);
      return true;
    });
    return () => subscription.remove();
  }, [showingProfile]));

  const latestRecordFor = (catId: string) => selectLatestDetectionForCat(state, catId);

  const handleSaveCat = (cat: Cat) => {
    addCat(cat);
    setAddingCat(false);
    setCreatedNotice(true);
  };

  if (selectedCat) {
    const latest = latestRecordFor(selectedCat.id);
    const album = selectAlbumForCat(state, selectedCat.id);

    return (
      <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg + insets.bottom }}>
          <CatProfileHeader name={selectedCat.name} photoUri={selectedCat.photoUri} coverUri={selectedCat.coverUri} />

          <View style={styles.profileBody}>
            <Text style={styles.catName}>{selectedCat.name}</Text>

            <View style={styles.card}>
              {latest ? (
                <>
                  <EmotionBadge emotion={latest.emotion} size={56} />
                  <Text style={styles.emotionLabel}>{EMOTIONS[latest.emotion].label.toUpperCase()}</Text>
                  <Text style={styles.cardCaption}>Latest Detected Emotion</Text>
                  <Text style={styles.cardCaption}>Mock observable cues, not a diagnosis.</Text>
                  <View style={styles.statRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statValue}>{formatShortDate(latest.recordedAt)}</Text>
                      <Text style={styles.statCaption}>Last Checked</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statValue}>{latest.confidence}%</Text>
                      <Text style={styles.statCaption}>Confidence Percentage</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.noDataText}>No detections yet for {selectedCat.name}.</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Cats Info</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="male-female-outline" size={22} color={colors.accent} />
                <Text style={styles.infoValue}>{selectedCat.gender}</Text>
              </View>
              <Text style={styles.cardCaption}>Gender</Text>
              <View style={styles.statRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>{formatShortDate(selectedCat.birthdate)}</Text>
                  <Text style={styles.statCaption}>Birthdate</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statValue}>{getAgeYears(selectedCat.birthdate)} Yrs. Old</Text>
                  <Text style={styles.statCaption}>Age</Text>
                </View>
              </View>
            </View>
            {album ? <Button label="Open Album" variant="outline"
              onPress={() => router.push({ pathname: "/album-folder", params: { albumId: album.id } })} /> : null}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + spacing.sm }]}
          onPress={() => setSelectedCatId(null)}
          accessibilityRole="button"
          accessibilityLabel="Back to My Cats"
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer tabBar>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">My Cats</Text>
        <TouchableOpacity style={styles.addButton} accessibilityRole="button" onPress={() => setAddingCat(true)} accessibilityLabel="Add cat">
          <Ionicons name="add" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {cats.length === 0 ? (
        <EmptyState
          icon="paw-outline"
          title="No cats added yet"
          message="Add a cat profile to organize your mock photos and emotion-cue results."
          actionLabel="Add your first cat"
          onAction={() => setAddingCat(true)}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {cats.map((cat) => (
            <CatCoverCard key={cat.id} name={cat.name} coverUri={cat.coverUri ?? cat.photoUri} subtitle={`${cat.gender} / ${getAgeYears(cat.birthdate)} years old`} variant="bar" onPress={() => setSelectedCatId(cat.id)} />
          ))}
        </ScrollView>
      )}

      <AddCatForm visible={addingCat} onCancel={() => setAddingCat(false)} onSave={handleSaveCat} />
      <ConfirmModal visible={createdNotice} title="Cat Profile Saved!" message="Your cat and its album are ready for this mock session."
        hideCancel confirmLabel="Continue" onConfirm={() => setCreatedNotice(false)} onCancel={() => setCreatedNotice(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.md },
  title: { ...typography.heading, color: colors.textPrimary },
  addButton: { minWidth: dimensions.touchTarget, minHeight: dimensions.touchTarget, alignItems: "center", justifyContent: "center" },
  backButton: {
    position: "absolute",
    left: spacing.md,
    width: dimensions.touchTarget,
    height: dimensions.touchTarget,
    borderRadius: radii.pill,
    backgroundColor: colors.photoControl,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBody: { paddingHorizontal: spacing.lg, marginTop: 52, alignItems: "center" },
  catName: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.lg, textAlign: "center" },
  card: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  emotionLabel: { ...typography.subheading, color: colors.textPrimary, marginTop: spacing.xs, letterSpacing: 1 },
  cardCaption: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, width: "100%", justifyContent: "space-around", marginTop: spacing.md },
  statCol: { flexGrow: 1, flexBasis: 110, alignItems: "center" },
  statValue: { ...typography.subheading, color: colors.textPrimary, textAlign: "center" },
  statCaption: { ...typography.caption, color: colors.textMuted, marginTop: 2, textAlign: "center" },
  noDataText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  sectionTitle: { ...typography.subheading, color: colors.textPrimary, alignSelf: "flex-start", marginBottom: spacing.sm },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  infoValue: { ...typography.subheading, color: colors.textPrimary },
});
