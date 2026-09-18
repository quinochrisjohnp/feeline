import LegalScreen from "@/components/common/LegalScreen";
import PolicySection from "@/components/common/PolicySection";

export default function PrivacyPolicy() {
  return (
    <LegalScreen title="Privacy Policy">
      <PolicySection title="Google Login">
        This prototype uses mock sign-in and a demo profile. It does not connect to Google
        or access your Google account information.
      </PolicySection>
      <PolicySection title="Image Data">
        Images and detection results are mock references held in memory. This prototype
        does not capture, upload, or analyze your photos.
      </PolicySection>
      <PolicySection title="Cat Profile Data">
        Cat names, birthdates, gender, and mock emotion history are held in memory for
        the current app session. Reloading restores the initial mock data.
      </PolicySection>
      <PolicySection title="Data Usage">
        Information entered here is used for the local prototype experience.
        This prototype does not send profile or image data to a service.
      </PolicySection>
      <PolicySection title="Data Deletion">
        You can remove cats and saved mock images through the album controls.
        Reloading resets these changes. Logging out clears the saved mock session.
      </PolicySection>
      <PolicySection title="Security">
        The existing mock session token is kept using SecureStore on supported devices.
        This prototype does not implement a production authentication system.
      </PolicySection>
      <PolicySection title="Consent">
        By continuing to use FeELINE, you acknowledge the mock data and session behavior
        described in this Privacy Policy.
      </PolicySection>
    </LegalScreen>
  );
}
