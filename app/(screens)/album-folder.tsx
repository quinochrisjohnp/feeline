import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import DetailScreenHeader from "@/components/common/DetailScreenHeader";
import EmptyState from "@/components/common/EmptyState";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionBadge from "@/components/common/EmotionBadge";
import { useCatData, UNKNOWN_CAT_ID } from "@/context/CatDataContext";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function AlbumFolder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ catId?: string }>();
  const catId = params.catId ?? "";
  const { cats, detectionRecords, deleteDetectionRecords } = useCatData();

  const catName = catId === UNKNOWN_CAT_ID ? "Unknown Cats" : cats.find((cat) => cat.id === catId)?.name ?? "Album";

  const folderRecords = useMemo(
    () => detectionRecords.filter((record) => record.catId === catId),
    [detectionRecords, catId]
  );

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletedNotice, setDeletedNotice] = useState(false);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleTilePress = (recordId: string) => {
    if (selectionMode) {
      setSelectedIds((current) =>
        current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId]
      );
      return;
    }
    router.push({ pathname: "/album-photo", params: { recordId } });
  };

  const handleTileLongPress = (recordId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds([recordId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === folderRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(folderRecords.map((record) => record.id));
    }
  };

  const handleDownloadSelected = () => {
    Alert.alert("Download", `${selectedIds.length} photo(s) will be downloaded. (Placeholder action)`);
  };

  const handleDeleteSelected = () => {
    deleteDetectionRecords(selectedIds);
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

      {folderRecords.length === 0 ? (
        <EmptyState icon="camera-outline" title="No photos yet" message={`Photos you save for ${catName} will appear here.`} />
      ) : (
        <View style={styles.photoGrid}>
          {folderRecords.map((record) => {
            const isSelected = selectedIds.includes(record.id);
            return (
              <TouchableOpacity
                key={record.id}
                style={[styles.photoTile, isSelected && styles.photoTileSelected]}
                onPress={() => handleTilePress(record.id)}
                onLongPress={() => handleTileLongPress(record.id)}
                activeOpacity={0.85}
              >
                <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                <View style={styles.photoEmotionDot}>
                  <EmotionBadge emotion={record.emotion} size={22} />
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