/** Inclusive UTC calendar dates, expressed as a half-open timestamp range. */
export function detectionDateFilter(start: unknown, end: unknown) {
  function midnight(value: unknown) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value + "T00:00:00.000Z");
    return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value) ? date : null;
  }
  const from = midnight(start);
  const through = midnight(end);
  if ((start !== undefined && !from) || (end !== undefined && !through)) return null;
  if (from && through && from > through) return null;
  if (!from && !through) return {};
  if (through) through.setUTCDate(through.getUTCDate() + 1);
  return { detected_at: { ...(from && { gte: from }), ...(through && { lt: through }) } };
}
