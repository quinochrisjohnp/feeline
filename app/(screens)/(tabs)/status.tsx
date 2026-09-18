import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenContainer from "@/components/common/ScreenContainer";
import CatCoverCard from "@/components/cats/CatCoverCard";
import CatProfileHeader from "@/components/cats/CatProfileHeader";
import EmotionBadge from "@/components/common/EmotionBadge";
import EmptyState from "@/components/common/EmptyState";
import AddCatForm from "@/components/cats/AddCatForm";
import { useCatData } from "@/context/CatDataContext";
import { selectCatById, selectLatestDetectionForCat } from "@/context/catDataSelectors";
import { EMOTIONS } from "@/types/models";
import type { Cat } from "@/types/models";
import { getAgeYears, formatShortDate } from "@/utils/date";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

// TODO: cat profile edit/delete flows come in a later phase.
export default function Status() {
  const insets = useSafeAreaInsets();
  const { state, addCat } = useCatData();
  const { cats } = state;
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [addingCat, setAddingCat] = useState(false);

  const selectedCat = selectCatById(state, selectedCatId ?? "");

  const latestRecordFor = (catId: string) => selectLatestDetectionForCat(state, catId);

  const handleSaveCat = (cat: Cat) => {
    addCat(cat);
    setAddingCat(false);
  };

  if (selectedCat) {
    const latest = latestRecordFor(selectedCat.id);

    return (
      <View style={styles.profileContainer}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}>
          <CatProfileHeader />

          <View style={styles.profileBody}>
            <Text style={styles.catName}>{selectedCat.name}</Text>

            <View style={styles.card}>
              {latest ? (
                <>
                  <EmotionBadge emotion={latest.emotion} size={56} />
                  <Text style={styles.emotionLabel}>{EMOTIONS[latest.emotion].label.toUpperCase()}</Text>
                  <Text style={styles.cardCaption}>Current Emotion</Text>
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
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + spacing.sm }]}
          onPress={() => setSelectedCatId(null)}
          accessibilityLabel="Back to My Cats"
        >
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cats</Text>
        <TouchableOpacity onPress={() => setAddingCat(true)} accessibilityLabel="Add cat">
          <Ionicons name="add" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {cats.length === 0 ? (
        <EmptyState
          icon="paw-outline"
          title="No cats added yet"
          message="Add your first cat to start tracking their emotions."
          actionLabel="Add your first cat"
          onAction={() => setAddingCat(true)}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {cats.map((cat) => (
            <CatCoverCard key={cat.id} name={cat.name} coverUri={cat.coverUri} variant="bar" onPress={() => setSelectedCatId(cat.id)} />
          ))}
        </ScrollView>
      )}

      <AddCatForm visible={addingCat} onCancel={() => setAddingCat(false)} onSave={handleSaveCat} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.md },
  title: { ...typography.heading, color: colors.textPrimary },
  profileContainer: { flex: 1, backgroundColor: colors.background },
  backButton: {
    position: "absolute",
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: "rgba(36,26,18,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileBody: { paddingHorizontal: spacing.lg, marginTop: 52, alignItems: "center" },
  catName: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.lg },
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
  statRow: { flexDirection: "row", width: "100%", justifyContent: "space-around", marginTop: spacing.md },
  statCol: { alignItems: "center" },
  statValue: { ...typography.subheading, color: colors.textPrimary },
  statCaption: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  noDataText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  sectionTitle: { ...typography.subheading, color: colors.textPrimary, alignSelf: "flex-start", marginBottom: spacing.sm },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  infoValue: { ...typography.subheading, color: colors.textPrimary },
});