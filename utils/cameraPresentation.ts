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

/** Presentation only: never alters prediction, request, or persistence behavior. */
export function detectionFailureNotice(error: unknown): CameraDetectionNotice {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const photoTips = /no usable cat|cat face|clear image of a cat|cannot_predict|could not produce a reliable prediction/i.test(message);
  return photoTips ? {
    title: "We couldn't detect a clear cat",
    message: "Try a sharp, well-lit photo with the cat's full face visible and unobstructed.",
    photoTips,
  } : {
    title: "Detection unavailable",
    message: "We couldn't analyze this photo right now. Check your connection, then try again.",
    photoTips,
  };
}
