'use client';

import { AlertTriangle, CheckCircle2, KeyRound, Mail, ShieldAlert, UserMinus, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { AppNotification } from '@/lib/api/types';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

const ICONS: Record<string, LucideIcon> = {
  'sharing.invitation_received': Mail,
  'sharing.invitation_accepted': CheckCircle2,
  'sharing.access_revoked': UserMinus,
  'security.warning': ShieldAlert,
  'processing.failed': AlertTriangle,
  'account.password_changed': KeyRound,
};

/** Where a notification leads inside the app (link ids are saved-link public ids). */
export function notificationHref(n: AppNotification): string | null {
  const linkId = typeof n.data.link_id === 'string' ? n.data.link_id : null;
  switch (n.kind) {
    case 'sharing.invitation_received':
      return '/dashboard/shared?tab=invitations';
    case 'sharing.access_revoked':
      return '/dashboard/shared';
    case 'sharing.invitation_accepted':
    case 'security.warning':
    case 'processing.failed':
      return linkId ? `/dashboard/links/${linkId}` : '/dashboard/links';
    case 'account.password_changed':
      return '/dashboard/settings?tab=security';
    default:
      return null;
  }
}

export function useNotificationText() {
  const t = useTranslations('notifications.kinds');
  const ts = useTranslations('security.status');
  return (n: AppNotification): string => {
    switch (n.kind) {
      case 'sharing.invitation_received':
        return t('invitationReceived', { name: String(n.data.inviter_name ?? '') });
      case 'sharing.invitation_accepted':
        return t('invitationAccepted', { name: String(n.data.accepted_by_name ?? '') });
      case 'sharing.access_revoked':
        return t('accessRevoked');
      case 'security.warning':
        return t('securityWarning', { status: n.data.security_status ? ts(n.data.security_status) : '' });
      case 'processing.failed':
        return t('processingFailed');
      case 'account.password_changed':
        return t('passwordChanged');
      default:
        return t('generic');
    }
  };
}

export function NotificationItem({ notification, className }: { notification: AppNotification; className?: string }) {
  const locale = useLocale();
  const text = useNotificationText();
  const Icon = ICONS[notification.kind] ?? Bell;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
          notification.kind.startsWith('security') || notification.kind.startsWith('processing')
            ? 'bg-warning-soft text-warning-foreground'
            : 'bg-brand-soft text-brand-soft-foreground',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', !notification.read && 'font-medium')}>{text(notification)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(notification.created_at, locale)}</p>
      </div>
      {!notification.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-hidden />}
    </div>
  );
}
