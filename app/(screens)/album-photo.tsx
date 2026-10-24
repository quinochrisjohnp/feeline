import { useWellnessNavigationSafety } from "@/context/WellnessContext";

import React, { useCallback, useRef, useState } from "react";

import {
  Alert,
  BackHandler,
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
import DraggableDetailsLayout from "@/components/common/DraggableDetailsLayout";

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



import {
  colors,
  dimensions,
  fontFamily,
  spacing,
  typography,
} from "@/constants/theme";

export default function AlbumPhoto() {
  const [nativeNotice, setNativeNotice] = useState(false);
  useWellnessNavigationSafety(nativeNotice);
  const router = useRouter();

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
    useState(false);

  const [confirmingDelete, setConfirmingDelete] =
    useState(false);

  const [deletedNotice, setDeletedNotice] =
    useState(false);

  // Prevent duplicate deletion requests.
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);

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
    setNativeNotice(true);
    Alert.alert(
      "Download unavailable",
      "Downloading photos is not available yet. No file was downloaded to your device.",
      [{ text: "OK", onPress: () => setNativeNotice(false) }], { cancelable: true, onDismiss: () => setNativeNotice(false) }
    );
  };

  // Remove a photo from an Album, not Detection History.
  const handleDeleteConfirm = async () => {
    if (deleteLock.current) return;

    // The same Album removal applies regardless of entry route.
    if (!savedImage) {
      setConfirmingDelete(false);
      return;
    }

    deleteLock.current = true;
    setDeleting(true);

    try {
      // Wait for the backend to update PostgreSQL.
      await deleteImage(savedImage.id);

      // Only show success after the request succeeds.
      setConfirmingDelete(false);
      setDeletedNotice(true);
    } catch (error) {
      setConfirmingDelete(false);

      setNativeNotice(true);
      Alert.alert(
        "Deletion Failed",
        error instanceof Error
          ? error.message
          : "Unable to remove the photo from the Album. Please try again.",
        [{ text: "OK", onPress: () => setNativeNotice(false) }], { cancelable: true, onDismiss: () => setNativeNotice(false) }
      );
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  };

  // Show the success notice after confirmed deletion.
  if (deletedNotice) {
    return (
      <ScreenContainer
        module="gallery"
        edges={["left", "right"]}
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
        module="gallery"
        edges={["left", "right"]}
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


  // Only saved photos have an Album membership to remove.
  const canRemoveFromAlbum =
    !!savedImage;

  return (
    <ScreenContainer
      module="gallery"
      edges={["left", "right"]}
      padded={false}
    >
      <DetailScreenHeader
        transparent
        title={formatFullDate(image.capturedAt)}
        subtitle={formatTime(image.capturedAt)}
        onBack={backToAlbum}
      />

      <DraggableDetailsLayout imageUri={image.imageUri} detailsVisible={showEmotion} onDismiss={() => setShowEmotion(false)} footer={<View style={styles.toolbar}>
        {/* Emotion */}
        <TouchableOpacity
          style={[styles.action, showEmotion && styles.activeAction]}
          accessibilityRole="button"
          accessibilityLabel="Emotion"
          accessibilityState={{
            expanded: showEmotion,
            selected: showEmotion,
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
      </View>}>
        {showEmotion && (record ? <EmotionResultCard embedded emotionKey={record.emotion} confidence={record.confidence} /> : <Text style={styles.missingText}>No detection result is available for this photo.</Text>)}
      </DraggableDetailsLayout>

      {/* Confirmation before removing from Album */}
      <ConfirmModal
        visible={confirmingDelete}
        title="Delete this Photo?"
        message="Remove photo from this album? Detection history will not be kept."
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
    paddingBottom: spacing.sm,
  },

  action: {
    flex: 1,
    minHeight: dimensions.touchTarget,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },

  activeAction: { backgroundColor: colors.card, borderTopWidth: 2, borderTopColor: colors.textPrimary },

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
