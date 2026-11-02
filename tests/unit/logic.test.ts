import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { shouldRetry, retryDelay } from '@/lib/query-client';
import { isProcessing, linkHref, publishRestriction, securityTone, shareRestriction } from '@/lib/link-status';
import { buildGrantTree, countDependents, revocationImpact } from '@/components/sharing/access-graph';
import { categoryName, formatNumber, formatRelative, initials } from '@/lib/format';
import type { Grant } from '@/lib/api/types';
import { ownedLink } from '../fixtures';

describe('retry policy', () => {
  it('never retries 4xx (except 408/429 once)', () => {
    expect(shouldRetry(0, new ApiError(404, 'NOT_FOUND', ''))).toBe(false);
    expect(shouldRetry(0, new ApiError(422, 'VALIDATION_ERROR', ''))).toBe(false);
    expect(shouldRetry(0, new ApiError(401, 'UNAUTHENTICATED', ''))).toBe(false);
    expect(shouldRetry(0, new ApiError(429, 'RATE_LIMITED', ''))).toBe(true);
    expect(shouldRetry(1, new ApiError(429, 'RATE_LIMITED', ''))).toBe(false);
  });
  it('retries network and 5xx twice, never aborted requests', () => {
    expect(shouldRetry(1, new ApiError(0, 'NETWORK_ERROR', ''))).toBe(true);
    expect(shouldRetry(2, new ApiError(500, 'SERVER_ERROR', ''))).toBe(false);
    expect(shouldRetry(0, new ApiError(0, 'ABORTED', ''))).toBe(false);
  });
  it('honours Retry-After', () => {
    expect(retryDelay(0, new ApiError(429, 'RATE_LIMITED', '', {}, 5))).toBe(5000);
    expect(retryDelay(1, new Error('x'))).toBe(2000);
  });
});

describe('link security rules (mirror the backend policy, never override it)', () => {
  it('detects active processing', () => {
    expect(isProcessing('PENDING')).toBe(true);
    expect(isProcessing('PROCESSING')).toBe(true);
    expect(isProcessing('FAILED')).toBe(false);
  });
  it('maps tones', () => {
    expect(securityTone('CLEAR')).toBe('success');
    expect(securityTone('MALICIOUS')).toBe('danger');
  });
  it('explains why publishing/sharing is blocked', () => {
    const blocked = ownedLink({ security: { status: 'UNKNOWN', can_open: true, warning: 'security.unknown', checked_at: null }, permissions: { can_edit: true, can_delete: true, can_change_visibility: true, can_publish: false, can_share: false, can_reshare: true } });
    expect(publishRestriction(blocked, true)).toBe('security_UNKNOWN');
    expect(shareRestriction(blocked, true)).toBe('security_UNKNOWN');
    expect(publishRestriction(ownedLink(), false)).toBe('emailNotVerified');
    expect(publishRestriction(ownedLink(), true)).toBeNull();
  });
  it('routes owners to the dashboard and others to /l', () => {
    expect(linkHref({ public_id: 'x', access_role: 'owner' })).toBe('/dashboard/links/x');
    expect(linkHref({ public_id: 'x', access_role: 'viewer' })).toBe('/l/x');
  });
});

describe('access graph', () => {
  const g = (id: string, parent: string | null, effective = true): Grant => ({
    id,
    parent_grant_id: parent,
    grantee: { username: id, name: id },
    grantor: { username: 'o', name: 'o' },
    depth: parent ? 2 : 1,
    status: 'ACTIVE',
    effective,
    revoke_reason: null,
    created_at: null,
    revoked_at: null,
  });
  it('builds a reshare tree and counts dependents recursively', () => {
    const tree = buildGrantTree([g('a', null), g('b', 'a'), g('c', 'b'), g('d', 'a', false), g('e', null)]);
    expect(tree.map((n) => n.grant.id)).toEqual(['a', 'e']);
    expect(countDependents(tree[0])).toBe(2); // b and c are effective; d is not
    expect(countDependents(tree[1])).toBe(0);
  });
  it('counts people (not grants) who lose access and honours independent paths', () => {
    const user = (grant: Grant, username: string): Grant => ({ ...grant, grantee: { username, name: username } });
    // owner → bob → carol, owner → bob → dave, owner → dave (direct)
    const grants = [user(g('1', null), 'bob'), user(g('2', '1'), 'carol'), user(g('3', '1'), 'dave'), user(g('4', null), 'dave')];
    const tree = buildGrantTree(grants);
    expect(revocationImpact(grants, tree[0])).toEqual({ targetLoses: true, dependents: 1 }); // carol only; dave keeps
    // Revoking dave's reshared grant: dave keeps access through the direct grant.
    expect(revocationImpact(grants, tree[0].children[1])).toEqual({ targetLoses: false, dependents: 0 });
    expect(revocationImpact(grants, tree[1])).toEqual({ targetLoses: false, dependents: 0 });
  });
  it('treats grants with an invisible parent as roots (viewer view)', () => {
    expect(buildGrantTree([g('x', 'missing')]).map((n) => n.grant.id)).toEqual(['x']);
  });
});

describe('formatting', () => {
  it('formats numbers per locale using CLDR rules', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234');
    expect(formatNumber(1234, 'ar')).toBe(new Intl.NumberFormat('ar').format(1234));
    expect(formatNumber(null, 'en')).toBe('');
  });
  it('formats relative times', () => {
    const now = new Date('2026-11-01T12:00:00Z');
    expect(formatRelative('2026-11-01T11:00:00Z', 'en', now)).toBe('1 hour ago');
    expect(formatRelative(null, 'en', now)).toBe('');
  });
  it('builds initials and localized category names', () => {
    expect(initials('Sara Ali')).toBe('SA');
    expect(initials('عمر')).toBe('ع');
    expect(categoryName({ name: 'x', name_ar: 'برمجة', name_en: 'Programming' }, 'ar')).toBe('برمجة');
    expect(categoryName({ name: 'x', name_ar: 'برمجة', name_en: 'Programming' }, 'en')).toBe('Programming');
  });
});
