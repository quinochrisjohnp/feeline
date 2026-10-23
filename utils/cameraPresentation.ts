// Module memory lasts for this app launch, including Camera route remounts.
let tipsShown = false;

export function claimCameraSessionTips(): boolean {
  if (tipsShown) return false;
  tipsShown = true;
  return true;
}

export interface CameraDetectionNotice {
  title: string;
  message: string;
  photoTips: boolean;
}

/** Semantic outcomes use validated fields, never message parsing. */
export function detectionOutcomeNotice(result: { status: import("@/services/detection").PredictionStatus; cat_count?: unknown }): CameraDetectionNotice {
  const count = result.cat_count;
  const validCount = typeof count === "number" && Number.isSafeInteger(count) && count >= 2;
  const messages = {
    rejected_non_cat: ["No cat detected", "FeELINE can only analyze photos containing one real domestic cat. Please take or upload another photo."],
    rejected_multiple_cats: ["Multiple cats detected", validCount ? "FeELINE detected " + count + " cats in this image. Please use a photo containing only one cat." : "FeELINE detected multiple cats in this image. Please use a photo containing only one cat."],
    cannot_predict: ["Cat could not be analyzed", "FeELINE detected a cat, but the photo could not be analyzed clearly. Please use a clear, well-lit photo showing the cat’s face or body."],
    low_confidence: ["Emotion unclear", "FeELINE detected a cat but could not confidently determine its emotion. Please try another clear photo."],
  };
  if (result.status === "success") return detectionFailureNotice();
  const [title, message] = messages[result.status];
  return { title, message, photoTips: true };
}

export function detectionFailureNotice(error?: unknown): CameraDetectionNotice {
  if (error && typeof error === "object" && "status" in error && error.status === "rejected_multiple_cats") {
    return detectionOutcomeNotice({ status: "rejected_multiple_cats" });
  }
  return { title: "Detection unavailable", message: "We couldn't analyze this photo right now. Check your connection, then try again.", photoTips: false };
}
