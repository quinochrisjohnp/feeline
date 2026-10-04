import type { EmotionKey } from "@/types/models";

/** Display boundary only; stored detections retain the canonical `fear` key. */
export function normalizeEmotionKey(value: unknown): EmotionKey | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  switch (key) {
    case "happy":
    case "angry":
    case "neutral":
    case "fear":
      return key;
    case "fearful":
      return "fear";
    default:
      return null;
  }
}
