export type EmotionKey = "happy" | "neutral" | "fear" | "angry";

export interface EmotionMeta {
  key: EmotionKey;
  label: string;
  emoji: string;
}

// The four FeELINE emotion categories. Do not add more without updating
// the design (constants/theme.ts colors.emotion) to match.
export const EMOTIONS: Record<EmotionKey, EmotionMeta> = {
  happy: { key: "happy", label: "Happy", emoji: "😻" },
  neutral: { key: "neutral", label: "Neutral", emoji: "😑" },
  fear: { key: "fear", label: "Fearful", emoji: "😰" },
  angry: { key: "angry", label: "Angry", emoji: "😾" },
};

export type CatGender = "Male" | "Female";

export interface Cat {
  id: string;
  name: string;
  gender: CatGender;
  /** ISO date string, e.g. "2021-04-12". */
  birthdate: string;
  /** Profile photo. `null`/`undefined` renders a placeholder. */
  photoUri?: string | null;
  /** Cover/banner photo shown on the cat profile screen. */
  coverUri?: string | null;
}

export interface DetectionRecord {
  id: string;
  catId: string;
  emotion: EmotionKey;
  /** 0-100 */
  confidence: number;
  /** ISO datetime string. */
  recordedAt: string;
  imageUri?: string | null;
}