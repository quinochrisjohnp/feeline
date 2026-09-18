import type { DetectionRecord, SavedImage } from "../types/models";

// Mock capture fixtures retain the existing dates and emotion distribution.
const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth();

function at(day: number, hour: number, minute: number): string {
  const safeDay = Math.min(28, Math.max(1, day));
  return new Date(Y, M, safeDay, hour, minute).toISOString();
}

const today = now.getDate();

const captures: (Omit<DetectionRecord, "imageId"> & { albumId: string })[] = [
  { id: "det-1", albumId: "album-cat-sean", emotion: "happy", confidence: 92, recordedAt: at(today, 11, 0) },
  { id: "det-2", albumId: "album-cat-julia", emotion: "fear", confidence: 78, recordedAt: at(today, 15, 0) },
  { id: "det-3", albumId: "album-cat-sean", emotion: "angry", confidence: 85, recordedAt: at(today - 2, 9, 30) },
  { id: "det-4", albumId: "album-cat-julia", emotion: "angry", confidence: 90, recordedAt: at(today - 5, 13, 0) },
  { id: "det-5", albumId: "album-cat-kiana", emotion: "neutral", confidence: 81, recordedAt: at(today - 1, 8, 0) },
  { id: "det-6", albumId: "album-cat-chris", emotion: "happy", confidence: 88, recordedAt: at(today - 7, 17, 45) },
  { id: "det-7", albumId: "album-cat-sean", emotion: "neutral", confidence: 70, recordedAt: at(today - 3, 10, 15) },
  { id: "det-8", albumId: "album-cat-kiana", emotion: "fear", confidence: 65, recordedAt: at(today - 4, 19, 0) },
  { id: "det-9", albumId: "album-cat-julia", emotion: "happy", confidence: 94, recordedAt: at(today - 10, 12, 30) },
  { id: "det-10", albumId: "album-cat-chris", emotion: "angry", confidence: 76, recordedAt: at(today - 12, 20, 10) },
  { id: "det-11", albumId: "album-cat-sean", emotion: "fear", confidence: 60, recordedAt: at(today - 14, 7, 50) },
  { id: "det-12", albumId: "album-cat-kiana", emotion: "happy", confidence: 89, recordedAt: at(today - 6, 16, 20) },
];
export const mockSavedImages: SavedImage[] = captures.map((capture) => ({
  id: `image-${capture.id}`,
  albumId: capture.albumId,
  imageUri: `mock:photo-${capture.id}`,
  capturedAt: capture.recordedAt,
}));

export const mockDetectionRecords: DetectionRecord[] = captures.map((record) => ({
  id: record.id, imageId: `image-${record.id}`,
  emotion: record.emotion, confidence: record.confidence, recordedAt: record.recordedAt,
}));
