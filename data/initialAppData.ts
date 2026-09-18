import type { CatDataState } from "../types/models";
import { UNKNOWN_ALBUM_ID } from "../types/models";
import { mockCats } from "./mockCats";
import { mockDetectionRecords, mockSavedImages } from "./mockDetectionRecords";

/** In-memory fixtures only. Reloading the app recreates this state. */
export const initialCatDataState: CatDataState = {
  cats: mockCats.map((cat) => ({ ...cat })),
  albums: [
    ...mockCats.map((cat) => ({ id: `album-${cat.id}`, kind: "cat" as const, catId: cat.id })),
    { id: UNKNOWN_ALBUM_ID, kind: "unknown", catId: null },
  ],
  images: mockSavedImages,
  detectionRecords: mockDetectionRecords,
};
