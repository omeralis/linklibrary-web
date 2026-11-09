import { safeExternalUrl } from '@/lib/url';

const URL_IN_TEXT = /https?:\/\/[^\s<>"'`]+/i;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}»”’'"،؛؟]+$/u;

/**
 * Finds the link inside what a mobile share sheet sends (Web Share Target). Apps put the address in `url`,
 * in `text` ("look at this https://…"), or, on Android, only in `text`. Only http(s) addresses are accepted.
 */
export function extractSharedUrl(...candidates: Array<string | null | undefined>): string | null {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    const direct = safeExternalUrl(value);
    if (direct) return direct;
    const found = URL_IN_TEXT.exec(value)?.[0]?.replace(TRAILING_PUNCTUATION, '');
    const safe = safeExternalUrl(found);
    if (safe) return safe;
  }
  return null;
}

/**
 * A readable title for a shared link when the site itself cannot be fetched (e.g. Facebook): the shared
 * title, else the shared text without the address. Empty when there is nothing useful.
 */
export function sharedTitle(title: string | null | undefined, text: string | null | undefined, url: string | null): string {
  const clean = (value: string | null | undefined) => {
    const stripped = (value ?? '').replace(URL_IN_TEXT, ' ').replace(/\s+/g, ' ').trim();
    return stripped.length >= 2 ? stripped.slice(0, 300) : '';
  };
  const fromTitle = clean(title);
  if (fromTitle && fromTitle !== url) return fromTitle;
  return clean(text);
}
