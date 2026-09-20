import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import { MOCK_SAMPLES, type MockSampleId } from "@/services/mockDetection";
import { colors, dimensions, spacing, typography } from "@/constants/theme";

export default function MockSampleModal({ visible, selected, onSelect, onClose }: {
  visible: boolean; selected: MockSampleId; onSelect: (id: MockSampleId) => void;
  onClose: () => void;
}) {
  return (
    <ModalSurface visible={visible} onClose={onClose}>
      <Text style={styles.title} accessibilityRole="header">Mock result</Text>
      <Text style={styles.caption}>Choose the simulated result for the next camera or gallery image. The image comes from your device. No real AI analysis is performed.</Text>
      <View accessibilityRole="radiogroup">
        {MOCK_SAMPLES.map((sample) => (
          <TouchableOpacity key={sample.id} style={styles.row} onPress={() => onSelect(sample.id)}
            accessibilityRole="radio" accessibilityLabel={sample.label} accessibilityState={{ checked: selected === sample.id }}>
            <Text style={styles.label}>{sample.label}</Text>
            <Ionicons name={selected === sample.id ? "radio-button-on" : "radio-button-off"}
              size={dimensions.icon} color={colors.textPrimary} />
          </TouchableOpacity>
        ))}
      </View>
      <Button label="Continue" onPress={onClose} style={styles.button} />
    </ModalSurface>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.subheading, color: colors.textPrimary },
  caption: { ...typography.caption, color: colors.textSecondary, marginVertical: spacing.sm },
  row: { minHeight: dimensions.button, flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { ...typography.body, color: colors.textPrimary, flex: 1 },
  button: { marginTop: spacing.sm },
});
