import { initialCatDataState } from "../data/initialAppData";
import { EMOTIONS, UNKNOWN_ALBUM_ID } from "../types/models";
import type { Cat, CatChanges, CatDataState, DetectionRecord, SavedImage } from "../types/models";
import { isValidBirthdate } from "../utils/date";

export type CatDataAction =
  | { type: "ADD_CAT"; cat: Cat }
  | { type: "UPDATE_CAT"; catId: string; changes: CatChanges }
  | { type: "RENAME_ALBUM"; albumId: string; name: string }
  | { type: "DELETE_CAT"; catId: string }
  | { type: "SAVE_CAPTURE"; image: SavedImage; detection: DetectionRecord }
  | { type: "DELETE_IMAGE"; imageId: string }
  | { type: "DELETE_IMAGES"; imageIds: string[] }
  | { type: "RESET_MOCK_DATA" };

function removeImages(state: CatDataState, ids: Set<string>): CatDataState {
  if (!state.images.some((image) => ids.has(image.id))) return state;
  return {
    ...state,
    images: state.images.filter((image) => !ids.has(image.id)),
    detectionRecords: state.detectionRecords.filter((record) => !ids.has(record.imageId)),
  };
}

export function catDataReducer(state: CatDataState, action: CatDataAction): CatDataState {
  switch (action.type) {
    case "ADD_CAT": {
      const { cat } = action;
      const albumId = `album-${cat.id}`;
      if (!cat.id || cat.id === UNKNOWN_ALBUM_ID || !cat.name.trim() ||
          !isValidBirthdate(cat.birthdate) ||
          state.cats.some((existing) => existing.id === cat.id) ||
          state.albums.some((album) => album.id === albumId || album.catId === cat.id)) return state;
      return {
        ...state,
        cats: [{ ...cat, name: cat.name.trim() }, ...state.cats],
        albums: [{ id: albumId, kind: "cat", catId: cat.id }, ...state.albums],
      };
    }
    case "UPDATE_CAT": {
      const { catId, changes } = action;
      if (catId === UNKNOWN_ALBUM_ID || !state.cats.some((cat) => cat.id === catId) ||
          (changes.name !== undefined && !changes.name.trim()) ||
          (changes.birthdate !== undefined && !isValidBirthdate(changes.birthdate))) return state;
      // Explicit allowlist: even an untyped caller cannot change identity.
      const updates: CatChanges = {};
      if (changes.name !== undefined) updates.name = changes.name.trim();
      if (changes.gender !== undefined) updates.gender = changes.gender;
      if (changes.birthdate !== undefined) updates.birthdate = changes.birthdate;
      if (changes.photoUri !== undefined) updates.photoUri = changes.photoUri;
      if (changes.coverUri !== undefined) updates.coverUri = changes.coverUri;
      return { ...state, cats: state.cats.map((cat) => cat.id === catId ? { ...cat, ...updates } : cat) };
    }
    case "RENAME_ALBUM": {
      const album = state.albums.find((item) => item.id === action.albumId);
      if (!album || album.id === UNKNOWN_ALBUM_ID || album.kind !== "cat" || !album.catId) return state;
      return catDataReducer(state, { type: "UPDATE_CAT", catId: album.catId, changes: { name: action.name } });
    }
    case "DELETE_CAT": {
      if (action.catId === UNKNOWN_ALBUM_ID || !state.cats.some((cat) => cat.id === action.catId)) return state;
      const albumIds = new Set(state.albums.filter((album) =>
        album.kind === "cat" && album.id !== UNKNOWN_ALBUM_ID && album.catId === action.catId
      ).map((album) => album.id));
      const imageIds = new Set(state.images.filter((image) => albumIds.has(image.albumId)).map((image) => image.id));
      return {
        ...removeImages(state, imageIds),
        cats: state.cats.filter((cat) => cat.id !== action.catId),
        albums: state.albums.filter((album) => !albumIds.has(album.id)),
      };
    }
    case "SAVE_CAPTURE": {
      const { image, detection } = action;
      if (!state.albums.some((album) => album.id === image.albumId) ||
          !image.id || !detection.id || !image.imageUri.trim() ||
          detection.imageId !== image.id ||
          !Object.hasOwn(EMOTIONS, detection.emotion) ||
          !Number.isInteger(detection.confidence) || detection.confidence < 0 || detection.confidence > 100 ||
          !Number.isFinite(Date.parse(image.capturedAt)) || !Number.isFinite(Date.parse(detection.recordedAt)) ||
          state.images.some((existing) => existing.id === image.id) ||
          state.detectionRecords.some((existing) => existing.id === detection.id)) return state;
      return { ...state, images: [{ ...image }, ...state.images], detectionRecords: [{ ...detection }, ...state.detectionRecords] };
    }
    case "DELETE_IMAGE":
      return removeImages(state, new Set([action.imageId]));
    case "DELETE_IMAGES":
      return removeImages(state, new Set(action.imageIds));
    case "RESET_MOCK_DATA":
      return {
        cats: initialCatDataState.cats.map((cat) => ({ ...cat })),
        albums: initialCatDataState.albums.map((album) => ({ ...album })),
        images: initialCatDataState.images.map((image) => ({ ...image })),
        detectionRecords: initialCatDataState.detectionRecords.map((record) => ({ ...record })),
      };
  }
}
