import { useWellnessNavigationSafety } from "@/context/WellnessContext";
import React, { useCallback, useRef, useState } from "react";
import { Alert, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionBadge from "@/components/common/EmotionBadge";
import { useCatData } from "@/context/CatDataContext";
import { selectAlbumById, selectAlbumName, selectImagesForAlbum, selectDetectionForImage } from "@/context/catDataSelectors";
import MockPhoto from "@/components/common/MockPhoto";
import { formatFullDate, formatTime } from "@/utils/date";
import { colors, dimensions, fontFamily, radii, spacing, typography } from "@/constants/theme";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

// Small, consistent gap between thumbnails; Album-module only.
const ALBUM_GRID_GAP = 4;

export default function AlbumFolder() {
  const [nativeNotice, setNativeNotice] = useState(false);
  useWellnessNavigationSafety(nativeNotice);
  const [gridWidth, setGridWidth] = useState(0);
  // Round down slightly so fractional layout precision cannot wrap the third tile.
  const albumThumbnailSize = Math.max(0, Math.floor((gridWidth - ALBUM_GRID_GAP * 2) / 3 * 100) / 100);
  const router = useRouter();
  const params = useLocalSearchParams<{ albumId?: string }>();
  const albumId = typeof params.albumId === "string" ? params.albumId : "";
  const { state, deleteImages } = useCatData();
  const album = selectAlbumById(state, albumId);
  const albumName = selectAlbumName(state, albumId);
  const folderImages = selectImagesForAlbum(state, albumId);
  const [selection, setSelection] = useState<{ albumId: string; ids: string[] } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState(false);
  const longPressed = useRef(false);
  const deleteLock = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const selectionMode = selection?.albumId === albumId;
  // Only IDs still present in this album can be acted on, even after another view changes state.
  const selectedIds = selectionMode ? folderImages.filter((image) => selection.ids.includes(image.id)).map((image) => image.id) : [];
  const allSelected = folderImages.length > 0 && selectedIds.length === folderImages.length;
  
  const exitSelectionMode = useCallback(() => setSelection(null), []);
  const backToAlbums = () => router.dismissTo("/album");

  const [downloading, setDownloading] = useState(false);
  const downloadLock = useRef(false);

  const handleDownloadSelected = async () => {
    if (downloadLock.current || selectedIds.length === 0) {
      return;
    }

    downloadLock.current = true;
    setDownloading(true);

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow FeELINE to save photos to your Gallery."
        );
        return;
      }

      const cacheDirectory = FileSystem.cacheDirectory;

      if (!cacheDirectory) {
        throw new Error("Temporary storage is unavailable.");
      }

      // Snapshot the selected photos before starting downloads.
      const selectedImages = folderImages.filter((image) =>
        selectedIds.includes(image.id)
      );

      let successCount = 0;
      const failedImages: string[] = [];

      for (let index = 0; index < selectedImages.length; index++) {
        const image = selectedImages[index];

        try {
          const imageUrl = image.imageUri;

          if (!/^https?:\/\//i.test(imageUrl)) {
            throw new Error("Invalid image URL");
          }

          const extension =
            imageUrl
              .split("?")[0]
              .match(/\.(jpg|jpeg|png|webp)$/i)?.[1] ?? "jpg";

          // Unique temporary filename for each selected image.
          const localUri =
            `${cacheDirectory}feeline-cat-${Date.now()}-${index}.${extension}`;

          const result = await FileSystem.downloadAsync(
            imageUrl,
            localUri
          );

          if (result.status < 200 || result.status >= 300) {
            throw new Error(`HTTP ${result.status}`);
          }

          await MediaLibrary.saveToLibraryAsync(result.uri);

          successCount++;
        } catch (error) {
          console.error(
            `Failed to download image ${image.id}:`,
            error
          );

          failedImages.push(image.id);
        }
      }

      if (failedImages.length === 0) {
        Alert.alert(
          "Download Successful",
          `${successCount} photo(s) saved to your Gallery.`
        );
      } else {
        Alert.alert(
          successCount > 0
            ? "Download Partially Completed"
            : "Download Failed",
          `${successCount} photo(s) saved.\n${failedImages.length} photo(s) could not be downloaded.`
        );
      }
    } catch (error) {
      console.error("Selected photo download failed:", error);

      Alert.alert(
        "Download Failed",
        error instanceof Error
          ? error.message
          : "Unable to download the selected photos."
      );
    } finally {
      downloadLock.current = false;
      setDownloading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    if (!selectionMode) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      exitSelectionMode();
      return true;
    });
    return () => subscription.remove();
  }, [exitSelectionMode, selectionMode]));

  const handleTilePress = (imageId: string) => {
    if (longPressed.current) return;
    if (selectionMode) {
      setSelection({ albumId, ids: selectedIds.includes(imageId)
        ? selectedIds.filter((id) => id !== imageId) : [...selectedIds, imageId] });
    } else router.push({ pathname: "/album-photo", params: { imageId } });
  };
  const handleSelectAll = () => setSelection({ albumId, ids: allSelected ? [] : folderImages.map((image) => image.id) });
  const handleDeleteSelected = async () => {
    if (deleteLock.current) return;
    if (!selectedIds.length) { setConfirmingDelete(false); return; }
    deleteLock.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteImages(selectedIds);
      setConfirmingDelete(false);
      setSelection(null);
      setDeletedNotice(true);
    } catch {
      setDeleteError("Some photos could not be removed. Please try again.");
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  };
  const dismissNotice = () => { setDeletedNotice(false); exitSelectionMode(); };

  return (
    <ScreenContainer module="gallery" edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader transparent title={album ? albumName : "Album unavailable"}
        subtitle={selectionMode ? `${selectedIds.length} selected` : undefined}
        titleFontFamily={fontFamily.heading}
        onBack={selectionMode ? exitSelectionMode : () => {
          if (router.canGoBack()) router.back();
          else backToAlbums();
        }} />
      {!album ? (
        <EmptyState icon="images-outline" title="Album unavailable" message="This album may have been deleted."
          actionLabel="Back to Cat Album" onAction={backToAlbums} />
      ) : folderImages.length === 0 ? (
        <View style={styles.empty}><EmptyState icon="camera-outline" title="No photos yet" message={`Photos you save for ${albumName} will appear here.`}
          actionLabel="Open Camera" onAction={() => router.dismissTo("/camera")} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.gridContent}>
          <Text style={styles.hint}>Tap a photo to open it. Hold to select photos.</Text>
          <View style={styles.photoGrid} onLayout={({ nativeEvent: { layout } }) => setGridWidth(layout.width)}>
            {albumThumbnailSize > 0 && folderImages.map((image, index) => {
              const record = selectDetectionForImage(state, image.id);
              const isSelected = selectedIds.includes(image.id);
              const isLastInRow = (index + 1) % 3 === 0;
              return (
                <TouchableOpacity key={image.id}
                  style={[
                    styles.photoTile,
                    { width: albumThumbnailSize, height: albumThumbnailSize },
                    !isLastInRow && { marginRight: ALBUM_GRID_GAP },
                    isSelected && styles.photoTileSelected,
                  ]}
                  accessibilityRole={selectionMode ? "checkbox" : "button"}
                  accessibilityState={{ checked: selectionMode ? isSelected : undefined }}
                  accessibilityLabel={`Photo, ${formatFullDate(image.capturedAt)}, ${formatTime(image.capturedAt)}`}
                  accessibilityHint={selectionMode ? "Toggle selection" : "Open photo. Hold to select."}
                  onPressIn={() => { longPressed.current = false; }}
                  onPress={() => handleTilePress(image.id)}
                  onLongPress={() => {
                    longPressed.current = true;
                    if (!selectionMode) setSelection({ albumId, ids: [image.id] });
                  }} activeOpacity={0.85}>
                  <MockPhoto imageUri={image.imageUri} size={26} />
                  {record ? <View style={styles.emotionDot}><EmotionBadge emotion={record.emotion} size={22} /></View> : null}
                  {selectionMode ? (
                    <View style={styles.selectionCheck}>
                      <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={24} color={colors.textPrimary} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
      {selectionMode && album ? (
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.action} accessibilityRole="button" accessibilityLabel={allSelected ? "Deselect All" : "Select All"} onPress={handleSelectAll} disabled={!folderImages.length}>
            <Ionicons name="checkmark-done-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.actionLabel}>{allSelected ? "Deselect All" : "Select All"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.action,
              (!selectedIds.length || downloading) && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Download"
            accessibilityState={{
              disabled: !selectedIds.length || downloading,
              busy: downloading,
            }}
            disabled={!selectedIds.length || downloading}
            onPress={handleDownloadSelected}
          >
            <Ionicons
              name="download-outline"
              size={22}
              color={colors.textPrimary}
            />
            <Text style={styles.actionLabel}>
              {downloading ? "Downloading..." : "Download"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, !selectedIds.length && styles.disabled]} accessibilityRole="button" accessibilityLabel="Delete"
            accessibilityState={{ disabled: !selectedIds.length }} disabled={!selectedIds.length}
            onPress={() => { setDeleteError(null); setConfirmingDelete(true); }}>
            <Ionicons name="trash-outline" size={22} color={colors.dangerStrong} />
            <Text style={[styles.actionLabel, { color: colors.dangerStrong }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <ConfirmModal visible={confirmingDelete} title="Delete these Photos?"
        message={deleteError ?? `Remove ${selectedIds.length} selected photo(s) from this album? Detection history will not be kept.`}
        confirmLabel="Delete" destructive busy={deleting} onConfirm={handleDeleteSelected} onCancel={() => { if (!deleteLock.current) setConfirmingDelete(false); }} />
      <ConfirmModal visible={deletedNotice} title="Images Deleted" confirmLabel="Continue" hideCancel
        onConfirm={dismissNotice} onCancel={dismissNotice} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.md },
  gridContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  hint: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, marginVertical: spacing.sm },
  photoGrid: { flexDirection: "row", flexWrap: "wrap" },
  photoTile: { marginBottom: ALBUM_GRID_GAP, borderWidth: 0,
    backgroundColor: colors.placeholder,
    alignItems: "center", justifyContent: "center" },
  photoTileSelected: { borderWidth: 3, borderColor: colors.textPrimary },
  emotionDot: { position: "absolute", bottom: 2, left: 2 },
  selectionCheck: { position: "absolute", top: 2, right: 2, backgroundColor: colors.surface, borderRadius: radii.pill },
  selectionBar: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.xs },
  action: { flexGrow: 1, flexBasis: 80, minHeight: dimensions.touchTarget, alignItems: "center", gap: spacing.xxs, padding: spacing.xs },
  disabled: { opacity: 0.5 },
  actionLabel: { ...typography.caption, fontFamily: fontFamily.semibold, color: colors.textPrimary, textAlign: "center" }, /// FONT STYLE
});
