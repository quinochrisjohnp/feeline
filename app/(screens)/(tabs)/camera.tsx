import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FullBleedScreen from "@/components/common/FullBleedScreen";
import MockCapturePhoto from "@/components/camera/MockCapturePhoto";
import CaptureButton from "@/components/camera/CaptureButton";
import WhatToAvoidModal from "@/components/camera/WhatToAvoidModal";
import MockSampleModal from "@/components/camera/MockSampleModal";
import { createMockCapture, mockImageUri, MOCK_SAMPLES, type MockSampleId } from "@/services/mockDetection";
import { colors, dimensions, getTabBarClearance, radii, spacing, typography } from "@/constants/theme";

export default function Camera() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [avoidVisible, setAvoidVisible] = useState(false);
  const [samplesVisible, setSamplesVisible] = useState(false);
  const [sampleId, setSampleId] = useState<MockSampleId>("angry");
  const [reviewing, setReviewing] = useState(false);
  const captureLocked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    captureLocked.current = false;
    setReviewing(false);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      captureLocked.current = false;
    };
  }, []));

  const handleCapture = () => {
    if (captureLocked.current) return;
    captureLocked.current = true;
    const capture = createMockCapture(sampleId, new Date().toISOString());
    setReviewing(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      router.push({ pathname: "/camera-result", params: { ...capture } });
    }, 450);
  };

  return (
    <FullBleedScreen>
      <ScrollView contentContainerStyle={[styles.content, {
        paddingTop: insets.top + spacing.sm, paddingBottom: getTabBarClearance(insets.bottom),
      }]}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Mock camera</Text>
          <TouchableOpacity style={styles.roundButton} onPress={() => setAvoidVisible(true)}
            disabled={reviewing} accessibilityRole="button" accessibilityLabel="What to Avoid">
            <Ionicons name="help-circle-outline" size={dimensions.icon} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <MockCapturePhoto imageUri={mockImageUri(sampleId)}
          label={MOCK_SAMPLES.find((sample) => sample.id === sampleId)!.label} />
        <View style={styles.review} accessibilityLiveRegion="polite">
          {reviewing ? <ActivityIndicator color={colors.primary} /> : null}
          <Text style={styles.caption}>{reviewing ? "Reviewing observable cues…" : "Placeholder preview · No device camera access"}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.roundButton} disabled={reviewing}
            onPress={() => setSamplesVisible(true)} accessibilityRole="button" accessibilityLabel="Choose mock photo or open album">
            <Ionicons name="images-outline" size={dimensions.icon} color={colors.textPrimary} />
          </TouchableOpacity>
          <CaptureButton onPress={handleCapture} disabled={reviewing} />
          <View style={styles.spacer} />
        </View>
      </ScrollView>
      <WhatToAvoidModal visible={avoidVisible} onClose={() => setAvoidVisible(false)} />
      <MockSampleModal visible={samplesVisible} selected={sampleId} onSelect={setSampleId}
        onClose={() => setSamplesVisible(false)}
        onOpenAlbum={() => { setSamplesVisible(false); router.navigate("/album"); }} />
    </FullBleedScreen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: spacing.md, gap: spacing.md },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  title: { ...typography.label, color: colors.textInverse, flex: 1 },
  roundButton: { width: dimensions.button, minHeight: dimensions.button, borderRadius: radii.pill,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  caption: { ...typography.caption, color: colors.textInverse, textAlign: "center", flexShrink: 1 },
  review: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.sm },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingBottom: spacing.sm },
  spacer: { width: dimensions.button },
});
