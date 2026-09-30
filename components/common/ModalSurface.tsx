import React from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, dimensions, radii, shadows, spacing } from "@/constants/theme";

/** Shared centered dialog; scrolls within the safe viewport on short screens. */
export default function ModalSurface({ visible, onClose, children }: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <SafeAreaView style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
            <View style={styles.card} accessibilityViewIsModal>{children}</View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay },
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: { width: "100%", maxWidth: dimensions.dialogMaxWidth, backgroundColor: colors.surface,
    borderRadius: radii.xl, padding: spacing.lg, ...shadows.floating },
});
