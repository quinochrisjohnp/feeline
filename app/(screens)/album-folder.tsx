import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionBadge from "@/components/common/EmotionBadge";
import { useCatData } from "@/context/CatDataContext";
import { selectAlbumName, selectImagesForAlbum, selectDetectionForImage } from "@/context/catDataSelectors";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function AlbumFolder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ albumId?: string }>();
  const albumId = params.albumId ?? "";
  const { state, deleteImages } = useCatData();

  const catName = selectAlbumName(state, albumId);
  const folderImages = selectImagesForAlbum(state, albumId);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState(false);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleTilePress = (imageId: string) => {
    if (selectionMode) {
      setSelectedIds((current) =>
        current.includes(imageId) ? current.filter((id) => id !== imageId) : [...current, imageId]
      );
      return;
    }
    router.push({ pathname: "/album-photo", params: { imageId } });
  };

  const handleTileLongPress = (imageId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds([imageId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === folderImages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(folderImages.map((image) => image.id));
    }
  };

  const handleDownloadSelected = () => {
    Alert.alert("Download", `${selectedIds.length} photo(s) will be downloaded. (Placeholder action)`);
  };

  const handleDeleteSelected = () => {
    deleteImages(selectedIds);
    setConfirmingDelete(false);
    setDeletedNotice(true);
  };

  return (
    <ScreenContainer
      edges={["left", "right", "bottom"]}
      padded={false}
      contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}
    >
      <DetailScreenHeader
        title={catName}
        subtitle={selectionMode ? `${selectedIds.length} selected` : undefined}
        onBack={selectionMode ? exitSelectionMode : undefined}
      />

      {folderImages.length === 0 ? (
        <EmptyState icon="camera-outline" title="No photos yet" message={`Photos you save for ${catName} will appear here.`} />
      ) : (
        <View style={styles.photoGrid}>
          {folderImages.map((image) => {
            const record = selectDetectionForImage(state, image.id);
            const isSelected = selectedIds.includes(image.id);
            return (
              <TouchableOpacity
                key={image.id}
                style={[styles.photoTile, isSelected && styles.photoTileSelected]}
                onPress={() => handleTilePress(image.id)}
                onLongPress={() => handleTileLongPress(image.id)}
                activeOpacity={0.85}
              >
                <MockPhoto imageUri={image.imageUri} size={26} />
                <View style={styles.photoEmotionDot}>
                  {record && <EmotionBadge emotion={record.emotion} size={22} />}
                </View>
                {selectionMode && (
                  <View style={styles.selectionCheck}>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={isSelected ? colors.primary : colors.white}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {selectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity style={styles.selectionAction} onPress={handleSelectAll}>
            <Ionicons name="checkmark-done-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.selectionActionLabel}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectionAction} onPress={handleDownloadSelected}>
            <Ionicons name="download-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.selectionActionLabel}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectionAction, selectedIds.length === 0 && styles.selectionActionDisabled]}
            onPress={() => setConfirmingDelete(true)}
            disabled={selectedIds.length === 0}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.selectionActionLabel, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={confirmingDelete}
        title="Delete these Photos?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmingDelete(false)}
      />

      <ConfirmModal
        visible={deletedNotice}
        title="Images Deleted"
        confirmLabel="Continue"
        hideCancel
        onConfirm={() => {
          setDeletedNotice(false);
          exitSelectionMode();
        }}
        onCancel={() => {
          setDeletedNotice(false);
          exitSelectionMode();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  photoGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.lg, marginHorizontal: -spacing.xxs },
  photoTile: {
    width: "31.33%",
    aspectRatio: 1,
    margin: spacing.xxs,
    borderRadius: radii.md,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  photoTileSelected: { borderWidth: 3, borderColor: colors.primary },
  photoEmotionDot: { position: "absolute", bottom: 4, right: 4 },
  selectionCheck: { position: "absolute", top: 4, right: 4 },
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  selectionAction: { alignItems: "center", gap: 4 },
  selectionActionDisabled: { opacity: 0.4 },
  selectionActionLabel: { ...typography.caption, color: colors.textPrimary },
});
