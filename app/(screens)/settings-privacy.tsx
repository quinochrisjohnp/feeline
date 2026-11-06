import LegalScreen from "@/components/common/LegalScreen";
import PolicySection from "@/components/common/PolicySection";

export default function PrivacyPolicy() {
  return (
    <LegalScreen title="Privacy Policy">
      <PolicySection title="Google Sign-In and Account Information">
        FeELINE uses Google Sign-In to verify your identity and connect you to your own cat
        profiles, albums, and detection history. Google provides an account identifier, email
        address, and, when available, your name and profile photo. These details help create
        and identify your FeELINE account. FeELINE does not receive your Google password or
        request access to your Gmail messages, contacts, or Google Drive files.
      </PolicySection>
      <PolicySection title="Camera and Photo Access">
        FeELINE uses the camera when you choose to capture a photo, subject to your device
        permissions. When you open the gallery, you choose which image to share through the
        device photo picker. The app does not automatically scan or upload your entire photo
        library. Capturing or selecting a photo in the detection flow sends that image to
        the application service for analysis. Photos you choose for a cat profile or cover
        are also uploaded when you save those changes.
      </PolicySection>
      <PolicySection title="Image Analysis and Storage">
        Submitted detection images are processed by the connected AI service to interpret
        observable emotional cues. Successful detections can be stored with an image URL,
        emotion, confidence, recommendations, timestamp, and cat association, including before
        you choose an Album. Images are hosted through Cloudinary, while account, cat profile,
        and detection information are stored by the application service. Choosing an Album
        organizes the existing result. Predictions are estimates, not veterinary diagnoses.
      </PolicySection>
      <PolicySection title="Cat Profiles, Feedback, and Reminders">
        Cat names, gender, birthdates, profile photos, and cover photos support the profile
        and Album features. Feedback you submit includes its title, subject, message, and
        account association so the team can review it. Avoid including passwords or sensitive
        personal information in feedback or photos. Wellness reminders and their presentation
        state are stored locally on your device. Phone notifications depend on your device
        permissions and notification settings.
      </PolicySection>
      <PolicySection title="Services That Process Your Information">
        Google handles sign-in, and the application’s hosting, AI, database, and image-hosting
        services process information needed to provide FeELINE’s features. A network connection
        is needed for these services. Your selected photos leave your device when submitted;
        image analysis is not performed entirely on your phone.
      </PolicySection>
      <PolicySection title="Your Choices and Data Removal">
        You can choose which images to submit, edit your cat profiles, manage saved Album
        photos, and change camera, photo, and notification permissions in your device settings.
        Logging out clears the local sign-in session; it does not delete
        your account or server-stored data. Use Give us Feedback to contact the team about
        privacy questions or request account/data removal; submitting a request does not
        automatically perform deletion.
      </PolicySection>
      <PolicySection title="Policy Updates">
        This notice describes the current app’s data handling. Review it when the app is
        updated, as features and connected services may change. For questions about your
        information, contact the FeELINE team through Give us Feedback.
      </PolicySection>
    </LegalScreen>
  );
}
