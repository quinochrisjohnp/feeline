import type { DetectionRecord } from "@/types/models";

// TODO(backend): replace with a real fetch (e.g. GET /cats/:id/detections)
// once the API is connected. Dates are generated relative to "today" so the
// Calendar/Album/My Cats screens always have something to show.
const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth();

function at(day: number, hour: number, minute: number): string {
  const safeDay = Math.min(28, Math.max(1, day));
  return new Date(Y, M, safeDay, hour, minute).toISOString();
}

const today = now.getDate();

export const mockDetectionRecords: DetectionRecord[] = [
  { id: "det-1", catId: "cat-sean", emotion: "happy", confidence: 92, recordedAt: at(today, 11, 0), imageUri: null },
  { id: "det-2", catId: "cat-julia", emotion: "fear", confidence: 78, recordedAt: at(today, 15, 0), imageUri: null },
  { id: "det-3", catId: "cat-sean", emotion: "angry", confidence: 85, recordedAt: at(today - 2, 9, 30), imageUri: null },
  { id: "det-4", catId: "cat-julia", emotion: "angry", confidence: 90, recordedAt: at(today - 5, 13, 0), imageUri: null },
  { id: "det-5", catId: "cat-kiana", emotion: "neutral", confidence: 81, recordedAt: at(today - 1, 8, 0), imageUri: null },
  { id: "det-6", catId: "cat-chris", emotion: "happy", confidence: 88, recordedAt: at(today - 7, 17, 45), imageUri: null },
  { id: "det-7", catId: "cat-sean", emotion: "neutral", confidence: 70, recordedAt: at(today - 3, 10, 15), imageUri: null },
  { id: "det-8", catId: "cat-kiana", emotion: "fear", confidence: 65, recordedAt: at(today - 4, 19, 0), imageUri: null },
  { id: "det-9", catId: "cat-julia", emotion: "happy", confidence: 94, recordedAt: at(today - 10, 12, 30), imageUri: null },
  { id: "det-10", catId: "cat-chris", emotion: "angry", confidence: 76, recordedAt: at(today - 12, 20, 10), imageUri: null },
  { id: "det-11", catId: "cat-sean", emotion: "fear", confidence: 60, recordedAt: at(today - 14, 7, 50), imageUri: null },
  { id: "det-12", catId: "cat-kiana", emotion: "happy", confidence: 89, recordedAt: at(today - 6, 16, 20), imageUri: null },
];