import { describe, expect, it } from 'vitest';
import { toQueryString } from '@/lib/api/query-string';

describe('toQueryString', () => {
  it('serialises like Laravel expects', () => {
    expect(toQueryString({ q: 'قهوة', favorite: true, tags: ['a', 'b'], page: 2, empty: '', none: undefined, nil: null })).toBe(
      `?q=${encodeURIComponent('قهوة')}&favorite=1&tags%5B%5D=a&tags%5B%5D=b&page=2`,
    );
  });
  it('returns empty string when nothing to send', () => {
    expect(toQueryString({})).toBe('');
    expect(toQueryString()).toBe('');
  });
  it('encodes false as 0', () => {
    expect(toQueryString({ unread: false })).toBe('?unread=0');
  });
});
