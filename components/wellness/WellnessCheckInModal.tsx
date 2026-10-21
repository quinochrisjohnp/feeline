import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import WellnessCatHeader from "./WellnessCatHeader";
import type { Cat } from "@/types/models";
import type { WellnessAlert } from "@/types/wellness";
import { wellnessGuidance, wellnessDisclaimer, wellnessDoNotWait, wellnessThresholdNote } from "@/constants/wellnessGuidance";
import { colors, dimensions, fontFamily, spacing, typography } from "@/constants/theme";

export default function WellnessCheckInModal({ cat, alert, onClose, onAcknowledge, onRemind, busy, error }: {
  cat: Cat; alert: WellnessAlert; onClose(): void; onAcknowledge(): void; onRemind(): void; busy: boolean; error: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const content = wellnessGuidance(cat.name, alert.rule);
  return <ModalSurface visible onClose={() => { if (!busy) onClose(); }}>
    <WellnessCatHeader cat={cat} />
    <Text style={styles.heading} accessibilityRole="header">A little check-in for {cat.name}</Text>
    <Text style={styles.body}>{content.summary}</Text>
    <Text style={styles.caption}>{new Date(alert.from).toLocaleString()} – {new Date(alert.through).toLocaleString()}</Text>
    {content.primary.map(question => <Text key={question} style={styles.question}>{question}</Text>)}
    <TouchableOpacity onPress={() => setExpanded(v => !v)} style={styles.expand}
      accessibilityRole="button" accessibilityState={{ expanded }}>
      <Text style={styles.link}>{expanded ? "Show fewer questions" : "What else can I check?"}</Text>
    </TouchableOpacity>
    {expanded ? content.more.map(question => <Text key={question} style={styles.question}>{question}</Text>) : null}
    <Text style={styles.body}>{content.safety}</Text>
    <Text style={styles.body}>{content.veterinary}</Text>
    <Text style={styles.body}>{wellnessDoNotWait}</Text>
    <Text style={styles.caption}>{wellnessThresholdNote}</Text>
    <Text style={styles.caption}>{wellnessDisclaimer}</Text>
    {error ? <Text style={styles.body} accessibilityRole="alert">{error}</Text> : null}
    <View style={styles.actions}>
      <Button label="Okay, I’ll check" onPress={onAcknowledge} loading={busy} fullWidth />
      <Button label="Remind me later" variant="outline" onPress={onRemind} disabled={busy} fullWidth />
    </View>
  </ModalSurface>;
}
const styles = StyleSheet.create({
  heading: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  body: { ...typography.body, fontFamily: fontFamily.body, color: colors.textSecondary, marginBottom: spacing.sm },
  question: { ...typography.body, fontFamily: fontFamily.body, color: colors.textPrimary, marginVertical: spacing.xs },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, marginBottom: spacing.sm },
  expand: { minHeight: dimensions.touchTarget, justifyContent: "center" },
  link: { ...typography.label, fontFamily: fontFamily.medium, color: colors.textPrimary, textDecorationLine: "underline" },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
