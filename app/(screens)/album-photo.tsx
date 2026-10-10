
import React, { useCallback, useEffect, useState } from "react";

import {
  Alert,
  BackHandler,
  Image,
  ScrollView,
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

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionIcon from "@/components/common/EmotionIcon";
import EmotionResultCard from "@/components/camera/EmotionResultCard";

import { useCatData } from "@/context/CatDataContext";

import { formatFullDate, formatTime } from "@/utils/date";

import {
  selectAlbumById,
  selectImageById,
  selectDetectionForImage,
} from "@/context/catDataSelectors";

import MockPhoto from "@/components/common/MockPhoto";

import {
  colors,
  dimensions,
  fontFamily,
  spacing,
  typography,
} from "@/constants/theme";

// Fallback aspect ratios for images whose dimensions
// cannot be retrieved.
const MOCK_ASPECT_RATIOS = [0.5, 0.75, 1, 1.6, 2.4];

function mockAspectRatioFor(imageUri: string): number {
  let hash = 0;

  for (let i = 0; i < imageUri.length; i++) {
    hash =
      (hash * 31 + imageUri.charCodeAt(i)) >>> 0;
  }

  return MOCK_ASPECT_RATIOS[
    hash % MOCK_ASPECT_RATIOS.length
  ];
}

interface Size {
  width: number;
  height: number;
}

export default function AlbumPhoto() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    imageId?: string;
    from?: string;
  }>();

  const fromCalendar = params.from === "calendar";

  const imageId =
    typeof params.imageId === "string"
      ? params.imageId
      : "";

  const { state, deleteImage } = useCatData();

  // Find a photo explicitly saved to an Album.
  const savedImage = selectImageById(state, imageId);

  // Find its detection independently of Album storage.
  const record = selectDetectionForImage(state, imageId);

  // Calendar can display detections that were
  // never explicitly saved to an Album.
  const image =
    savedImage ??
    (fromCalendar && record?.imageUri
      ? {
          id: record.imageId,
          albumId: "",
          imageUri: record.imageUri,
          capturedAt: record.recordedAt,
        }
      : null);

  const [showEmotion, setShowEmotion] =
    useState(fromCalendar);

  const [confirmingDelete, setConfirmingDelete] =
    useState(false);

  const [deletedNotice, setDeletedNotice] =
    useState(false);

  // Prevent duplicate deletion requests.
  const [deleting, setDeleting] = useState(false);

  const [intrinsic, setIntrinsic] =
    useState<Size | null>(null);

  const [availableArea, setAvailableArea] =
    useState<Size | null>(null);

  // Determine photo dimensions.
  useEffect(() => {
    setIntrinsic(null);

    const uri = image?.imageUri;

    if (!uri) return;

    let cancelled = false;

    const applyFallback = () => {
      if (cancelled) return;

      const ratio = mockAspectRatioFor(uri);

      setIntrinsic({
        width: 1000,
        height: Math.round(1000 / ratio),
      });
    };

    if (Image && typeof Image.getSize === "function") {
      try {
        Image.getSize(
          uri,
          (width, height) => {
            if (!cancelled) {
              setIntrinsic({ width, height });
            }
          },
          applyFallback
        );
      } catch {
        applyFallback();
      }
    } else {
      applyFallback();
    }

    return () => {
      cancelled = true;
    };
  }, [image?.imageUri]);

  // Preserve the parent Album for navigation.
  const [parentAlbumId] = useState(
    image?.albumId ?? null
  );

  const availableAlbumId =
    image?.albumId ?? parentAlbumId;

  const parentExists =
    !!availableAlbumId &&
    !!selectAlbumById(state, availableAlbumId);

  const backToAlbum = useCallback(() => {
    if (fromCalendar) {
      router.dismissTo("/calendar");
    } else if (parentExists && availableAlbumId) {
      router.dismissTo({
        pathname: "/album-folder",
        params: {
          albumId: availableAlbumId,
        },
      });
    } else {
      router.dismissTo("/album");
    }
  }, [
    availableAlbumId,
    parentExists,
    fromCalendar,
    router,
  ]);

  useFocusEffect(
    useCallback(() => {
      const subscription =
        BackHandler.addEventListener(
          "hardwareBackPress",
          () => {
            backToAlbum();
            return true;
          }
        );

      return () => subscription.remove();
    }, [backToAlbum])
  );

  // Download functionality is still a placeholder.
  const handleDownload = () => {
    Alert.alert(
      "Mock download",
      "This is a placeholder action. No file was downloaded to your device."
    );
  };

  // Remove a photo from an Album, not Detection History.
  const handleDeleteConfirm = async () => {
    if (deleting) return;

    // Calendar photos should not be deleted
    // through the Album removal operation.
    if (fromCalendar || !savedImage) {
      setConfirmingDelete(false);
      return;
    }

    setDeleting(true);

    try {
      // Wait for the backend to update PostgreSQL.
      await deleteImage(savedImage.id);

      // Only show success after the request succeeds.
      setConfirmingDelete(false);
      setDeletedNotice(true);
    } catch (error) {
      setConfirmingDelete(false);

      Alert.alert(
        "Deletion Failed",
        error instanceof Error
          ? error.message
          : "Unable to remove the photo from the Album. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Show the success notice after confirmed deletion.
  if (deletedNotice) {
    return (
      <ScreenContainer
        module={fromCalendar ? "calendar" : "album"}
        edges={["left", "right", "bottom"]}
        padded={false}
      >
        <DetailScreenHeader
          transparent
          title="Photo"
          onBack={backToAlbum}
        />

        <ConfirmModal
          visible
          title="Removed from Album"
          confirmLabel="Continue"
          hideCancel
          onConfirm={backToAlbum}
          onCancel={backToAlbum}
        />
      </ScreenContainer>
    );
  }

  if (!image) {
    return (
      <ScreenContainer
        module={fromCalendar ? "calendar" : "album"}
        edges={["left", "right", "bottom"]}
        padded={false}
      >
        <DetailScreenHeader
          transparent
          title="Photo"
          onBack={backToAlbum}
        />

        <EmptyState
          icon="image-outline"
          title="Photo unavailable"
          message="This photo may have been removed from its Album."
          actionLabel={
            fromCalendar
              ? "Back to Calendar"
              : parentExists
                ? "Back to album"
                : "Back to Cat Album"
          }
          onAction={backToAlbum}
        />
      </ScreenContainer>
    );
  }

  // Calculate dimensions while preserving aspect ratio.
  let displayWidth = 0;
  let displayHeight = 0;

  if (
    intrinsic &&
    availableArea &&
    availableArea.width > 0 &&
    availableArea.height > 0
  ) {
    const scale = Math.min(
      1,
      availableArea.width / intrinsic.width,
      availableArea.height / intrinsic.height
    );

    displayWidth = intrinsic.width * scale;
    displayHeight = intrinsic.height * scale;
  }

  const ready =
    intrinsic !== null && availableArea !== null;

  // Album removal is only available from an Album.
  const canRemoveFromAlbum =
    !fromCalendar && !!savedImage;

  return (
    <ScreenContainer
      module={fromCalendar ? "calendar" : "album"}
      edges={["left", "right", "bottom"]}
      padded={false}
    >
      <DetailScreenHeader
        transparent
        title={formatFullDate(image.capturedAt)}
        subtitle={formatTime(image.capturedAt)}
        onBack={backToAlbum}
      />

      <View
        style={styles.imageArea}
        onLayout={(event) =>
          setAvailableArea({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          })
        }
      >
        {ready ? (
          <View
            style={[
              styles.photo,
              {
                width: displayWidth,
                height: displayHeight,
              },
            ]}
          >
            <MockPhoto
              imageUri={image.imageUri}
              size={48}
              label="Captured photo"
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.loadingPlaceholder} />
        )}
      </View>

      {showEmotion ? (
        <ScrollView
          style={styles.emotionScroll}
          contentContainerStyle={
            styles.emotionScrollContent
          }
          showsVerticalScrollIndicator={false}
        >
          {record ? (
            <EmotionResultCard
              emotionKey={record.emotion}
              confidence={record.confidence}
            />
          ) : (
            <Text style={styles.missingText}>
              No detection result is available for this photo.
            </Text>
          )}
        </ScrollView>
      ) : null}

      <View
        style={[
          styles.toolbar,
          {
            paddingBottom: Math.max(
              insets.bottom,
              spacing.sm
            ),
          },
        ]}
      >
        {/* Emotion */}
        <TouchableOpacity
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="Emotion"
          accessibilityState={{
            expanded: showEmotion,
          }}
          onPress={() =>
            setShowEmotion((value) => !value)
          }
        >
          <EmotionIcon
            emotion={record?.emotion}
            size={22}
          />

          <Text style={styles.actionLabel}>
            Emotion
          </Text>
        </TouchableOpacity>

        {/* Download */}
        <TouchableOpacity
          style={styles.action}
          accessibilityRole="button"
          accessibilityLabel="Download"
          onPress={handleDownload}
        >
          <Ionicons
            name="download-outline"
            size={22}
            color={colors.textPrimary}
          />

          <Text style={styles.actionLabel}>
            Download
          </Text>
        </TouchableOpacity>

        {/* Delete only when viewing a saved Album photo */}
        {canRemoveFromAlbum ? (
          <TouchableOpacity
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel="Delete"
            accessibilityState={{
              disabled: deleting,
            }}
            disabled={deleting}
            onPress={() =>
              setConfirmingDelete(true)
            }
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={colors.dangerStrong}
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
        ) : null}
      </View>

      {/* Confirmation before removing from Album */}
      <ConfirmModal
        visible={confirmingDelete}
        title="Remove this Photo from Album?"
        confirmLabel={deleting ? "Removing..." : "Remove"}
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!deleting) {
            setConfirmingDelete(false);
          }
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  imageArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },

  photo: {
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingPlaceholder: {
    width: "60%",
    height: "60%",
    backgroundColor: colors.border,
  },

  emotionScroll: {
    maxHeight: "45%",
  },

  emotionScrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },

  toolbar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },

  action: {
    flex: 1,
    minHeight: dimensions.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },

  actionLabel: {
    ...typography.caption,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },

  actionLabelDanger: {
    color: colors.dangerStrong,
  },

  missingText: {
    ...typography.body,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    padding: spacing.lg,
  },
});
