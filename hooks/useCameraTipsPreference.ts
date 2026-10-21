import { useEffect, useSyncExternalStore } from "react";
import { getCameraTipsPreference, subscribeCameraTipsPreference, loadCameraTipsPreference, setCameraTipsPreference } from "@/services/cameraTipsPreference";
export function useCameraTipsPreference() {
  const state = useSyncExternalStore(subscribeCameraTipsPreference, getCameraTipsPreference, getCameraTipsPreference);
  useEffect(() => { void loadCameraTipsPreference(); }, []);
  return { ...state, setEnabled: setCameraTipsPreference };
}
