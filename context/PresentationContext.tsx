import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
const PresentationContext = createContext({ blocked: false, register: () => () => {} });
const ReminderScope = createContext(false);
/** Reminder-owned dialogs do not block their own host; every other dialog does. */
export const ReminderPresentationScope = ReminderScope.Provider;
export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  const register = useCallback(() => {
    setCount(value => value + 1);
    let removed = false;
    return () => { if (!removed) { removed = true; setCount(value => Math.max(0, value - 1)); } };
  }, []);
  const value = useMemo(() => ({ blocked: count > 0, register }), [count, register]);
  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}
export const usePresentationBlocked = () => useContext(PresentationContext).blocked;
export function usePresentationBlock(visible: boolean) {
  const { register } = useContext(PresentationContext);
  const reminderOwned = useContext(ReminderScope);
  useLayoutEffect(() => { if (visible && !reminderOwned) return register(); }, [visible, reminderOwned, register]);
}
