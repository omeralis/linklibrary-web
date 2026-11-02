import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe('translations', () => {
  it('ar and en have identical keys', () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
  it('no Arabic value is left in English (spot check of UI chrome)', () => {
    for (const key of ['nav.login', 'common.cancel', 'links.add.title', 'security.status.CLEAR', 'errors.codes.NETWORK_ERROR']) {
      const value = key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], ar) as string;
      expect(value).toMatch(/[؀-ۿ]/);
    }
  });
  it('every translation key referenced in the source exists (scripts/check-i18n.mjs)', () => {
    expect(() => execFileSync('node', ['scripts/check-i18n.mjs'], { stdio: 'pipe' })).not.toThrow();
  });
});
