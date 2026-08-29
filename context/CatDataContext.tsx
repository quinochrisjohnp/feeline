import React, { createContext, useCallback, useContext, useState } from "react";
import { mockCats } from "@/data/mockCats";
import { mockDetectionRecords } from "@/data/mockDetectionRecords";
import type { Cat, DetectionRecord } from "@/types/models";
import { generateId } from "@/utils/id";

/** Permanent system category — not a real Cat profile. Kept out of the
 * `cats` array on purpose (see Phase 3 §16: don't expose profile-management
 * behavior for it). */
export const UNKNOWN_CAT_ID = "unknown-cats";

interface CatDataContextValue {
  cats: Cat[];
  detectionRecords: DetectionRecord[];
  addCat: (cat: Cat) => void;
  renameCat: (catId: string, name: string) => void;
  deleteCat: (catId: string) => void;
  addDetectionRecord: (record: Omit<DetectionRecord, "id"> & { id?: string }) => DetectionRecord;
  deleteDetectionRecord: (recordId: string) => void;
  deleteDetectionRecords: (recordIds: string[]) => void;
}

const CatDataContext = createContext<CatDataContextValue | undefined>(undefined);

// TODO(backend): back this context with real API calls once the server is
// connected. Every screen already reads/writes through these functions, so
// only this file should need to change.
export function CatDataProvider({ children }: { children: React.ReactNode }) {
  const [cats, setCats] = useState<Cat[]>(mockCats);
  const [detectionRecords, setDetectionRecords] = useState<DetectionRecord[]>(mockDetectionRecords);

  const addCat = useCallback((cat: Cat) => {
    setCats((current) => [cat, ...current]);
  }, []);

  const renameCat = useCallback((catId: string, name: string) => {
    setCats((current) => current.map((cat) => (cat.id === catId ? { ...cat, name } : cat)));
  }, []);

  const deleteCat = useCallback((catId: string) => {
    setCats((current) => current.filter((cat) => cat.id !== catId));
    setDetectionRecords((current) => current.filter((record) => record.catId !== catId));
  }, []);

  const addDetectionRecord = useCallback((record: Omit<DetectionRecord, "id"> & { id?: string }) => {
    const newRecord: DetectionRecord = { ...record, id: record.id ?? generateId("det") };
    setDetectionRecords((current) => [newRecord, ...current]);
    return newRecord;
  }, []);

  const deleteDetectionRecord = useCallback((recordId: string) => {
    setDetectionRecords((current) => current.filter((record) => record.id !== recordId));
  }, []);

  const deleteDetectionRecords = useCallback((recordIds: string[]) => {
    setDetectionRecords((current) => current.filter((record) => !recordIds.includes(record.id)));
  }, []);

  return (
    <CatDataContext.Provider
      value={{
        cats,
        detectionRecords,
        addCat,
        renameCat,
        deleteCat,
        addDetectionRecord,
        deleteDetectionRecord,
        deleteDetectionRecords,
      }}
    >
      {children}
    </CatDataContext.Provider>
  );
}

export function useCatData(): CatDataContextValue {
  const context = useContext(CatDataContext);
  if (!context) {
    throw new Error("useCatData must be used within a CatDataProvider.");
  }
  return context;
}