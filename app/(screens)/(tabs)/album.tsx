import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import CatCoverCard from "@/components/cats/CatCoverCard";
import AlbumActionSheet from "@/components/cats/AlbumActionSheet";
import RenameCatModal from "@/components/cats/RenameCatModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useCatData, UNKNOWN_CAT_ID } from "@/context/CatDataContext";
import type { Cat } from "@/types/models";
import { colors, spacing, typography } from "@/constants/theme";

// Folder contents and photo detail now live in app/(screens)/album-folder.tsx
// and album-photo.tsx (siblings of (tabs), so the tab bar hides on them).
export default function Album() {
  const router = useRouter();
  const { cats, renameCat, deleteCat } = useCatData();

  const [actionSheetCatId, setActionSheetCatId] = useState<string | null>(null);
  const [renamingCat, setRenamingCat] = useState<Cat | null>(null);
  const [deletingCat, setDeletingCat] = useState<Cat | null>(null);

  const albumFolders: Cat[] = useMemo(
    () => [...cats, { id: UNKNOWN_CAT_ID, name: "Unknown Cats", gender: "Male", birthdate: "" }],
    [cats]
  );

  const actionSheetCat = albumFolders.find((cat) => cat.id === actionSheetCatId) ?? null;

  const openFolder = (catId: string) => {
    router.push({ pathname: "/album-folder", params: { catId } });
  };

  const handleRenamePress = () => {
    if (actionSheetCat) setRenamingCat(actionSheetCat);
    setActionSheetCatId(null);
  };

  const handleDeletePress = () => {
    if (actionSheetCat) setDeletingCat(actionSheetCat);
    setActionSheetCatId(null);
  };

  const handleRenameSave = (newName: string) => {
    if (renamingCat) renameCat(renamingCat.id, newName);
    setRenamingCat(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingCat) deleteCat(deletingCat.id);
    setDeletingCat(null);
  };

  return (
    <ScreenContainer contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}>
      <Text style={styles.title}>Cat Album</Text>
      <Text style={styles.hint}>Long-press an album to rename or delete it.</Text>

      <View style={styles.grid}>
        {albumFolders.map((cat) => (
          <CatCoverCard
            key={cat.id}
            cat={cat}
            variant="tile"
            onPress={() => openFolder(cat.id)}
            onLongPress={cat.id === UNKNOWN_CAT_ID ? undefined : () => setActionSheetCatId(cat.id)}
            style={styles.tile}
          />
        ))}
      </View>

      <AlbumActionSheet
        visible={!!actionSheetCat}
        albumName={actionSheetCat?.name ?? ""}
        onRename={handleRenamePress}
        onDelete={handleDeletePress}
        onClose={() => setActionSheetCatId(null)}
      />

      <RenameCatModal
        visible={!!renamingCat}
        initialName={renamingCat?.name ?? ""}
        onCancel={() => setRenamingCat(null)}
        onSave={handleRenameSave}
      />

      <ConfirmModal
        visible={!!deletingCat}
        title="Delete this album?"
        message="This also deletes the connected Cat Profile and its saved photos."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCat(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.lg },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  tile: { width: "48%", marginBottom: spacing.md },
});