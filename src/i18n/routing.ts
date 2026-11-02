import { defineRouting } from 'next-intl/routing';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every route is prefixed (/ar/…, /en/…). Unprefixed links from backend e-mails
  // (e.g. /verify-email?…, /l/{id}) are redirected to the visitor's preferred locale.
  localePrefix: 'always',
  // Persist the chosen locale (NEXT_LOCALE cookie, 1 year).
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' },
});

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function localeDirection(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
