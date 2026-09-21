import { StyleSheet, Text, View } from "react-native";
import MockPhoto from "@/components/common/MockPhoto";
import { colors, dimensions, radii, spacing, typography } from "@/constants/theme";

/** The same device or bundled photo follows the capture through save and album views. */
export default function MockCapturePhoto({ imageUri, label = "Captured or selected cat image" }: {
  imageUri: string;
  label?: string;
}) {
  return (
    <View style={styles.photo}>
      <MockPhoto imageUri={imageUri} size={dimensions.emptyStateIcon} color={colors.textInverse} label={label} />
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { overflow: "hidden", flex: 1, minHeight: 180, borderRadius: radii.lg, backgroundColor: colors.black,
    alignItems: "center", justifyContent: "center", padding: spacing.md },
  caption: { ...typography.caption, color: colors.textInverse, textAlign: "center", marginTop: "auto", backgroundColor: colors.photoScrim, padding: spacing.xs, borderRadius: radii.sm },
});
