export function nowIso(): string {
  return new Date().toISOString();
}

export function toIsoDateTime(value: Date | number | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date");
  }

  return date.toISOString();
}

export function isIsoDateTime(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
