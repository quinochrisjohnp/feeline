import LegalScreen from "@/components/common/LegalScreen";
import PolicySection from "@/components/common/PolicySection";

export default function PrivacyPolicy() {
  return (
    <LegalScreen title="Privacy Policy">
      <PolicySection title="Google Login">
        FeELINE uses account authentication to access your cat profiles and detection history.
        Sign-in information is exchanged with the authentication service.
      </PolicySection>
      <PolicySection title="Image Data">
        Photos submitted for detection are sent to the configured service for analysis.
        Successful results and saved images are available through your account.
      </PolicySection>
      <PolicySection title="Cat Profile Data">
        Cat profile information and detection history are stored through the application service.
        Reloading the app does not reset your saved account data.
      </PolicySection>
      <PolicySection title="Data Usage">
        Profile and image data support cat profiles, image analysis, albums, and detection history.
        Wellness reminders and their presentation state are stored locally on this device.
      </PolicySection>
      <PolicySection title="Data Deletion">
        You can manage cats and remove saved photos through the app. Removing a photo from
        an Album does not delete its detection history. Logging out ends the local session.
      </PolicySection>
      <PolicySection title="Security">
        Session credentials use SecureStore on supported native devices.
        Keep your device and sign-in details secure.
      </PolicySection>
      <PolicySection title="Consent">
        By continuing to use FeELINE, you acknowledge the data and session behavior
        described in this Privacy Policy.
      </PolicySection>
    </LegalScreen>
  );
}
