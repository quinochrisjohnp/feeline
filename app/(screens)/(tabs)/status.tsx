import React, {
  useCallback,
  useLayoutEffect,
  useState,
} from "react";

import {
  BackHandler,
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
  } = useCatData();

  const { cats } = state;

  const [selectedCatId, setSelectedCatId] =
    useState<string | null>(null);

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

  const showingProfile = !!selectedCat;

  // Hide tab bar while viewing a cat profile.
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: showingProfile
        ? { display: "none" }
        : undefined,
    });
  }, [navigation, showingProfile]);

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

  const handleEditCat = () => {
    if (!selectedCat) return;

    setEditingCat(true);
  };

  const handleSaveEditedCat = async (
    editedCat: Cat
  ) => {
    if (!selectedCat) {
      throw new Error(
        "Cat profile was not found."
      );
    }

    const changes: CatChanges = {};

    // Compare each field against its original value.
    // Only changed fields are sent to the backend.

    if (
      editedCat.name !== selectedCat.name
    ) {
      changes.name = editedCat.name;
    }

    if (
      (editedCat.breed ?? "") !==
      (selectedCat.breed ?? "")
    ) {
      changes.breed = editedCat.breed;
    }

    if (
      editedCat.gender !==
      selectedCat.gender
    ) {
      changes.gender = editedCat.gender;
    }

    if (
      editedCat.birthdate !==
      selectedCat.birthdate
    ) {
      changes.birthdate =
        editedCat.birthdate;
    }

    if (
      (editedCat.description ?? "") !==
      (selectedCat.description ?? "")
    ) {
      changes.description =
        editedCat.description;
    }

    if (
      editedCat.photoUri !==
      selectedCat.photoUri
    ) {
      changes.photoUri =
        editedCat.photoUri;
    }

    if (
      editedCat.coverUri !==
      selectedCat.coverUri
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
      selectedCat.id,
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
            <Text style={styles.catName}>
              {selectedCat.name}
            </Text>

            {/* EDIT PROFILE BUTTON */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditCat}
              accessibilityRole="button"
              accessibilityLabel="Edit Cat Profile"
            >
              <Ionicons
                name="create-outline"
                size={19}
                color={colors.textPrimary}
              />

              <Text
                style={styles.editButtonText}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>

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
                    Mock observable cues,
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
          accessibilityLabel="Back to My Cats"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.white}
          />
        </TouchableOpacity>

        {/* EDIT CAT MODAL */}
        <AddCatForm
          visible={editingCat}
          initialCat={selectedCat}
          onCancel={() =>
            setEditingCat(false)
          }
          onSave={
            handleSaveEditedCat
          }
        />

        {/* UPDATE CONFIRMATION */}
        <ConfirmModal
          visible={updatedNotice}
          title="Cat Profile Updated!"
          message="Your cat's profile has been successfully updated."
          hideCancel
          confirmLabel="Continue"
          onConfirm={() =>
            setUpdatedNotice(false)
          }
          onCancel={() =>
            setUpdatedNotice(false)
          }
        />
      </ScreenContainer>
    );
  }

  // ============================================================
  // MY CATS LIST
  // ============================================================

  return (
    <ScreenContainer
      module="catProfile"
      tabBar
    >
      <View style={styles.header}>
        <Text
          style={styles.title}
          accessibilityRole="header"
        >
          My Cats
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          accessibilityRole="button"
          onPress={() =>
            setAddingCat(true)
          }
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

      {cats.length === 0 ? (
        <EmptyState
          icon="paw-outline"
          title="No cats added yet"
          message="Add a cat profile to organize your mock photos and emotion-cue results."
          actionLabel="Add your first cat"
          onAction={() =>
            setAddingCat(true)
          }
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
        >
          {cats.map((cat) => (
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
              onPress={() =>
                setSelectedCatId(
                  cat.id
                )
              }
            />
          ))}
        </ScrollView>
      )}

      {/* ADD CAT MODAL */}
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
        message="Your cat and its album are ready for this mock session."
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  title: {
    ...typography.heading,
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

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.card,
  },

  editButtonText: {
    ...typography.label,
    color: colors.textPrimary,
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