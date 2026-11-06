import ModalHeader from "@/components/common/ModalHeader";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ModalSurface from "@/components/common/ModalSurface";
import DialogActions from "@/components/common/DialogActions";
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
    <ModalHeader closeIconSize={24} title="A little check-in" onClose={onClose} disabled={busy} />
    <WellnessCatHeader cat={cat} />
    <Text style={styles.body}>{content.summary}</Text>
    <Text style={styles.caption}>{new Date(alert.from).toLocaleString()} – {new Date(alert.through).toLocaleString()}</Text>
    <Text style={styles.sectionHeading}>{alert.rule === "similar_time_pattern" ? "What might be happening nearby?" : "How is your cat feeling?"}</Text>
    {content.primary.map(question => <Text key={question} style={styles.question}>• {question}</Text>)}
    <TouchableOpacity onPress={() => setExpanded(v => !v)} style={styles.expand}
      accessibilityRole="button" accessibilityState={{ expanded }}>
      <Text style={styles.link}>{expanded ? "Show fewer questions" : "What else can I check?"}</Text>
    </TouchableOpacity>
    {expanded ? content.sections.map(section => {
      const questions = section.questions.filter(question => content.more.includes(question));
      return questions.length ? <View key={section.heading}>
        <Text style={styles.sectionHeading}>{section.heading}</Text>
        {questions.map(question => <Text key={question} style={styles.question}>• {question}</Text>)}
      </View> : null;
    }) : null}
    <Text style={styles.sectionHeading}>Giving your cat space</Text>
    <Text style={styles.body}>{content.safety}</Text>
    <Text style={styles.sectionHeading}>When should I contact a veterinarian?</Text>
    <Text style={styles.body}>{content.veterinary}</Text>
    <Text style={styles.body}>{wellnessDoNotWait}</Text>
    <Text style={styles.sectionHeading}>Important reminder</Text>
    <Text style={styles.caption}>{wellnessThresholdNote}</Text>
    <Text style={styles.caption}>{wellnessDisclaimer}</Text>
    {error ? <Text style={styles.body} accessibilityRole="alert">{error}</Text> : null}
    <DialogActions first={{ label: "Okay, I’ll check", onPress: onAcknowledge, loading: busy }} second={{ label: "Remind me later", variant: "outline", onPress: onRemind, disabled: busy }} />
  </ModalSurface>;
}
const styles = StyleSheet.create({
  sectionHeading: { ...typography.label, fontFamily: fontFamily.semibold, color: colors.textPrimary, textDecorationLine: "underline", marginTop: spacing.md, marginBottom: spacing.xs },
  heading: { ...typography.subheading, fontFamily: fontFamily.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  body: { ...typography.body, fontSize: 15, lineHeight: 22, fontFamily: fontFamily.body, color: colors.textSecondary, marginBottom: spacing.sm },
  question: { ...typography.body, fontFamily: fontFamily.body, color: colors.textPrimary, marginVertical: spacing.xs },
  caption: { ...typography.caption, fontFamily: fontFamily.body, color: colors.textSecondary, marginBottom: spacing.sm },
  expand: { minHeight: dimensions.touchTarget, justifyContent: "center" },
  link: { ...typography.label, fontFamily: fontFamily.medium, color: colors.textPrimary, textDecorationLine: "underline" },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.sm },
});
