/** Locale-aware formatting helpers (Intl, CLDR rules for "ar" and "en"). */

export function formatDate(value: string | null | undefined, locale: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(value: string | null | undefined, locale: string): string {
  return formatDate(value, locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatNumber(value: number | null | undefined, locale: string): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat(locale).format(value);
}

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export function formatRelative(value: string | null | undefined, locale: string, now: Date = new Date()): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  let duration = (date.getTime() - now.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) return rtf.format(Math.round(duration), division.unit);
    duration /= division.amount;
  }
  return formatDate(value, locale);
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] ?? '?'];
  return letters.join('').toUpperCase();
}

/** Localized category name from the brief (name_ar/name_en), falling back to the server-localized name. */
export function categoryName(category: { name: string; name_ar?: string; name_en?: string } | null | undefined, locale: string): string {
  if (!category) return '';
  return (locale === 'ar' ? category.name_ar : category.name_en) || category.name;
}
