import { describe, expect, it } from 'vitest';
import { extractSharedUrl, sharedTitle } from '@/lib/share';

describe('extractSharedUrl', () => {
  it('takes a plain url', () => {
    expect(extractSharedUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
  });
  it('finds the url inside shared text, without trailing punctuation', () => {
    expect(extractSharedUrl(null, 'شاهد هذا https://www.facebook.com/share/p/abc/.')).toBe('https://www.facebook.com/share/p/abc/');
  });
  it('prefers the url field, then text', () => {
    expect(extractSharedUrl('https://a.com', 'see https://b.com')).toBe('https://a.com/');
    expect(extractSharedUrl('', 'see https://b.com')).toBe('https://b.com/');
  });
  it.each(['javascript:alert(1)', 'no link here', 'ftp://x.com', 'https://user:pw@x.com', '', null, undefined])('rejects %s', (v) => {
    expect(extractSharedUrl(v as string)).toBeNull();
  });
});

describe('sharedTitle', () => {
  it('uses the shared title when it is not just the address', () => {
    expect(sharedTitle('A great post', 'x https://a.com', 'https://a.com/')).toBe('A great post');
  });
  it('falls back to the text without the address', () => {
    expect(sharedTitle('', 'منشور مفيد جدا https://a.com/p', 'https://a.com/p')).toBe('منشور مفيد جدا');
  });
  it('is empty when only the address was shared', () => {
    expect(sharedTitle('https://a.com/p', 'https://a.com/p', 'https://a.com/p')).toBe('');
  });
  it('caps the length at 300 characters', () => {
    expect(sharedTitle('x'.repeat(400), null, null)).toHaveLength(300);
  });
});
