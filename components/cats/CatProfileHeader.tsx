import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadows } from "@/constants/theme";

/** Cover photo + overlapping circular avatar used at the top of the Cat
 * Profile screen. */
export default function CatProfileHeader() {
  return (
    <View style={styles.wrapper}>
      <View style={styles.cover}>
        <Ionicons name="image-outline" size={40} color={colors.textMuted} />
      </View>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Ionicons name="paw" size={34} color={colors.textMuted} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  cover: { width: "100%", height: 220, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  avatarWrap: { position: "absolute", bottom: -44, left: 0, right: 0, alignItems: "center" },
  avatar: {
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