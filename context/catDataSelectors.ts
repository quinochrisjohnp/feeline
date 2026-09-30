import type { CatDataState, DetectionRecord } from "../types/models";
import { EMOTIONS, UNKNOWN_ALBUM_ID } from "../types/models";
import { isSameDay, isValidBirthdate } from "../utils/date";

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

/** Calendar history only includes complete, valid ownership chains. No state is repaired here. */
export function selectCalendarRecords(state: CatDataState, catId: string | null = null) {
  return state.detectionRecords.filter((record) => {
    if (!Number.isFinite(Date.parse(record.recordedAt)) || !Object.hasOwn(EMOTIONS, record.emotion)) return false;
    const image = selectImageById(state, record.imageId);
    const album = image ? selectAlbumById(state, image.albumId) : null;
    if (!album) return false;
    if (album.kind === "unknown") {
      return album.id === UNKNOWN_ALBUM_ID && album.catId === null && (catId === null || catId === UNKNOWN_ALBUM_ID);
    }
    return album.kind === "cat" && album.id !== UNKNOWN_ALBUM_ID && !!album.catId &&
      !!selectCatById(state, album.catId) && (catId === null || catId === album.catId);
  }).sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt) || a.id.localeCompare(b.id));
}

/** Filter is a real Cat ID, the Unknown Cats album ID, or null for all. Dates use local time. */
export function selectCalendarRecordsForDate(state: CatDataState, date: Date, catId: string | null = null) {
  return selectCalendarRecords(state, catId).filter((record) => isSameDay(new Date(record.recordedAt), date));
}

/** Annual birthdays are date-only values; February 29 appears only in leap years. */
export function selectBirthdayCatsForDate(state: CatDataState, date: Date, catId: string | null = null) {
  if (catId === UNKNOWN_ALBUM_ID) return [];
  return state.cats.filter((cat) => {
    if ((catId !== null && cat.id !== catId) || !isValidBirthdate(cat.birthdate)) return false;
    const [year, month, day] = cat.birthdate.split("-").map(Number);
    return date.getFullYear() >= year && date.getMonth() + 1 === month && date.getDate() === day;
  }).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export function selectCalendarFilterOptions(state: CatDataState) {
  const options = state.cats.map((cat) => ({ id: cat.id, name: cat.name }));
  const unknown = selectAlbumById(state, UNKNOWN_ALBUM_ID);
  if (unknown?.kind === "unknown" && unknown.catId === null) {
    options.push({ id: UNKNOWN_ALBUM_ID, name: selectAlbumName(state, UNKNOWN_ALBUM_ID) });
  }
  return options;
}
