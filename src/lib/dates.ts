export type DateKey = string;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateKey(value: Date = new Date()): DateKey {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function todayKey(): DateKey {
  return toDateKey();
}

export function isValidDateKey(value: string): value is DateKey {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseDateKey(value: DateKey): Date {
  if (!isValidDateKey(value)) {
    throw new RangeError(`Invalid date key: ${value}`);
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: DateKey, amount: number): DateKey {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function addMonths(value: DateKey, amount: number): DateKey {
  const date = parseDateKey(value);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);

  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));

  return toDateKey(date);
}

export function monthKey(value: DateKey): string {
  return value.slice(0, 7);
}

export function firstDayOfMonth(value: DateKey): DateKey {
  return `${monthKey(value)}-01`;
}

export function daysInMonth(value: DateKey): number {
  const date = parseDateKey(value);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function monthLabel(value: DateKey, locale: string): string {
  return parseDateKey(value).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

export function formatLongDate(value: DateKey, locale: string): string {
  return parseDateKey(value).toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(value: DateKey, locale: string): string {
  return parseDateKey(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso: string, locale: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function lastDateKeys(count: number, end: DateKey = todayKey()): DateKey[] {
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }

  const keys: DateKey[] = [];

  for (let index = count - 1; index >= 0; index -= 1) {
    keys.push(addDays(end, -index));
  }

  return keys;
}

export interface CalendarCell {
  dateKey: DateKey;
  day: number;
  inMonth: boolean;
}

/**
 * Builds a Monday-first month grid with complete weeks, so the calendar
 * always renders six or fewer rows without changing cell size.
 */
export function buildMonthGrid(value: DateKey): CalendarCell[][] {
  const first = firstDayOfMonth(value);
  const firstDate = parseDateKey(first);
  const offset = (firstDate.getDay() + 6) % 7;
  const gridStart = addDays(first, -offset);
  const totalDays = daysInMonth(value);
  const cellCount = Math.ceil((offset + totalDays) / 7) * 7;
  const weeks: CalendarCell[][] = [];

  for (let index = 0; index < cellCount; index += 1) {
    const dateKey = addDays(gridStart, index);
    const date = parseDateKey(dateKey);

    if (index % 7 === 0) {
      weeks.push([]);
    }

    weeks[weeks.length - 1].push({
      dateKey,
      day: date.getDate(),
      inMonth: dateKey.slice(0, 7) === monthKey(value),
    });
  }

  return weeks;
}
