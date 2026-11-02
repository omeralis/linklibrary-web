/**
 * URL helpers for rendering untrusted URLs safely (XSS / open-redirect protection).
 * React already escapes text; these guard attribute values such as href/src.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

/** Returns the URL when it is an absolute http(s) URL without embedded credentials, otherwise null. */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (!SAFE_PROTOCOLS.has(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Image sources: http(s) only (no data:, javascript:, blob: from the API). */
export function safeImageUrl(value: string | null | undefined): string | null {
  return safeExternalUrl(value);
}

/**
 * Validates an in-app redirect target (e.g. `?next=`). Only same-origin relative paths are allowed:
 * must start with a single "/", no protocol-relative "//", no backslashes, no control characters.
 */
export function safeInternalPath(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, 'http://internal.invalid');
    if (parsed.origin !== 'http://internal.invalid') return fallback;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return fallback;
  }
}

/** Removes a leading /ar or /en from a path (for locale-agnostic redirects through next-intl navigation). */
export function stripLocale(path: string): string {
  return path.replace(/^\/(ar|en)(?=\/|$)/, '') || '/';
}

/** Display form of a URL: hostname + path without protocol, trailing slash or tracking noise. */
export function displayUrl(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
    return `${url.hostname.replace(/^www\./, '')}${path}`;
  } catch {
    return value;
  }
}
