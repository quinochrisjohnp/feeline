import React, { type ComponentProps } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Button from "./Button";
import { spacing } from "@/constants/theme";
type Action = ComponentProps<typeof Button>;
/** Shared compact, equal-width dialog footer; labels can wrap without shrinking touch targets. */
export default function DialogActions({ first, second }: { first: Action; second: Action }) {
  const { width, fontScale } = useWindowDimensions();
  return <View style={[styles.row, (width < 300 || fontScale > 1.8) && { flexDirection: "column" }]}>
    {[first, second].map((action, index) => <Button key={index} {...action} size="compact"
      style={[styles.button, action.style]} labelStyle={{ fontSize: width < 360 ? 12 : 14, lineHeight: width < 360 ? 17 : 20 }} />)}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch", gap: spacing.xs, marginTop: spacing.sm },
  button: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: spacing.xs },
});
