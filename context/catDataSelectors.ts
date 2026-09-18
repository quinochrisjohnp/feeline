import type { CatDataState, DetectionRecord } from "../types/models";
import { UNKNOWN_ALBUM_ID } from "../types/models";
import { isSameDay } from "../utils/date";

export const selectCatById = (state: CatDataState, catId: string) =>
  state.cats.find((cat) => cat.id === catId) ?? null;

export const selectAlbumById = (state: CatDataState, albumId: string) =>
  state.albums.find((album) => album.id === albumId) ?? null;

export const selectAlbumForCat = (state: CatDataState, catId: string) =>
  state.albums.find((album) => album.kind === "cat" && album.catId === catId) ?? null;

export function selectAlbumName(state: CatDataState, albumId: string): string {
  const album = selectAlbumById(state, albumId);
  if (album?.kind === "unknown") return "Unknown Cats";
  return album?.catId ? selectCatById(state, album.catId)?.name ?? "Album" : "Album";
}

export const selectImageById = (state: CatDataState, imageId: string) =>
  state.images.find((image) => image.id === imageId) ?? null;

export const selectImagesForAlbum = (state: CatDataState, albumId: string) =>
  state.images.filter((image) => image.albumId === albumId)
    .sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt));

export const selectAlbumCoverImage = (state: CatDataState, albumId: string) =>
  selectImagesForAlbum(state, albumId)[0] ?? null;

export const selectDetectionForImage = (state: CatDataState, imageId: string) =>
  state.detectionRecords.filter((record) => record.imageId === imageId)
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0] ?? null;

export function selectDetectionsForAlbum(state: CatDataState, albumId: string) {
  const imageIds = new Set(selectImagesForAlbum(state, albumId).map((image) => image.id));
  return state.detectionRecords.filter((record) => imageIds.has(record.imageId))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
}

export function selectDetectionsForCat(state: CatDataState, catId: string) {
  const album = selectAlbumForCat(state, catId);
  return album ? selectDetectionsForAlbum(state, album.id) : [];
}

export const selectLatestDetectionForCat = (state: CatDataState, catId: string) =>
  selectDetectionsForCat(state, catId)[0] ?? null;

export function selectCatForDetection(state: CatDataState, record: DetectionRecord) {
  const image = selectImageById(state, record.imageId);
  const album = image ? selectAlbumById(state, image.albumId) : null;
  return album?.catId ? selectCatById(state, album.catId) : null;
}

/** Filter is a real Cat ID, the Unknown Cats album ID, or null for all. */
export function selectCalendarRecordsForDate(state: CatDataState, date: Date, catId: string | null = null) {
  const records = catId === null ? state.detectionRecords : catId === UNKNOWN_ALBUM_ID
    ? selectDetectionsForAlbum(state, UNKNOWN_ALBUM_ID) : selectDetectionsForCat(state, catId);
  return records.filter((record) => isSameDay(new Date(record.recordedAt), date))
    .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
}

export function selectCalendarFilterOptions(state: CatDataState) {
  const options = state.cats.map((cat) => ({ id: cat.id, name: cat.name }));
  if (selectDetectionsForAlbum(state, UNKNOWN_ALBUM_ID).length) {
    options.push({ id: UNKNOWN_ALBUM_ID, name: selectAlbumName(state, UNKNOWN_ALBUM_ID) });
  }
  return options;
}
