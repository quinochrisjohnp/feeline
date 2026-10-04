import React, {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  BackHandler,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import ConfirmModal from "@/components/common/ConfirmModal";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import MockPhoto from "@/components/common/MockPhoto";
import AddCatForm from "@/components/cats/AddCatForm";

import {
  useCatData,
} from "@/context/CatDataContext";

import {
  selectAlbumById,
  selectAlbumName,
} from "@/context/catDataSelectors";

import {
  assignDetectionToCat,
} from "@/services/detection";

import type {
  Cat,
  EmotionKey,
} from "@/types/models";

import {
  colors,
  dimensions,
  radii,
  spacing,
  typography,
} from "@/constants/theme";

type SaveStep =
  | "select"
  | "confirmSave"
  | "saving"
  | "saved";

function firstParam(
  value:
    | string
    | string[]
    | undefined
): string | undefined {
  if (
    Array.isArray(value)
  ) {
    return value[0];
  }

  return value;
}

function isEmotionKey(
  value: string
): value is EmotionKey {
  return (
    value === "happy" ||
    value === "neutral" ||
    value === "fear" ||
    value === "angry"
  );
}

export default function CameraSave() {
  const router =
    useRouter();

  const params =
    useLocalSearchParams();

  const {
    state,
    addCat,
    saveCapture,
  } = useCatData();

  const imageUri =
    firstParam(
      params.imageUri
    );

  const capturedAt =
    firstParam(
      params.capturedAt
    );

  const detectionId =
    firstParam(
      params.detectionId
    );

  const emotionParam =
    firstParam(
      params.emotion
    );

  const confidence =
    Number(
      firstParam(
        params.confidence
      )
    );

  const valid =
    !!imageUri &&
    !!capturedAt &&
    !!detectionId &&
    !!emotionParam &&
    isEmotionKey(
      emotionParam
    ) &&
    Number.isFinite(
      confidence
    );

  const [
    step,
    setStep,
  ] = useState<SaveStep>(
    "select"
  );

  const [
    pendingAlbumId,
    setPendingAlbumId,
  ] = useState<
    string | null
  >(null);

  const [
    addingCat,
    setAddingCat,
  ] = useState(false);

  const [
    catSavedNotice,
    setCatSavedNotice,
  ] = useState(false);

  const [
    saveError,
    setSaveError,
  ] = useState<
    string | null
  >(null);

  const saved =
    useRef(false);

  const catSubmitted =
    useRef(false);

  const handleContinue =
    useCallback(() => {
      router.dismissTo(
        "/camera"
      );
    }, [router]);

  const handleBack =
    useCallback(() => {
      if (
        step === "saving"
      ) {
        return;
      }

      if (
        saved.current ||
        !valid
      ) {
        handleContinue();

        return;
      }

      router.back();
    }, [
      handleContinue,
      router,
      step,
      valid,
    ]);

  useFocusEffect(
    useCallback(() => {
      const subscription =
        BackHandler.addEventListener(
          "hardwareBackPress",
          () => {
            if (
              step ===
              "saving"
            ) {
              return true;
            }

            handleBack();

            return true;
          }
        );

      return () =>
        subscription.remove();
    }, [
      handleBack,
      step,
    ])
  );

  const handleConfirmSave =
    async () => {
      if (
        saved.current ||
        step === "saving" ||
        !valid ||
        !imageUri ||
        !capturedAt ||
        !detectionId ||
        !emotionParam ||
        !isEmotionKey(
          emotionParam
        )
      ) {
        return;
      }

      if (
        !pendingAlbumId
      ) {
        setStep("select");

        setSaveError(
          "Please choose an album."
        );

        return;
      }

      const selectedAlbum =
        selectAlbumById(
          state,
          pendingAlbumId
        );

      if (!selectedAlbum) {
        setStep("select");

        setSaveError(
          "That album is no longer available. Please choose another."
        );

        return;
      }

      saved.current = true;

      setSaveError(null);
      setStep("saving");

      try {
        // ----------------------------------------------------
        // REAL CAT
        //
        // Move the existing Prisma image + detection from
        // temporary Unknown Cats to the selected cat.
        // ----------------------------------------------------

        if (
          selectedAlbum.kind ===
            "cat" &&
          selectedAlbum.catId
        ) {
          await assignDetectionToCat(
            detectionId,
            selectedAlbum.catId
          );
        }

        // ----------------------------------------------------
        // UNKNOWN CATS
        //
        // Do nothing on backend.
        // The initial POST already saved the detection under
        // its generated Unknown Cats record.
        // ----------------------------------------------------

        saveCapture({
          albumId:
            pendingAlbumId,

          emotion:
            emotionParam,

          confidence,

          capturedAt,

          imageUri,
        });

        setStep("saved");
      } catch (error) {
        console.error(
          "Assign detection failed:",
          error
        );

        saved.current = false;

        setSaveError(
          error instanceof
            Error
            ? error.message
            : "Failed to save image to the selected album."
        );

        setStep("select");
      }
    };

  const openAddCat =
    () => {
      if (
        step === "saving"
      ) {
        return;
      }

      catSubmitted.current =
        false;

      setAddingCat(true);
    };

  const handleAddCatSave =
    async (
      cat: Cat
    ) => {
      if (
        catSubmitted.current
      ) {
        return;
      }

      catSubmitted.current =
        true;

      try {
        await addCat(cat);

        setAddingCat(false);

        setCatSavedNotice(
          true
        );
      } catch (error) {
        catSubmitted.current =
          false;

        throw error;
      }
    };

  if (
    !valid ||
    !imageUri ||
    !emotionParam ||
    !isEmotionKey(
      emotionParam
    )
  ) {
    return (
      <ScreenContainer
        module="camera"
        edges={["left", "right", "bottom"]}
        padded={false}
      >
        <DetailScreenHeader
          transparent
          title="Save"
          onBack={handleContinue}
        />

        <EmptyState
          icon="camera-outline"
          title="No result to save"
          message="Capture or select another image first."
          actionLabel="Back to Camera"
          onAction={handleContinue}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      module="camera"
      edges={["left", "right", "bottom"]}
      padded={false}
    >
      <DetailScreenHeader
        transparent
        title="Save"
        onBack={handleBack}
        rightElement={
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddCat}
            disabled={step === "saving"}
            accessibilityRole="button"
            accessibilityLabel="New Cat Profile"
          >
            <Ionicons
              name="add"
              size={dimensions.icon}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={
          state.albums
        }
        keyExtractor={(
          album
        ) => album.id}
        contentContainerStyle={
          styles.listContent
        }
        ListHeaderComponent={
          <View
            style={
              styles.intro
            }
          >
            <Text
              style={
                styles.question
              }
              accessibilityRole="header"
            >
              Which cat should
              this image be
              saved to?
            </Text>

            <View
              style={
                styles.preview
              }
            >
              <View
                style={
                  styles.thumbnail
                }
              >
                <MockPhoto
                  imageUri={
                    imageUri
                  }
                  size={
                    dimensions.iconLarge
                  }
                  label="Detected cat image"
                />
              </View>

              <Text
                style={
                  styles.note
                }
              >
                Image and
                detection are
                already saved.
                Choose the album
                it belongs to.
              </Text>
            </View>

            {saveError ? (
              <Text
                style={
                  styles.error
                }
                accessibilityRole="alert"
              >
                {saveError}
              </Text>
            ) : null}
          </View>
        }
        renderItem={({
          item: album,
        }) => (
          <TouchableOpacity
            style={
              styles.row
            }
            disabled={
              step ===
              "saving"
            }
            accessibilityRole="button"
            accessibilityLabel={`Save to ${selectAlbumName(
              state,
              album.id
            )}`}
            onPress={() => {
              if (
                step ===
                "saving"
              ) {
                return;
              }

              setSaveError(
                null
              );

              setPendingAlbumId(
                album.id
              );

              setStep(
                "confirmSave"
              );
            }}
          >
            <View
              style={
                styles.avatar
              }
            >
              <Ionicons
                name="paw"
                size={
                  dimensions.icon
                }
                color={
                  colors.textSecondary
                }
              />
            </View>

            <View
              style={
                styles.rowText
              }
            >
              <Text
                style={
                  styles.rowLabel
                }
              >
                {selectAlbumName(
                  state,
                  album.id
                )}
              </Text>

              {album.kind ===
              "unknown" ? (
                <Text
                  style={
                    styles.note
                  }
                >
                  For cats
                  without a
                  profile
                </Text>
              ) : null}
            </View>

            <Ionicons
              name="chevron-forward"
              size={
                dimensions.iconSmall
              }
              color={
                colors.textSecondary
              }
            />
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <Button
            label="New Cat Profile"
            variant="outline"
            onPress={
              openAddCat
            }
            disabled={
              step ===
              "saving"
            }
            style={
              styles.newCat
            }
          />
        }
      />

      <ConfirmModal
        visible={
          step ===
          "confirmSave"
        }
        title={`Save image in ${
          pendingAlbumId
            ? selectAlbumName(
                state,
                pendingAlbumId
              )
            : "this album"
        }?`}
        message="The image and detection are already stored. This will assign them to the selected album."
        confirmLabel="Save"
        onConfirm={
          handleConfirmSave
        }
        onCancel={() =>
          setStep("select")
        }
      />

      <AddCatForm
        visible={
          addingCat
        }
        onCancel={() =>
          setAddingCat(
            false
          )
        }
        onSave={
          handleAddCatSave
        }
      />

      <ConfirmModal
        visible={
          catSavedNotice
        }
        title="Cat Profile Saved!"
        message="Your new cat is ready. Choose it to assign this image."
        confirmLabel="Continue"
        hideCancel
        onConfirm={() =>
          setCatSavedNotice(
            false
          )
        }
        onCancel={() =>
          setCatSavedNotice(
            false
          )
        }
      />

      <ConfirmModal
        visible={
          step === "saved"
        }
        title="Image Saved!"
        message="The detection has been assigned to the selected album."
        confirmLabel="Continue"
        hideCancel
        onConfirm={
          handleContinue
        }
        onCancel={
          handleContinue
        }
      />
    </ScreenContainer>
  );
}

const styles =
  StyleSheet.create({
    addButton: {
      minWidth:
        dimensions.touchTarget,
      minHeight:
        dimensions.touchTarget,
      alignItems: "center",
      justifyContent:
        "center",
    },

    listContent: {
      paddingHorizontal:
        spacing.lg,
      paddingBottom:
        spacing.xl,
    },

    intro: {
      paddingVertical:
        spacing.md,
    },

    question: {
      ...typography.bodyMedium,
      color:
        colors.textPrimary,
    },

    thumbnail: {
      width:
        dimensions.capture,
      height:
        dimensions.capture,
      overflow: "hidden",
      borderRadius:
        radii.md,
    },

    preview: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop:
        spacing.md,
    },

    note: {
      ...typography.caption,
      color:
        colors.textSecondary,
      flexShrink: 1,
    },

    error: {
      ...typography.body,
      color:
        colors.dangerStrong,
      marginTop:
        spacing.sm,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      padding:
        spacing.md,
      gap: spacing.sm,
      backgroundColor:
        colors.surface,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.divider,
    },

    avatar: {
      width:
        dimensions.touchTarget,
      height:
        dimensions.touchTarget,
      borderRadius:
        radii.md,
      backgroundColor:
        colors.placeholder,
      alignItems: "center",
      justifyContent:
        "center",
    },

    rowText: {
      flex: 1,
    },

    rowLabel: {
      ...typography.subheading,
      color:
        colors.textPrimary,
    },

    newCat: {
      marginTop:
        spacing.lg,
    },
  });