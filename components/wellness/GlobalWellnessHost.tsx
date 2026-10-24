import React from "react";
import { ReminderPresentationScope } from "@/context/PresentationContext";
import WellnessCalendarSection from "./WellnessCalendarSection";
/** One host per authenticated account, retained across tab and deep-screen navigation. */
export default function GlobalWellnessHost() {
  return <ReminderPresentationScope value={true}>
    <WellnessCalendarSection global date={new Date()} catId={null} blocked={false} onOpenContext={() => {}} />
  </ReminderPresentationScope>;
}
