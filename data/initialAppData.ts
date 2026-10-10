import type {
  CatDataState,
} from "../types/models";

import {
  UNKNOWN_ALBUM_ID,
} from "../types/models";

export const initialCatDataState: CatDataState =
  {
    cats: [],

    albums: [
      {
        id: UNKNOWN_ALBUM_ID,
        kind: "unknown",
        catId: null,
      },
    ],

    images: [],

    detectionRecords: [],
  };