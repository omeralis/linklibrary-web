import { describe, expect, it } from 'vitest';
import { addLinkSchema, isHttpUrl, normalizeUrlInput, passwordChangeSchema, registerSchema } from '@/lib/validation/schemas';
import { translateValidationMessage, vmsg } from '@/lib/validation/messages';

describe('URL input', () => {
  it('adds https:// when the scheme is missing', () => {
    expect(normalizeUrlInput('example.com/a')).toBe('https://example.com/a');
    expect(normalizeUrlInput('  https://x.com ')).toBe('https://x.com');
    expect(normalizeUrlInput('localhost:3000')).toBe('https://localhost:3000');
  });
  it('rejects non-http schemes, credentials and single-label hosts', () => {
    expect(isHttpUrl(normalizeUrlInput('javascript:alert(1)'))).toBe(false);
    expect(isHttpUrl('ftp://example.com')).toBe(false);
    expect(isHttpUrl('https://user:pw@example.com')).toBe(false);
    expect(isHttpUrl('https://intranet')).toBe(false);
    expect(isHttpUrl('https://مثال.السعودية/صفحة')).toBe(true);
  });
  it('validates the add-link form', () => {
    const ok = addLinkSchema.safeParse({ url: 'laravel.com/docs', custom_title: '', notes: '', category: '', tags: [], collections: [] });
    expect(ok.success && ok.data.url).toBe('https://laravel.com/docs');
    const bad = addLinkSchema.safeParse({ url: 'javascript:alert(1)', custom_title: '', notes: '', category: '', tags: [], collections: [] });
    expect(bad.success).toBe(false);
  });
});

describe('account schemas mirror backend rules', () => {
  const base = { name: 'Sara', username: 'Sara_1', email: 'sara@example.com', password: 'abcdefgh12', password_confirmation: 'abcdefgh12' };
  it('lowercases usernames and accepts valid data', () => {
    const r = registerSchema.safeParse(base);
    expect(r.success && r.data.username).toBe('sara_1');
  });
  it('rejects weak or mismatched passwords and bad usernames', () => {
    const issues = (v: object) => (registerSchema.safeParse({ ...base, ...v }).error?.issues ?? []).map((i) => `${i.path.join('.')}:${i.message}`);
    expect(issues({ password: 'short1', password_confirmation: 'short1' })).toContain('password:v:passwordMin|10');
    expect(issues({ password: 'abcdefghijk', password_confirmation: 'abcdefghijk' })).toContain('password:v:passwordNumbers');
    expect(issues({ password_confirmation: 'other12345' })).toContain('password_confirmation:v:passwordMatch');
    expect(issues({ username: 'ab' })).toContain('username:v:username');
  });
  it('requires a different new password', () => {
    const r = passwordChangeSchema.safeParse({ current_password: 'abcdefgh12', password: 'abcdefgh12', password_confirmation: 'abcdefgh12' });
    expect(r.error?.issues.map((i) => i.message)).toContain('v:passwordDifferent');
  });
});

describe('validation message translation', () => {
  const t = (key: string, values?: Record<string, string | number>) => `${key}${values ? JSON.stringify(values) : ''}`;
  it('translates v: keys and passes server messages through', () => {
    expect(translateValidationMessage(t, vmsg('max', 10))).toBe('validation.max{"value":"10"}');
    expect(translateValidationMessage(t, vmsg('required'))).toBe('validation.required');
    expect(translateValidationMessage(t, 'The email has already been taken.')).toBe('The email has already been taken.');
  });
});
