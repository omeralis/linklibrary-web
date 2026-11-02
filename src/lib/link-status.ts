import type { AnyLink, OwnedLink, ProcessingStatus, SecurityStatus } from '@/lib/api/types';

export const ACTIVE_PROCESSING: ProcessingStatus[] = ['PENDING', 'PROCESSING'];

export function isProcessing(status: ProcessingStatus | undefined | null): boolean {
  return !!status && ACTIVE_PROCESSING.includes(status);
}

/** Security statuses for which publishing/sharing is never allowed (backend: only CLEAR may be published/shared). */
export function isRestrictedSecurity(status: SecurityStatus): boolean {
  return status !== 'CLEAR';
}

export type SecurityTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function securityTone(status: SecurityStatus): SecurityTone {
  switch (status) {
    case 'CLEAR':
      return 'success';
    case 'PENDING':
      return 'info';
    case 'UNKNOWN':
      return 'neutral';
    case 'SUSPICIOUS':
      return 'warning';
    case 'MALICIOUS':
      return 'danger';
  }
}

/**
 * Why publishing is unavailable, as a translation key under "links.restrictions", or null if allowed.
 * The backend's `permissions.can_publish` is authoritative; this only explains the reason.
 */
export function publishRestriction(link: OwnedLink, emailVerified: boolean): string | null {
  if (link.permissions.can_publish && emailVerified) return null;
  if (!emailVerified) return 'emailNotVerified';
  return `security_${link.security.status}`;
}

export function shareRestriction(link: OwnedLink, emailVerified: boolean): string | null {
  if (link.permissions.can_share && emailVerified) return null;
  if (!emailVerified) return 'emailNotVerified';
  return `security_${link.security.status}`;
}

export function linkHref(link: Pick<AnyLink, 'public_id' | 'access_role'>): string {
  return link.access_role === 'owner' ? `/dashboard/links/${link.public_id}` : `/l/${link.public_id}`;
}
