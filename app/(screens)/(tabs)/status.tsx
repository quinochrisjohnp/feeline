import CatProfileLimitModal from "@/components/cats/CatProfileLimitModal";
import { MAX_CAT_PROFILES } from "@/constants/catLimits";
import { useWellnessNavigationSafety } from "@/context/WellnessContext";
import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useFocusEffect,
  useNavigation,
  useRouter,
} from "expo-router";

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

import {
  selectAlbumForCat,
  selectCatById,
  selectLatestDetectionForCat,
} from "@/context/catDataSelectors";

import { EMOTIONS } from "@/types/models";
import type { Cat, CatChanges } from "@/types/models";

import {
  getAgeYears,
  formatShortDate,
} from "@/utils/date";

import {
  colors,
  dimensions,
  fontFamily,
  radii,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";

export default function Status() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const {
    state,
    addCat,
    updateCat,
    deleteCat,
  } = useCatData();

  const { cats } = state;

  const [selectedCatId, setSelectedCatId] =
    useState<string | null>(null);

  const [limitVisible, setLimitVisible] = useState(false);
  const [addingCat, setAddingCat] =
    useState(false);

  const [editingCat, setEditingCat] =
    useState(false);

  const [createdNotice, setCreatedNotice] =
    useState(false);

  const [updatedNotice, setUpdatedNotice] =
    useState(false);

  const selectedCat = selectCatById(
    state,
    selectedCatId ?? ""
  );

  const [managedId, setManagedId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteLock = useRef(false);
  const editingProfile = selectCatById(state, editTarget ?? "");
  const managedCat = selectCatById(state, managedId ?? "");
  const showingProfile = !!selectedCat;
  useFocusEffect(useCallback(() => () => setManagedId(null), []));
  useFocusEffect(useCallback(() => {
    if (!managedId) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { setManagedId(null); return true; });
    return () => sub.remove();
  }, [managedId]));
  const handleDelete = async () => {
    if (!deleteTarget || deleteLock.current) return;
    deleteLock.current = true; setDeleting(true); setDeleteError(null);
    try { await deleteCat(deleteTarget); setDeleteTarget(null); setManagedId(null); }
    catch { setDeleteError("The profile could not be deleted. Please try again."); }
    finally { deleteLock.current = false; setDeleting(false); }
  };
  useWellnessNavigationSafety(addingCat || editingCat || createdNotice || updatedNotice || !!managedId || !!deleteTarget);

  // Hide tab bar while viewing a cat profile.
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: showingProfile || !!managedId
        ? { display: "none" }
        : undefined,
    });
  }, [navigation, showingProfile, managedId]);

  // Android hardware back button.
  useFocusEffect(
    useCallback(() => {
      if (!showingProfile) return;

      const subscription =
        BackHandler.addEventListener(
          "hardwareBackPress",
          () => {
            if (editingCat) {
              // Let the modal handle its own back action.
              return false;
            }

            setSelectedCatId(null);
            return true;
          }
        );

      return () => subscription.remove();
    }, [showingProfile, editingCat])
  );

  const latestRecordFor = (catId: string) =>
    selectLatestDetectionForCat(state, catId);

  // ============================================================
  // ADD CAT
  // ============================================================

  const handleSaveCat = async (cat: Cat) => {
    await addCat(cat);

    setAddingCat(false);
    setCreatedNotice(true);
  };

  // ============================================================
  // EDIT CAT
  // ============================================================


  const handleSaveEditedCat = async (
    editedCat: Cat
  ) => {
    if (!editingProfile) {
      throw new Error(
        "Cat profile was not found."
      );
    }

    const changes: CatChanges = {};

    // Compare each field against its original value.
    // Only changed fields are sent to the backend.

    if (
      editedCat.name !== editingProfile.name
    ) {
      changes.name = editedCat.name;
    }

    if (
      (editedCat.breed ?? "") !==
      (editingProfile.breed ?? "")
    ) {
      changes.breed = editedCat.breed;
    }

    if (
      editedCat.gender !==
      editingProfile.gender
    ) {
      changes.gender = editedCat.gender;
    }

    if (
      editedCat.birthdate !==
      editingProfile.birthdate
    ) {
      changes.birthdate =
        editedCat.birthdate;
    }

    if (
      (editedCat.description ?? "") !==
      (editingProfile.description ?? "")
    ) {
      changes.description =
        editedCat.description;
    }

    if (
      editedCat.photoUri !==
      editingProfile.photoUri
    ) {
      changes.photoUri =
        editedCat.photoUri;
    }

    if (
      editedCat.coverUri !==
      editingProfile.coverUri
    ) {
      changes.coverUri =
        editedCat.coverUri;
    }

    // If nothing changed, simply close the form.
    if (
      Object.keys(changes).length === 0
    ) {
      setEditingCat(false);
      return;
    }

    await updateCat(
      editingProfile.id,
      changes
    );

    setEditingCat(false);
    setUpdatedNotice(true);
  };

  // ============================================================
  // CAT PROFILE DETAILS
  // ============================================================

  if (selectedCat) {
    const latest = latestRecordFor(
      selectedCat.id
    );

    const album = selectAlbumForCat(
      state,
      selectedCat.id
    );

    return (
      <ScreenContainer
        module="catProfile"
        edges={[
          "left",
          "right",
          "bottom",
        ]}
        padded={false}
      >
        <ScrollView
          contentContainerStyle={{
            paddingBottom:
              spacing.lg + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          <CatProfileHeader
            name={selectedCat.name}
            photoUri={selectedCat.photoUri}
            coverUri={selectedCat.coverUri}
          />

          <View style={styles.profileBody}>
            <Text style={styles.catName} numberOfLines={2} ellipsizeMode="tail" accessibilityLabel={selectedCat.name}>
              {selectedCat.name}
            </Text>

            {/* LATEST DETECTED EMOTION */}
            <View style={styles.card}>
              {latest ? (
                <>
                  <EmotionBadge
                    emotion={latest.emotion}
                    size={56}
                  />

                  <Text
                    style={styles.emotionLabel}
                  >
                    {EMOTIONS[
                      latest.emotion
                    ].label.toUpperCase()}
                  </Text>

                  <Text
                    style={styles.cardCaption}
                  >
                    Latest Detected Emotion
                  </Text>

                  <Text
                    style={styles.cardCaption}
                  >
                    Observable cues,
                    not a diagnosis.
                  </Text>

                  <View
                    style={styles.statRow}
                  >
                    <View
                      style={styles.statCol}
                    >
                      <Text
                        style={styles.statValue}
                      >
                        {formatShortDate(
                          latest.recordedAt
                        )}
                      </Text>

                      <Text
                        style={
                          styles.statCaption
                        }
                      >
                        Last Checked
                      </Text>
                    </View>

                    <View
                      style={styles.statCol}
                    >
                      <Text
                        style={styles.statValue}
                      >
                        {latest.confidence}%
                      </Text>

                      <Text
                        style={
                          styles.statCaption
                        }
                      >
                        Confidence Percentage
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text
                  style={styles.noDataText}
                >
                  No detections yet for{" "}
                  {selectedCat.name}.
                </Text>
              )}
            </View>

            {/* CAT INFORMATION */}
            <Text
              style={styles.sectionTitle}
            >
              Cats Info
            </Text>

            <View style={styles.card}>
              {/* BREED */}
              <View
                style={styles.infoRow}
              >
                <Ionicons
                  name="paw-outline"
                  size={22}
                  color={colors.accent}
                />

                <Text
                  style={styles.infoValue}
                >
                  {selectedCat.breed ||
                    "Not specified"}
                </Text>
              </View>

              <Text
                style={styles.cardCaption}
              >
                Breed
              </Text>

              {/* GENDER */}
              <View
                style={[
                  styles.infoRow,
                  styles.infoSpacing,
                ]}
              >
                <Ionicons
                  name="male-female-outline"
                  size={22}
                  color={colors.accent}
                />

                <Text
                  style={styles.infoValue}
                >
                  {selectedCat.gender}
                </Text>
              </View>

              <Text
                style={styles.cardCaption}
              >
                Gender
              </Text>

              {/* BIRTHDATE AND AGE */}
              <View
                style={styles.statRow}
              >
                <View
                  style={styles.statCol}
                >
                  <Text
                    style={styles.statValue}
                  >
                    {formatShortDate(
                      selectedCat.birthdate
                    )}
                  </Text>

                  <Text
                    style={
                      styles.statCaption
                    }
                  >
                    Birthdate
                  </Text>
                </View>

                <View
                  style={styles.statCol}
                >
                  <Text
                    style={styles.statValue}
                  >
                    {getAgeYears(
                      selectedCat.birthdate
                    )}{" "}
                    Yrs. Old
                  </Text>

                  <Text
                    style={
                      styles.statCaption
                    }
                  >
                    Age
                  </Text>
                </View>
              </View>

              {/* DESCRIPTION */}
              <View
                style={
                  styles.descriptionSection
                }
              >
                <Text
                  style={
                    styles.descriptionTitle
                  }
                >
                  Description
                </Text>

                <Text
                  style={
                    styles.descriptionText
                  }
                >
                  {selectedCat.description ||
                    "No description added yet."}
                </Text>
              </View>
            </View>

            {/* CAT ALBUM */}
            {album ? (
              <Button
                label="Open Album"
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname:
                      "/album-folder",
                    params: {
                      albumId: album.id,
                    },
                  })
                }
              />
            ) : null}
          </View>
        </ScrollView>

        <TouchableOpacity style={[styles.backButton, { left: undefined, right: spacing.md, top: insets.top + spacing.sm }]} accessibilityRole="button" accessibilityLabel={`Edit ${selectedCat.name} profile`} onPress={() => { setEditTarget(selectedCat.id); setEditingCat(true); }}>
          <Ionicons name="pencil" size={20} color={colors.white} />
        </TouchableOpacity>
        <AddCatForm visible={editingCat} initialCat={editingProfile} onCancel={() => setEditingCat(false)} onSave={handleSaveEditedCat} />
        <ConfirmModal visible={updatedNotice} title="Cat Profile Updated!" hideCancel confirmLabel="Continue" onConfirm={() => setUpdatedNotice(false)} onCancel={() => setUpdatedNotice(false)} />
        {/* BACK BUTTON */}
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              top:
                insets.top + spacing.sm,
            },
          ]}
          onPress={() =>
            setSelectedCatId(null)
          }
          accessibilityRole="button"
          accessibilityLabel="Back to Cat Profiles"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.white}
          />
        </TouchableOpacity>

      </ScreenContainer>
    );
  }

  // ============================================================
  // MY CATS LIST
  // ============================================================

  return (
    <ScreenContainer
      module="catProfile"
      tabBar={!managedCat}
      padded={false}
    >
      <View style={styles.header}>
        <Text
          style={styles.title}
          accessibilityRole="header"
        >
          Cat Profiles
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          accessibilityRole="button"
          onPress={() => { if (state.cats.filter(cat => cat.id !== "unknown-cats").length >= MAX_CAT_PROFILES) setLimitVisible(true); else setAddingCat(true); }}
          accessibilityLabel="Add cat"
        >
          <Ionicons
            name="add"
            size={28}
            color={
              colors.textPrimary
            }
          />
        </TouchableOpacity>
      </View>

      <Pressable style={{ flex: 1, paddingHorizontal: spacing.lg }} onPress={() => setManagedId(null)} accessible={false}>
      {cats.length === 0 ? (
        <EmptyState
          icon="paw-outline"
          title="No cats added yet"
          message="Add a cat profile to organize your photos and emotion-cue results."
          actionLabel="Add your first cat"
          onAction={() => { if (state.cats.filter(cat => cat.id !== "unknown-cats").length >= MAX_CAT_PROFILES) setLimitVisible(true); else setAddingCat(true); }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
        >
          {cats.filter(cat => cat.id !== "unknown-cats").map((cat) => (
            <CatCoverCard
              key={cat.id}
              name={cat.name}
              coverUri={
                cat.coverUri ??
                cat.photoUri
              }
              subtitle={`${cat.gender} / ${getAgeYears(
                cat.birthdate
              )} years old`}
              variant="bar"
              selected={managedId === cat.id}
              faded={!!managedId && managedId !== cat.id}
              onLongPress={() => setManagedId(cat.id)}
              onPress={() => managedId ? setManagedId(null) : setSelectedCatId(cat.id)}
            />
          ))}
        </ScrollView>
      )}

      </Pressable>
      {managedCat ? <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Edit" onPress={() => { setEditTarget(managedCat.id); setEditingCat(true); setManagedId(null); }}>
          <Ionicons name="pencil-outline" size={dimensions.icon} color={colors.textPrimary} /><Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Delete" onPress={() => { setDeleteTarget(managedCat.id); setDeleteError(null); setManagedId(null); }}>
          <Ionicons name="trash-outline" size={dimensions.icon} color={colors.dangerStrong} /><Text style={[styles.actionLabel, styles.actionLabelDanger]}>Delete</Text>
        </TouchableOpacity>
      </View> : null}
      <AddCatForm visible={editingCat} initialCat={editingProfile} onCancel={() => setEditingCat(false)} onSave={handleSaveEditedCat} />
      <ConfirmModal visible={updatedNotice} title="Cat Profile Updated!" message="Your cat's profile and album are up to date."
        hideCancel confirmLabel="Continue" onConfirm={() => setUpdatedNotice(false)} onCancel={() => setUpdatedNotice(false)} />
      <ConfirmModal visible={!!deleteTarget} title="Delete this cat profile?"
        message={deleteError ?? "This removes the connected album, saved image records, and detection history for this cat. This cannot be undone."}
        confirmLabel="Delete profile" destructive busy={deleting} onConfirm={handleDelete}
        onCancel={() => { if (!deleteLock.current) setDeleteTarget(null); }} />
      {/* ADD CAT MODAL */}
      <CatProfileLimitModal visible={limitVisible} onClose={() => setLimitVisible(false)} />
      <AddCatForm
        visible={addingCat}
        onCancel={() =>
          setAddingCat(false)
        }
        onSave={handleSaveCat}
      />

      {/* CREATE CONFIRMATION */}
      <ConfirmModal
        visible={createdNotice}
        title="Cat Profile Saved!"
        message="Your cat and its album are ready."
        hideCancel
        confirmLabel="Continue"
        onConfirm={() =>
          setCreatedNotice(false)
        }
        onCancel={() =>
          setCreatedNotice(false)
        }
      />
    </ScreenContainer>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  actionBar: { flexDirection: "row", backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: spacing.sm, paddingBottom: spacing.sm, ...shadows.floating },
  actionButton: { flex: 1, minHeight: dimensions.touchTarget, alignItems: "center", justifyContent: "center", gap: spacing.xxs, paddingVertical: spacing.xs },
  actionLabel: { ...typography.label, fontFamily: fontFamily.semibold, color: colors.textPrimary },
  actionLabelDanger: { color: colors.dangerStrong },
  header: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  title: {
    ...typography.heading,
    fontFamily: fontFamily.heading, fontSize: 24,
    color: colors.textPrimary,
  },

  addButton: {
    minWidth: dimensions.touchTarget,
    minHeight: dimensions.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },

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

  profileBody: {
    paddingHorizontal: spacing.lg,
    marginTop: 52,
    alignItems: "center",
  },

  catName: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },

  card: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.card,
  },

  emotionLabel: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    letterSpacing: 1,
  },

  cardCaption: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    width: "100%",
    justifyContent: "space-around",
    marginTop: spacing.md,
  },

  statCol: {
    flexGrow: 1,
    flexBasis: 110,
    alignItems: "center",
  },

  statValue: {
    ...typography.subheading,
    color: colors.textPrimary,
    textAlign: "center",
  },

  statCaption: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },

  noDataText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },

  sectionTitle: {
    ...typography.subheading,
    color: colors.textPrimary,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  infoSpacing: {
    marginTop: spacing.md,
  },

  infoValue: {
    ...typography.subheading,
    color: colors.textPrimary,
    textAlign: "center",
  },

  descriptionSection: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },

  descriptionTitle: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});