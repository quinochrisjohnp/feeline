import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import {
  initialCatDataState,
} from "@/data/initialAppData";

import type {
  Cat,
  CatChanges,
  CatDataState,
  DetectionRecord,
  SavedImage,
  SaveCaptureInput,
} from "@/types/models";

import {
  generateId,
} from "@/utils/id";

import {
  createCat as createCatApi,
  deleteCat as deleteCatApi,
  fetchCats,
  updateCat as updateCatApi,
} from "@/services/cats";

import {
  fetchDetectionHistory,
  removeDetectionFromAlbum,
} from "@/services/detection";

import {
  useAuth,
} from "@/context/AuthContext";

import {
  catDataReducer,
} from "./catDataReducer";

const UNKNOWN_CAT_NAME =
  "unknown cats";

export interface CatDataContextValue {
  state: CatDataState;

  catsLoading: boolean;
  catsError: string | null;

  detectionsLoading: boolean;
  detectionsError:
    string | null;

  refreshCats(): Promise<void>;

  refreshDetections(): Promise<void>;

  refreshData(): Promise<void>;

  addCat(
    cat: Cat
  ): Promise<Cat>;

  updateCat(
    catId: string,
    changes: CatChanges
  ): Promise<Cat>;

  renameAlbum(
    albumId: string,
    name: string
  ): Promise<void>;

  deleteCat(
    catId: string
  ): Promise<void>;

  saveCapture(
    input: SaveCaptureInput
  ): {
    image: SavedImage;
    detection: DetectionRecord;
  };

  deleteImage(
    imageId: string
  ): Promise<void>;

  deleteImages(
    imageIds: string[]
  ): Promise<void>;

    resetMockData(): void;
  }

const CatDataContext =
  createContext<
    CatDataContextValue | undefined
  >(undefined);

export function CatDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    profile,
  } = useAuth();

  const [
    state,
    dispatch,
  ] = useReducer(
    catDataReducer,
    initialCatDataState
  );

  const [
    catsLoading,
    setCatsLoading,
  ] = useState(false);

  const [
    catsError,
    setCatsError,
  ] = useState<
    string | null
  >(null);

  const [
    detectionsLoading,
    setDetectionsLoading,
  ] = useState(false);

  const [
    detectionsError,
    setDetectionsError,
  ] = useState<
    string | null
  >(null);

  const refreshCats =
    useCallback(async () => {
      if (!profile) {
        dispatch({
          type: "SET_CATS",
          cats: [],
        });

        return;
      }

      try {
        setCatsLoading(true);
        setCatsError(null);

        const cats =
          await fetchCats();

        // Backend creates temporary
        // "Unknown Cats" rows for
        // unassigned detections.
        //
        // They are NOT real Cat Profiles.
        const realCats =
          cats.filter(
            (cat) =>
              cat.name
                .trim()
                .toLowerCase() !==
              UNKNOWN_CAT_NAME
          );

        dispatch({
          type: "SET_CATS",
          cats: realCats,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch cats";

        console.error(
          "Fetch cats error:",
          error
        );

        setCatsError(
          message
        );
      } finally {
        setCatsLoading(
          false
        );
      }
    }, [profile]);

  const refreshDetections =
    useCallback(async () => {
      if (!profile) {
        dispatch({
          type:
            "SET_DETECTION_HISTORY",
          images: [],
          detectionRecords: [],
        });

        return;
      }

      try {
        setDetectionsLoading(
          true
        );

        setDetectionsError(
          null
        );

        const history =
          await fetchDetectionHistory();

        dispatch({
          type:
            "SET_DETECTION_HISTORY",

          images:
            history.images,

          detectionRecords:
            history.detectionRecords,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch detection history";

        console.error(
          "Fetch detection history error:",
          error
        );

        setDetectionsError(
          message
        );
      } finally {
        setDetectionsLoading(
          false
        );
      }
    }, [profile]);

  const refreshData =
    useCallback(async () => {
      if (!profile) {
        dispatch({
          type: "SET_CATS",
          cats: [],
        });

        dispatch({
          type:
            "SET_DETECTION_HISTORY",
          images: [],
          detectionRecords: [],
        });

        return;
      }

      await refreshCats();

      await refreshDetections();
    }, [
      profile,
      refreshCats,
      refreshDetections,
    ]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const addCat =
    useCallback(
      async (
        cat: Cat
      ): Promise<Cat> => {
        const savedCat =
          await createCatApi(
            cat
          );

        dispatch({
          type: "ADD_CAT",
          cat: savedCat,
        });

        return savedCat;
      },
      []
    );

  const updateCat =
    useCallback(
      async (
        catId: string,
        changes: CatChanges
      ): Promise<Cat> => {
        const savedCat =
          await updateCatApi(
            catId,
            changes
          );

        dispatch({
          type: "UPDATE_CAT",
          catId,

          changes: {
            name:
              savedCat.name,

            gender:
              savedCat.gender,

            birthdate:
              savedCat.birthdate,

            photoUri:
              savedCat.photoUri,

            coverUri:
              savedCat.coverUri,
          },
        });

        return savedCat;
      },
      []
    );

  const renameAlbum =
    useCallback(
      async (
        albumId: string,
        name: string
      ): Promise<void> => {
        const album =
          state.albums.find(
            (item) =>
              item.id ===
              albumId
          );

        if (
          !album ||
          album.kind !==
            "cat" ||
          !album.catId
        ) {
          return;
        }

        await updateCat(
          album.catId,
          {
            name,
          }
        );
      },
      [
        state.albums,
        updateCat,
      ]
    );

  const deleteCat =
    useCallback(
      async (
        catId: string
      ): Promise<void> => {
        await deleteCatApi(
          catId
        );

        dispatch({
          type: "DELETE_CAT",
          catId,
        });
      },
      []
    );

  // Kept temporarily for compatibility
  // with any remaining local/mock code.
  //
  // Camera Save will no longer use
  // this for persisted detections.
  const saveCapture =
    useCallback(
      (
        input: SaveCaptureInput
      ) => {
        const image: SavedImage =
          {
            id: generateId(
              "image"
            ),

            albumId:
              input.albumId,

            imageUri:
              input.imageUri,

            capturedAt:
              input.capturedAt,
          };

        const detection: DetectionRecord =
          {
            id: generateId(
              "det"
            ),

            imageId:
              image.id,

            emotion:
              input.emotion,

            confidence:
              input.confidence,

            recordedAt:
              input.capturedAt,
          };

        dispatch({
          type: "SAVE_CAPTURE",
          image,
          detection,
        });

        return {
          image,
          detection,
        };
      },
      []
    );

  const deleteImage = useCallback(
    async (imageId: string): Promise<void> => {
      const detection = state.detectionRecords.find(
        (record) => record.imageId === imageId
      );

      if (!detection) {
        throw new Error("Detection record not found.");
      }

      // Update PostgreSQL first.
      await removeDetectionFromAlbum(detection.id);

      // Update the frontend only after the API succeeds.
      dispatch({
        type: "DELETE_IMAGE",
        imageId,
      });
    },
    [state.detectionRecords]
  );

  const deleteImages = useCallback(
    async (imageIds: string[]): Promise<void> => {
      const detections = imageIds.map((imageId) => {
        const detection = state.detectionRecords.find(
          (record) => record.imageId === imageId
        );

        if (!detection) {
          throw new Error(
            `Detection record not found for image ${imageId}.`
          );
        }

        return detection;
      });

      // Update PostgreSQL before changing the frontend.
      await Promise.all(
        detections.map((detection) =>
          removeDetectionFromAlbum(detection.id)
        )
      );

      dispatch({
        type: "DELETE_IMAGES",
        imageIds,
      });
    },
    [state.detectionRecords]
  );

  const resetMockData =
    useCallback(() => {
      dispatch({
        type:
          "RESET_MOCK_DATA",
      });
    }, []);

  const value =
    useMemo<
      CatDataContextValue
    >(
      () => ({
        state,

        catsLoading,
        catsError,

        detectionsLoading,
        detectionsError,

        refreshCats,
        refreshDetections,
        refreshData,

        addCat,
        updateCat,
        renameAlbum,
        deleteCat,

        saveCapture,
        deleteImage,
        deleteImages,
        resetMockData,
      }),
      [
        state,

        catsLoading,
        catsError,

        detectionsLoading,
        detectionsError,

        refreshCats,
        refreshDetections,
        refreshData,

        addCat,
        updateCat,
        renameAlbum,
        deleteCat,

        saveCapture,
        deleteImage,
        deleteImages,
        resetMockData,
      ]
    );

  return (
    <CatDataContext.Provider
      value={value}
    >
      {children}
    </CatDataContext.Provider>
  );
}

export function useCatData(): CatDataContextValue {
  const context =
    useContext(
      CatDataContext
    );

  if (!context) {
    throw new Error(
      "useCatData must be used within a CatDataProvider."
    );
  }

  return context;
}