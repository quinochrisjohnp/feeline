import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import ScreenContainer from "@/components/common/ScreenContainer";
import CatCoverCard from "@/components/cats/CatCoverCard";
import { useCatData } from "@/context/CatDataContext";
import { useWellnessNavigationSafety } from "@/context/WellnessContext";
import { selectAlbumName, selectAlbumCoverImage } from "@/context/catDataSelectors";
import { colors, fontFamily, spacing, typography } from "@/constants/theme";

export default function Album() {
  const router = useRouter();
  const { state, refreshDetections } = useCatData();
  const [width, setWidth] = useState(0);
  useWellnessNavigationSafety(false);
  useFocusEffect(useCallback(() => { void refreshDetections(); }, [refreshDetections]));
  const normal = state.albums.filter(a => a.kind === "cat");
  const unknown = state.albums.find(a => a.kind === "unknown");
  const open = (albumId: string) => router.push({ pathname: "/album-folder", params: { albumId } });
  return <ScreenContainer module="album" tabBar>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.title} accessibilityRole="header">Cat Album</Text>
      <View style={styles.grid} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {normal.map(album => <CatCoverCard key={album.id} variant="tile"
          name={selectAlbumName(state, album.id)} coverUri={selectAlbumCoverImage(state, album.id)?.imageUri ?? null}
          onPress={() => open(album.id)} style={{ width: width ? (width - spacing.md) / 2 : "47%" }} />)}
      </View>
      {unknown ? <View style={styles.systemSection}>
        <CatCoverCard name={selectAlbumName(state, unknown.id)} variant="bar"
          coverUri={selectAlbumCoverImage(state, unknown.id)?.imageUri ?? null}
          onPress={() => open(unknown.id)} style={styles.systemCard} />
      </View> : null}
    </ScrollView>
  </ScreenContainer>;
}
const styles = StyleSheet.create({
  title: { ...typography.heading, fontFamily: fontFamily.heading, fontSize: 24, color: colors.textPrimary, marginVertical: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "flex-start" },
  systemSection: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.lg, paddingTop: spacing.md },
  systemTitle: { ...typography.label, fontFamily: fontFamily.heading, color: colors.textSecondary, marginBottom: spacing.sm },
  systemCard: { minHeight: 120, height: 140 },
});
