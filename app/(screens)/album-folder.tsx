import React, { useCallback, useRef, useState } from "react";
import { Alert, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
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
import { colors, dimensions, fonts, radii, spacing, typography } from "@/constants/theme";

// Small, consistent gap between thumbnails; Album-module only.
const ALBUM_GRID_GAP = 4;
const ALBUM_GRID_OUTER_PADDING = spacing.md; // matches gridContent's paddingHorizontal

export default function AlbumFolder() {
  const { width } = useWindowDimensions();
  // itemWidth = (availableWidth - outerPadding*2 - 2 inter-item gaps) / 3
  const albumThumbnailSize = (width - ALBUM_GRID_OUTER_PADDING * 2 - ALBUM_GRID_GAP * 2) / 3;
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
  const selectionMode = selection?.albumId === albumId;
  // Only IDs still present in this album can be acted on, even after another view changes state.
  const selectedIds = selectionMode ? folderImages.filter((image) => selection.ids.includes(image.id)).map((image) => image.id) : [];
  const allSelected = folderImages.length > 0 && selectedIds.length === folderImages.length;
  const exitSelectionMode = useCallback(() => setSelection(null), []);
  const backToAlbums = () => router.dismissTo("/album");

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
  const handleDeleteSelected = () => {
    if (!selectedIds.length) { setConfirmingDelete(false); return; }
    deleteImages(selectedIds);
    setConfirmingDelete(false);
    setSelection(null);
    setDeletedNotice(true);
  };
  const dismissNotice = () => { setDeletedNotice(false); exitSelectionMode(); };

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} padded={false}>
      <DetailScreenHeader title={album ? albumName : "Album unavailable"}
        subtitle={selectionMode ? `${selectedIds.length} selected` : undefined}
        titleFontFamily={fonts.albumHeading}
        onBack={selectionMode ? exitSelectionMode : () => {
          if (router.canGoBack()) router.back();
          else backToAlbums();
        }} />
      {!album ? (
        <EmptyState icon="images-outline" title="Album unavailable" message="This album may have been deleted."
          actionLabel="Back to Cat Album" onAction={backToAlbums} />
      ) : folderImages.length === 0 ? (
        <EmptyState icon="camera-outline" title="No photos yet" message={`Photos you save for ${albumName} will appear here.`}
          actionLabel="Open Camera" onAction={() => router.dismissTo("/camera")} />
      ) : (
        <ScrollView contentContainerStyle={styles.gridContent}>
          <Text style={styles.hint}>Tap a photo to open it. Hold to select photos.</Text>
          <View style={styles.photoGrid}>
            {folderImages.map((image, index) => {
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
                  accessibilityLabel={`Mock photo, ${formatFullDate(image.capturedAt)}, ${formatTime(image.capturedAt)}`}
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
          <TouchableOpacity style={[styles.action, !selectedIds.length && styles.disabled]} accessibilityRole="button" accessibilityLabel="Download"
            accessibilityState={{ disabled: !selectedIds.length }} disabled={!selectedIds.length}
            onPress={() => Alert.alert("Mock download", `${selectedIds.length} photo(s) selected. No files were downloaded to your device.`)}>
            <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.actionLabel}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, !selectedIds.length && styles.disabled]} accessibilityRole="button" accessibilityLabel="Delete"
            accessibilityState={{ disabled: !selectedIds.length }} disabled={!selectedIds.length}
            onPress={() => setConfirmingDelete(true)}>
            <Ionicons name="trash-outline" size={22} color={colors.dangerStrong} />
            <Text style={[styles.actionLabel, { color: colors.dangerStrong }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <ConfirmModal visible={confirmingDelete} title="Delete these Photos?"
        message={`Remove ${selectedIds.length} selected mock photo(s) and their detection records?`}
        confirmLabel="Delete" destructive onConfirm={handleDeleteSelected} onCancel={() => setConfirmingDelete(false)} />
      <ConfirmModal visible={deletedNotice} title="Images Deleted" confirmLabel="Continue" hideCancel
        onConfirm={dismissNotice} onCancel={dismissNotice} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  gridContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  hint: { ...typography.caption, fontFamily: fonts.albumBody, color: colors.textSecondary, marginVertical: spacing.sm },
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
  actionLabel: { ...typography.caption, color: colors.textPrimary, textAlign: "center" },
});
