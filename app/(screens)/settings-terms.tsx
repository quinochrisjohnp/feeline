import React from "react";
import LegalScreen from "@/components/common/LegalScreen";
import PolicySection from "@/components/common/PolicySection";

const TERMS = [
  {
    "title": "1. Purpose and Scope",
    "body": "FeELINE is a thesis-based application focused on interpreting observable emotional cues in Puspin cats. Its features support informational, educational, and research purposes. Use the app responsibly and read these Terms together with the Privacy Policy."
  },
  {
    "title": "2. AI Results and Confidence",
    "body": "Happy, Neutral, Fearful, and Angry are model predictions based on submitted images, not confirmed emotional states. Results may be incorrect even at high confidence. A confidence score is not a clinical assessment or a guarantee of accuracy. Accepted results below 50% display a caution; consider the recommendations with care and the wider context of the cat’s behavior."
  },
  {
    "title": "3. Recommendations and Check-In Reminders",
    "body": "Recommended actions provide general guidance, not individualized veterinary advice. Repeated Angry or Fearful predictions may prompt a check-in reminder but do not establish illness or an ongoing emotional condition. Reminders depend on local device state and notification permissions; they are not emergency alerts, continuous monitoring, or a substitute for observing your cat."
  },
  {
    "title": "4. Appropriate Images and Animal Welfare",
    "body": "Submit a clear photo of one real domestic cat. Images with no identifiable cat, multiple cats, or insufficient visual information may not produce a usable result. Only submit images you own or have permission to use. Avoid personal or sensitive information in the background. Do not frighten, restrain, or otherwise distress an animal to obtain a photo or a particular prediction."
  },
  {
    "title": "5. Account and Profile Use",
    "body": "Use your own authorized Google account and protect access to your device and session. The app allows up to 20 personal cat profiles; Unknown Cats is a separate system album and does not count toward this limit. Keep profile information accurate enough for the features you use."
  },
  {
    "title": "6. Uploads, Albums, and Stored Data",
    "body": "Submitting a photo for detection sends it to connected services. Successful results may be stored before you choose an Album. Saving to an Album organizes that result. Removing an Album photo does not necessarily permanently erase its stored image or detection record, and logging out does not delete server-stored account data. Consult the Privacy Policy for data handling and contact options."
  },
  {
    "title": "7. Responsible Use",
    "body": "Do not attempt unauthorized access to other accounts or data, bypass service protections, disrupt the service, or submit unlawful content. Do not present FeELINE predictions as confirmed veterinary diagnoses. Use feedback to report issues without including passwords or other sensitive information."
  },
  {
    "title": "8. Veterinary Care and User Decisions",
    "body": "FeELINE does not replace a licensed veterinarian’s advice, diagnosis, or treatment. Do not use a result to rule out a health problem or delay seeking appropriate care. You remain responsible for how you use predictions and recommendations. Nothing in these Terms excludes rights or responsibilities that cannot lawfully be excluded."
  },
  {
    "title": "9. Service Availability and Changes",
    "body": "Analysis, sign-in, and account features depend on network access and connected services. Availability and response times are not guaranteed. Features, models, and recommendations may change as the academic project develops. Review updated notices when using a new version."
  },
  {
    "title": "10. Privacy and Research Context",
    "body": "The academic nature of FeELINE does not itself mean that every uploaded image is part of a research dataset or that you have agreed to separate research participation. Review any separate research information and consent materials provided to you. These Terms do not waive your applicable privacy rights."
  },
  {
    "title": "11. Questions and Acceptance",
    "body": "By using FeELINE, you agree to use it under these Terms. If you do not agree, do not continue using the app. Contact the team through Give us Feedback for questions, issues, or data-removal requests. A request is not an automatic deletion command."
  }
];

export default function TermsAndConditions() {
  return (
    <LegalScreen title="Terms and Conditions">
      <PolicySection title="About FeELINE">
        FeELINE interprets observable emotional cues from submitted cat photos.
        Predictions are informational and may be inaccurate.
      </PolicySection>
      {TERMS.map((term) => (
        <PolicySection key={term.title} title={term.title}>{term.body}</PolicySection>
      ))}
    </LegalScreen>
  );
}
