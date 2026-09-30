import React, { createContext, useContext, useMemo, useReducer } from "react";
import { initialCatDataState } from "@/data/initialAppData";
import type { Cat, CatChanges, CatDataState, DetectionRecord, SavedImage, SaveCaptureInput } from "@/types/models";
import { generateId } from "@/utils/id";
import { catDataReducer } from "./catDataReducer";

export interface CatDataContextValue {
  state: CatDataState;
  addCat(cat: Cat): void;
  updateCat(catId: string, changes: CatChanges): void;
  renameAlbum(albumId: string, name: string): void;
  deleteCat(catId: string): void;
  saveCapture(input: SaveCaptureInput): { image: SavedImage; detection: DetectionRecord };
  deleteImage(imageId: string): void;
  deleteImages(imageIds: string[]): void;
  resetMockData(): void;
}

const CatDataContext = createContext<CatDataContextValue | undefined>(undefined);

export function CatDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(catDataReducer, initialCatDataState);
  const actions = useMemo<Omit<CatDataContextValue, "state">>(() => ({
    addCat: (cat) => dispatch({ type: "ADD_CAT", cat }),
    updateCat: (catId, changes) => dispatch({ type: "UPDATE_CAT", catId, changes }),
    renameAlbum: (albumId, name) => dispatch({ type: "RENAME_ALBUM", albumId, name }),
    deleteCat: (catId) => dispatch({ type: "DELETE_CAT", catId }),
    saveCapture: (input) => {
      const image: SavedImage = {
        id: generateId("image"), albumId: input.albumId,
        imageUri: input.imageUri, capturedAt: input.capturedAt,
      };
      const detection: DetectionRecord = {
        id: generateId("det"), imageId: image.id, emotion: input.emotion,
        confidence: input.confidence, recordedAt: input.capturedAt,
      };
      dispatch({ type: "SAVE_CAPTURE", image, detection });
      return { image, detection };
    },
    deleteImage: (imageId) => dispatch({ type: "DELETE_IMAGE", imageId }),
    deleteImages: (imageIds) => dispatch({ type: "DELETE_IMAGES", imageIds }),
    resetMockData: () => dispatch({ type: "RESET_MOCK_DATA" }),
  }), []);
  const value = useMemo(() => ({ state, ...actions }), [state, actions]);

  return <CatDataContext.Provider value={value}>{children}</CatDataContext.Provider>;
}

export function useCatData(): CatDataContextValue {
  const context = useContext(CatDataContext);
  if (!context) throw new Error("useCatData must be used within a CatDataProvider.");
  return context;
}
