import React, {
  useCallback,
  useLayoutEffect,
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

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import ScreenContainer from "@/components/common/ScreenContainer";
import CatCoverCard from "@/components/cats/CatCoverCard";
import RenameCatModal from "@/components/cats/RenameCatModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmptyState from "@/components/common/EmptyState";

import {
  useCatData,
} from "@/context/CatDataContext";

import type {
  Album as AlbumModel,
} from "@/types/models";

import {
  selectAlbumById,
  selectAlbumName,
  selectAlbumCoverImage,
} from "@/context/catDataSelectors";

import {
  colors,
  dimensions,
  fontFamily,
  getTabBarClearance,
  shadows,
  spacing,
  typography,
} from "@/constants/theme";

export default function Album() {
  const router =
    useRouter();

  const navigation =
    useNavigation();

  const insets =
    useSafeAreaInsets();

  const {
    state,
    renameAlbum,
    deleteCat,
    refreshDetections,
  } = useCatData();

  const [
    selectedAlbumId,
    setSelectedAlbumId,
  ] = useState<
    string | null
  >(null);

  const [
    renamingAlbum,
    setRenamingAlbum,
  ] = useState<
    AlbumModel | null
  >(null);

  const [
    deletingAlbum,
    setDeletingAlbum,
  ] = useState<
    AlbumModel | null
  >(null);

  const albumFolders =
    state.albums;

  const selectedAlbum =
    selectAlbumById(
      state,
      selectedAlbumId ?? ""
    );

  const selectionActive =
    selectedAlbum?.kind ===
    "cat";

  // ==========================================================
  // REFRESH DETECTIONS WHEN ALBUM TAB IS OPENED
  // ==========================================================
  //
  // A detection is already saved to Prisma/Cloudinary before
  // the Emotion Result screen appears.
  //
  // If the user does NOT press Save, the detection remains
  // assigned to its temporary Unknown Cats database record.
  //
  // Refreshing here makes that persisted detection appear in
  // the frontend Unknown Cats system album.
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      void refreshDetections();
    }, [refreshDetections])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle:
        selectionActive
          ? {
              display:
                "none",
            }
          : undefined,
    });
  }, [
    navigation,
    selectionActive,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (!selectionActive) {
        return;
      }

      const subscription =
        BackHandler.addEventListener(
          "hardwareBackPress",
          () => {
            setSelectedAlbumId(
              null
            );

            return true;
          }
        );

      return () =>
        subscription.remove();
    }, [selectionActive])
  );

  const clearSelection =
    () => {
      setSelectedAlbumId(
        null
      );
    };

  const openFolder = (
    albumId: string
  ) => {
    router.push({
      pathname:
        "/album-folder",

      params: {
        albumId,
      },
    });
  };

  const handleAlbumPress = (
    albumId: string
  ) => {
    if (selectionActive) {
      clearSelection();
      return;
    }

    openFolder(albumId);
  };

  const handleRenamePress =
    () => {
      if (
        selectedAlbum?.kind ===
        "cat"
      ) {
        setRenamingAlbum(
          selectedAlbum
        );
      }

      setSelectedAlbumId(
        null
      );
    };

  const handleDeletePress =
    () => {
      if (
        selectedAlbum?.kind ===
        "cat"
      ) {
        setDeletingAlbum(
          selectedAlbum
        );
      }

      setSelectedAlbumId(
        null
      );
    };

  const handleRenameSave =
    async (
      newName: string
    ) => {
      if (
        renamingAlbum?.kind !==
        "cat"
      ) {
        return;
      }

      try {
        await renameAlbum(
          renamingAlbum.id,
          newName.trim()
        );

        setRenamingAlbum(
          null
        );
      } catch (error) {
        console.error(
          "Rename cat failed:",
          error
        );
      }
    };

  const handleDeleteConfirm =
    async () => {
      if (
        deletingAlbum?.kind !==
          "cat" ||
        !deletingAlbum.catId
      ) {
        return;
      }

      try {
        await deleteCat(
          deletingAlbum.catId
        );

        setDeletingAlbum(
          null
        );
      } catch (error) {
        console.error(
          "Delete cat failed:",
          error
        );
      }
    };

  return (
    <ScreenContainer
      module="album"
      padded={false}
    >
      <ScrollView
        style={
          styles.scrollFlex
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <Pressable
          disabled={
            !selectionActive
          }
          onPress={
            clearSelection
          }
          style={
            styles.contentWrap
          }
        >
          <Text
            style={
              styles.title
            }
            accessibilityRole="header"
          >
            Cat Album
          </Text>

          <Text
            style={
              styles.hint
            }
          >
            Long-press an album
            to rename or delete
            it.
          </Text>

          <View
            style={
              styles.grid
            }
          >
            {albumFolders.map(
              (album) => (
                <CatCoverCard
                  key={
                    album.id
                  }
                  name={selectAlbumName(
                    state,
                    album.id
                  )}
                  coverUri={
                    selectAlbumCoverImage(
                      state,
                      album.id
                    )?.imageUri ??
                    null
                  }
                  variant="tile"
                  selected={
                    selectionActive &&
                    album.id ===
                      selectedAlbumId
                  }
                  faded={
                    selectionActive &&
                    album.id !==
                      selectedAlbumId
                  }
                  onPress={() =>
                    handleAlbumPress(
                      album.id
                    )
                  }
                  onLongPress={
                    album.kind ===
                    "unknown"
                      ? undefined
                      : () =>
                          setSelectedAlbumId(
                            album.id
                          )
                  }
                  style={
                    album.kind ===
                    "unknown"
                      ? styles.systemTile
                      : styles.tile
                  }
                />
              )
            )}
          </View>
        </Pressable>

        {albumFolders.length ===
        0 ? (
          <EmptyState
            title="No albums available"
            icon="images-outline"
            message="Add a cat profile to create an album."
            actionLabel="Open My Cats"
            onAction={() =>
              router.navigate(
                "/status"
              )
            }
          />
        ) : null}
      </ScrollView>

      {selectionActive ? (
        <View
          style={[
            styles.actionBar,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  spacing.sm
                ),
            },
          ]}
        >
          <TouchableOpacity
            style={
              styles.actionButton
            }
            onPress={
              handleRenamePress
            }
            accessibilityRole="button"
            accessibilityLabel="Rename album"
          >
            <Ionicons
              name="pencil-outline"
              size={
                dimensions.icon
              }
              color={
                colors.textPrimary
              }
            />

            <Text
              style={
                styles.actionLabel
              }
            >
              Rename
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.actionButton
            }
            onPress={
              handleDeletePress
            }
            accessibilityRole="button"
            accessibilityLabel="Delete album"
          >
            <Ionicons
              name="trash-outline"
              size={
                dimensions.icon
              }
              color={
                colors.dangerStrong
              }
            />

            <Text
              style={[
                styles.actionLabel,
                styles.actionLabelDanger,
              ]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <RenameCatModal
        visible={
          !!renamingAlbum
        }
        initialName={selectAlbumName(
          state,
          renamingAlbum?.id ??
            ""
        )}
        onCancel={() =>
          setRenamingAlbum(
            null
          )
        }
        onSave={
          handleRenameSave
        }
      />

      <ConfirmModal
        visible={
          !!deletingAlbum
        }
        title="Delete this album?"
        message="This also deletes the connected Cat Profile, its saved photos, and their detection records."
        confirmLabel="Delete"
        destructive
        onConfirm={
          handleDeleteConfirm
        }
        onCancel={() =>
          setDeletingAlbum(
            null
          )
        }
      />
    </ScreenContainer>
  );
}

const styles =
  StyleSheet.create({
    scrollFlex: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal:
        spacing.lg,
      paddingBottom:
        getTabBarClearance(
          0
        ),
    },

    contentWrap: {
      flex: 1,
    },

    title: {
      ...typography.heading,
      fontFamily:
        fontFamily.heading,
      color:
        colors.textPrimary,
      marginTop:
        spacing.lg,
    },

    hint: {
      ...typography.caption,
      fontFamily:
        fontFamily.body,
      color:
        colors.textMuted,
      marginTop: 2,
      marginBottom:
        spacing.lg,
    },

    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
    },

    tile: {
      width: "48%",
      marginBottom:
        spacing.md,
    },

    systemTile: {
      width: "100%",
      aspectRatio: 2.2,
      marginBottom:
        spacing.md,
    },

    actionBar: {
      flexDirection: "row",
      backgroundColor:
        colors.white,
      borderTopWidth: 1,
      borderTopColor:
        colors.divider,
      paddingTop:
        spacing.sm,
      ...shadows.floating,
    },

    actionButton: {
      flex: 1,
      minHeight:
        dimensions.touchTarget,
      alignItems: "center",
      justifyContent:
        "center",
      gap: spacing.xxs,
      paddingVertical:
        spacing.xs,
    },

    actionLabel: {
      ...typography.label,
      fontFamily:
        fontFamily.semibold,
      color:
        colors.textPrimary,
    },

    actionLabelDanger: {
      color:
        colors.dangerStrong,
    },
  });