import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import CatCoverCard from "@/components/cats/CatCoverCard";
import AlbumActionSheet from "@/components/cats/AlbumActionSheet";
import RenameCatModal from "@/components/cats/RenameCatModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmptyState from "@/components/common/EmptyState";
import { useCatData } from "@/context/CatDataContext";
import type { Album as AlbumModel } from "@/types/models";
import { selectAlbumById, selectAlbumName, selectAlbumCoverImage } from "@/context/catDataSelectors";
import { colors, spacing, typography } from "@/constants/theme";

// Folder contents and photo detail now live in app/(screens)/album-folder.tsx
// and album-photo.tsx (siblings of (tabs), so the tab bar hides on them).
export default function Album() {
  const router = useRouter();
  const { state, renameAlbum, deleteCat } = useCatData();

  const [actionSheetAlbumId, setActionSheetAlbumId] = useState<string | null>(null);
  const [renamingAlbum, setRenamingAlbum] = useState<AlbumModel | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<AlbumModel | null>(null);

  const albumFolders = state.albums;
  const actionSheetAlbum = selectAlbumById(state, actionSheetAlbumId ?? "");

  const openFolder = (albumId: string) => {
    router.push({ pathname: "/album-folder", params: { albumId } });
  };

  const handleRenamePress = () => {
    if (actionSheetAlbum?.kind === "cat") setRenamingAlbum(actionSheetAlbum);
    setActionSheetAlbumId(null);
  };

  const handleDeletePress = () => {
    if (actionSheetAlbum?.kind === "cat") setDeletingAlbum(actionSheetAlbum);
    setActionSheetAlbumId(null);
  };

  const handleRenameSave = (newName: string) => {
    if (renamingAlbum?.kind === "cat") renameAlbum(renamingAlbum.id, newName.trim());
    setRenamingAlbum(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingAlbum?.kind === "cat" && deletingAlbum.catId) deleteCat(deletingAlbum.catId);
    setDeletingAlbum(null);
  };

  return (
    <ScreenContainer scroll tabBar>
      <Text style={styles.title} accessibilityRole="header">Cat Album</Text>
      <Text style={styles.hint}>Long-press an album to rename or delete it.</Text>

      <View style={styles.grid}>
        {albumFolders.map((album) => (
          <CatCoverCard
            key={album.id}
            name={selectAlbumName(state, album.id)}
            coverUri={selectAlbumCoverImage(state, album.id)?.imageUri ?? null}
            variant="tile"
            onPress={() => openFolder(album.id)}
            onLongPress={album.kind === "unknown" ? undefined : () => setActionSheetAlbumId(album.id)}
            style={album.kind === "unknown" ? styles.systemTile : styles.tile}
          />
        ))}
      </View>
      {albumFolders.length === 0 ? <EmptyState title="No albums available" icon="images-outline"
        message="Add a cat profile to create an album for this mock session."
        actionLabel="Open My Cats" onAction={() => router.navigate("/status")} /> : null}

      <AlbumActionSheet
        visible={actionSheetAlbum?.kind === "cat"}
        albumName={selectAlbumName(state, actionSheetAlbum?.id ?? "")}
        onRename={handleRenamePress}
        onDelete={handleDeletePress}
        onClose={() => setActionSheetAlbumId(null)}
      />

      <RenameCatModal
        visible={!!renamingAlbum}
        initialName={selectAlbumName(state, renamingAlbum?.id ?? "")}
        onCancel={() => setRenamingAlbum(null)}
        onSave={handleRenameSave}
      />

      <ConfirmModal
        visible={!!deletingAlbum}
        title="Delete this album?"
        message="This also deletes the connected Cat Profile, its saved mock photos, and their detection records."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingAlbum(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.lg },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  tile: { width: "48%", marginBottom: spacing.md },
  systemTile: { width: "100%", aspectRatio: 2.2, marginBottom: spacing.md },
});
