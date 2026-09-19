import { StyleSheet, Text, View } from "react-native";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, dimensions, radii, spacing, typography } from "@/constants/theme";

/** Same mock reference is used here and by album photos; no media is loaded. */
export default function MockCapturePhoto({ imageUri, label = "Captured mock photo" }: {
  imageUri: string;
  label?: string;
}) {
  return (
    <View style={styles.photo}>
      <MockPhoto imageUri={imageUri} size={dimensions.emptyStateIcon} color={colors.textInverse} label={label} />
      <Text style={styles.caption}>{label} · Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { flex: 1, minHeight: 180, borderRadius: radii.lg, backgroundColor: colors.black,
    alignItems: "center", justifyContent: "center", padding: spacing.md },
  caption: { ...typography.caption, color: colors.textInverse, textAlign: "center", marginTop: spacing.sm },
});
