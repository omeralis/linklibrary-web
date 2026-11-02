import { describe, expect, it } from 'vitest';
import { displayUrl, safeExternalUrl, safeInternalPath, stripLocale } from '@/lib/url';

describe('safeExternalUrl', () => {
  it('accepts http and https', () => {
    expect(safeExternalUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(safeExternalUrl('http://example.com')).toBe('http://example.com/');
  });
  it.each(['javascript:alert(1)', 'data:text/html,<script>', 'vbscript:x', 'file:///etc/passwd', 'ftp://x.com', '//evil.com', 'not a url', '', null, undefined])(
    'rejects %s',
    (value) => expect(safeExternalUrl(value as string)).toBeNull(),
  );
  it('rejects embedded credentials', () => {
    expect(safeExternalUrl('https://user:pass@example.com')).toBeNull();
  });
});

describe('safeInternalPath (open-redirect protection)', () => {
  it('keeps same-origin relative paths', () => {
    expect(safeInternalPath('/dashboard/links?tab=edit')).toBe('/dashboard/links?tab=edit');
    expect(safeInternalPath('/invitations/accept?token=abc')).toBe('/invitations/accept?token=abc');
  });
  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', '/\u0000x', 'dashboard', ''])('falls back for %s', (value) => {
    expect(safeInternalPath(value, '/fallback')).toBe('/fallback');
  });
});

describe('helpers', () => {
  it('strips the locale prefix', () => {
    expect(stripLocale('/ar/dashboard')).toBe('/dashboard');
    expect(stripLocale('/en')).toBe('/');
    expect(stripLocale('/explore')).toBe('/explore');
  });
  it('formats display URLs', () => {
    expect(displayUrl('https://www.example.com/docs/')).toBe('example.com/docs');
  });
});
