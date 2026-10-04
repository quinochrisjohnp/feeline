export type EmotionKey = "happy" | "neutral" | "fear" | "angry";

export interface EmotionMeta {
  key: EmotionKey;
  label: string;
}

// The four FeELINE emotion categories. Do not add more without updating
// the design (constants/theme.ts colors.emotion) to match.
export const EMOTIONS: Record<EmotionKey, EmotionMeta> = {
  happy: { key: "happy", label: "Happy" },
  neutral: { key: "neutral", label: "Neutral" },
  fear: { key: "fear", label: "Fearful" },
  angry: { key: "angry", label: "Angry" },
};

export type CatGender = "Male" | "Female";

export interface Cat {
  id: string;
  name: string;
  gender: CatGender;
  /** YYYY-MM-DD */
  birthdate: string;
  /** Mock/local reference; null renders the placeholder. */
  photoUri: string | null;
  /** Mock/local reference; null renders the placeholder. */
  coverUri: string | null;
}

export type AlbumKind = "cat" | "unknown";

export const UNKNOWN_ALBUM_ID = "unknown-cats";

export interface Album {
  id: string;
  kind: AlbumKind;
  /** Null only for the Unknown Cats system album. */
  catId: string | null;
}

export interface SavedImage {
  id: string;
  albumId: string;
  /** Key or URI for a bundled/mock image. */
  imageUri: string;
  /** ISO datetime when the mock capture occurred. */
  capturedAt: string;
}

export interface DetectionRecord {
  id: string;
  imageId: string;
  emotion: EmotionKey;
  /** Integer from 0 through 100. */
  confidence: number;
  /** ISO datetime string. */
  recordedAt: string;
}

export interface CatDataState {
  cats: Cat[];
  albums: Album[];
  images: SavedImage[];
  detectionRecords: DetectionRecord[];
}

export type CatChanges = Partial<Pick<Cat, "name" | "gender" | "birthdate" | "photoUri" | "coverUri">>;

export interface SaveCaptureInput {
  albumId: string;
  imageUri: string;
  capturedAt: string;
  emotion: EmotionKey;
  confidence: number;
}
