import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenContainer from "@/components/common/ScreenContainer";
import CatCoverCard from "@/components/cats/CatCoverCard";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmotionBadge from "@/components/common/EmotionBadge";
import { mockCats } from "@/data/mockCats";
import { mockDetectionRecords as initialRecords } from "@/data/mockDetectionRecords";
import type { DetectionRecord } from "@/types/models";
import { formatFullDate, formatTime } from "@/utils/date";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

type AlbumView = "grid" | "folder" | "detail";

// TODO(backend): back mockCats/initialRecords with real API data — the
// grid/folder/detail flow below doesn't need to change shape.
export default function Album() {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<DetectionRecord[]>(initialRecords);
  const [view, setView] = useState<AlbumView>("grid");
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEmotion, setShowEmotion] = useState(false);

  const activeCat = mockCats.find((cat) => cat.id === activeCatId) ?? null;
  const activeRecord = records.find((record) => record.id === activeRecordId) ?? null;

  const folderRecords = useMemo(
    () => records.filter((record) => record.catId === activeCatId),
    [records, activeCatId]
  );

  const openFolder = (catId: string) => {
    setActiveCatId(catId);
    setView("folder");
  };

  const openDetail = (recordId: string) => {
    setActiveRecordId(recordId);
    setShowEmotion(false);
    setView("detail");
  };

  const handleDelete = () => {
    if (!activeRecord) return;
    setRecords((current) => current.filter((record) => record.id !== activeRecord.id));
    setDeleting(false);
    setView("folder");
    Alert.alert("Deleted", "Photo removed. (Placeholder action)");
  };

  const handleDownload = () => {
    Alert.alert("Download", "Saving to device is coming soon.");
  };

  if (view === "grid") {
    return (
      <ScreenContainer contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}>
        <Text style={styles.title}>Cat Album</Text>
        {mockCats.length === 0 ? (
          <EmptyState icon="images-outline" title="No albums yet" message="Add a cat to start saving photos." />
        ) : (
          <View style={styles.grid}>
            {mockCats.map((cat) => (
              <CatCoverCard key={cat.id} cat={cat} variant="tile" onPress={() => openFolder(cat.id)} style={styles.tile} />
            ))}
          </View>
        )}
      </ScreenContainer>
    );
  }

  if (view === "folder" && activeCat) {
    return (
      <ScreenContainer contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}>
        <View style={styles.folderHeader}>
          <TouchableOpacity onPress={() => setView("grid")} accessibilityLabel="Back to Cat Album">
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.folderTitle}>{activeCat.name}</Text>
        </View>

        {folderRecords.length === 0 ? (
          <EmptyState
            icon="camera-outline"
            title="No photos yet"
            message={`Photos you save for ${activeCat.name} will appear here.`}
          />
        ) : (
          <View style={styles.photoGrid}>
            {folderRecords.map((record) => (
              <TouchableOpacity
                key={record.id}
                style={styles.photoTile}
                onPress={() => openDetail(record.id)}
                activeOpacity={0.85}
              >
                <Ionicons name="image-outline" size={26} color={colors.textMuted} />
                <View style={styles.photoEmotionDot}>
                  <EmotionBadge emotion={record.emotion} size={22} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScreenContainer>
    );
  }

  if (view === "detail" && activeRecord && activeCat) {
    return (
      <View style={styles.detailContainer}>
        <View style={[styles.detailHeader, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => setView("folder")} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.detailHeaderText}>
            <Text style={styles.detailDate}>{formatFullDate(activeRecord.recordedAt)}</Text>
            <Text style={styles.detailTime}>{formatTime(activeRecord.recordedAt)}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}>
          <View style={styles.detailPhoto}>
            <Ionicons name="image-outline" size={48} color={colors.textMuted} />
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity style={styles.detailAction} onPress={() => setShowEmotion((v) => !v)}>
              <Ionicons name="happy-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.detailActionLabel}>Emotion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailAction} onPress={handleDownload}>
              <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.detailActionLabel}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailAction} onPress={() => setDeleting(true)}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
              <Text style={[styles.detailActionLabel, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>

          {showEmotion && (
            <View style={styles.emotionWrapper}>
              <EmotionResultCard emotionKey={activeRecord.emotion} confidence={activeRecord.confidence} />
            </View>
          )}
        </ScrollView>

        <ConfirmModal
          visible={deleting}
          title="Delete this Photo?"
          message="This action cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setDeleting(false)}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  title: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  tile: { width: "48%", marginBottom: spacing.md },
  folderHeader: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg, marginBottom: spacing.lg, gap: spacing.sm },
  folderTitle: { ...typography.heading, color: colors.textPrimary },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xxs },
  photoTile: {
    width: "31.33%",
    aspectRatio: 1,
    margin: spacing.xxs,
    borderRadius: radii.md,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  photoEmotionDot: { position: "absolute", bottom: 4, right: 4 },
  detailContainer: { flex: 1, backgroundColor: colors.background },
  detailHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  detailHeaderText: { marginLeft: spacing.xs },
  detailDate: { ...typography.subheading, color: colors.textPrimary },
  detailTime: { ...typography.caption, color: colors.textMuted },
  detailPhoto: {
    marginHorizontal: spacing.lg,
    height: 380,
    borderRadius: radii.lg,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  detailActions: { flexDirection: "row", justifyContent: "space-evenly", marginTop: spacing.lg, marginBottom: spacing.md },
  detailAction: { alignItems: "center", gap: 4 },
  detailActionLabel: { ...typography.caption, color: colors.textPrimary },
  emotionWrapper: { marginTop: spacing.sm },
});