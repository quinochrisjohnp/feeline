import React from "react";
import LegalScreen from "@/components/common/LegalScreen";
import PolicySection from "@/components/common/PolicySection";

const TERMS = [
  {
    title: "1. Emotion Prediction Accuracy",
    body: "FeELINE's emotion detection results are generated using AI-based image analysis and are not guaranteed to be 100% accurate.",
  },
  {
    title: "2. Informational & Educational Purpose",
    body: "The app is intended for informational and educational purposes only.",
  },
  {
    title: "3. Not a Substitute for Veterinary Advice",
    body: "FeELINE does not replace professional veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian for concerns about your cat's health or behavior.",
  },
  {
    title: "4. Responsibility for Uploaded Images",
    body: "Users are responsible for the images they upload and must ensure they have the right to use them within the app.",
  },
  {
    title: "5. Developer Liability",
    body: "The developers are not liable for any decisions made based on the app's emotion detection results.",
  },
  {
    title: "6. Updates to Features and Functionality",
    body: "Features and functionality may be updated, changed, or removed as the app continues to be developed.",
  },
  {
    title: "7. Misuse and Inappropriate Content",
    body: "Users must not upload inappropriate, harmful, or unrelated content through the app.",
  },
  {
    title: "8. Acceptance of Terms",
    body: "Continued use of FeELINE constitutes acceptance of these Terms and Conditions.",
  },
];

export default function TermsAndConditions() {
  return (
    <LegalScreen title="Terms and Conditions">
      <PolicySection title="About this prototype">
        This frontend uses mock results, not AI analysis. Image upload is not available.
        The established terms below describe the intended app.
      </PolicySection>
      {TERMS.map((term) => (
        <PolicySection key={term.title} title={term.title}>{term.body}</PolicySection>
      ))}
    </LegalScreen>
  );
}
