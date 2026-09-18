/** Parse date-only values in local time, avoiding UTC birthday shifts. */
function localDate(iso: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso);
}

export function isValidBirthdate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const date = localDate(iso);
  return Number.isFinite(date.getTime()) && toDateOnly(date) === iso;
}

export function toDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Form boundary: accept MM/DD/YYYY while storing only YYYY-MM-DD. */
export function birthdateFromInput(value: string): string | null {
  const trimmed = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  const iso = match ? `${match[3]}-${match[1]}-${match[2]}` : trimmed;
  return isValidBirthdate(iso) ? iso : null;
}

export function getAgeYears(birthdateIso: string): number {
  const birth = localDate(birthdateIso);
  if (Number.isNaN(birth.getTime())) return 0;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return Math.max(0, age);
}

export function formatShortDate(iso: string): string {
  const date = localDate(iso);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "numeric" });
}

export function formatFullDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
}

/**
 * Builds a 6x7 grid of dates covering the given month (Sunday-first weeks),
 * including the leading/trailing days from adjacent months.
 */
export function getMonthMatrix(monthDate: Date): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({ date, inCurrentMonth: date.getMonth() === month });
  }
  return cells;
}

export function monthLabel(monthDate: Date): string {
  return monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** The Sunday-first week (7 consecutive dates) containing the given date.
 * Used by the Calendar's collapsed compact-week header. */
export function getWeekDates(date: Date): Date[] {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}
