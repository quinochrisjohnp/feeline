import type { CatDataState } from "../types/models";
import { UNKNOWN_ALBUM_ID } from "../types/models";
import {
  mockDetectionRecords,
  mockSavedImages,
} from "./mockDetectionRecords";

export const initialCatDataState: CatDataState = {
  cats: [],

  albums: [
    {
      id: UNKNOWN_ALBUM_ID,
      kind: "unknown",
      catId: null,
    },
  ],

  images: mockSavedImages,

  detectionRecords:
    mockDetectionRecords,
};