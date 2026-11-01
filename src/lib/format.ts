export function formatNumber(
  value: number,
  locale: string,
  maximumFractionDigits = 0,
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatDecimal(value: number, locale: string): string {
  return formatNumber(value, locale, 1);
}

export function formatSigned(value: number, locale: string): string {
  const formatted = formatDecimal(Math.abs(value), locale);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatted}`;
}
