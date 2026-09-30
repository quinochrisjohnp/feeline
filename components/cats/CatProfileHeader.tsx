import React from "react";
import { StyleSheet, View } from "react-native";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, radii, shadows } from "@/constants/theme";

/** Cover photo + overlapping circular avatar used at the top of the Cat
 * Profile screen. */
export default function CatProfileHeader({ photoUri, coverUri, name }: { photoUri?: string | null; coverUri?: string | null; name?: string }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.cover}>
        <MockPhoto imageUri={coverUri} size={40} label={`${name ?? "Cat"} cover photo`} />
      </View>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <MockPhoto imageUri={photoUri} icon="paw" size={34} label={`${name ?? "Cat"} profile photo`} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  cover: { overflow: "hidden", width: "100%", height: 220, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  avatarWrap: { position: "absolute", bottom: -44, left: 0, right: 0, alignItems: "center" },
  avatar: {
    overflow: "hidden",
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
});