'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ErrorState } from '@/components/common/error-state';
import type { Invitation } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { useInvitations, useSharingMutations } from '@/hooks/use-sharing';
import { useErrorMessage } from '@/hooks/use-error-message';

const STATUS_VARIANT = { PENDING: 'info', ACCEPTED: 'success', REVOKED: 'muted', EXPIRED: 'warning' } as const;

export function InvitationsList({ linkId }: { linkId: string }) {
  const t = useTranslations('sharing.invitations');
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const list = useInvitations(linkId);
  const { revokeInvitation } = useSharingMutations(linkId);
  const [target, setTarget] = React.useState<Invitation | null>(null);

  if (list.isPending) return <Skeleton className="h-24" />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} compact />;
  if (list.data.items.length === 0) return <p className="text-sm text-muted-foreground">{t('empty')}</p>;

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {list.data.items.map((inv) => (
          <li key={inv.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" dir="ltr">
                {inv.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {inv.invited_by && t('invitedBy', { name: inv.invited_by.name })}
                {inv.status === 'PENDING' && inv.expires_at && ` · ${t('expires', { date: formatDate(inv.expires_at, locale) })}`}
                {inv.via_reshare && ` · ${t('viaReshare')}`}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[inv.status]}>{t(`status.${inv.status}`)}</Badge>
            {inv.status === 'PENDING' && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setTarget(inv)}>
                {t('revoke')}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        title={t('revokeTitle')}
        description={target ? t('revokeBody', { email: target.email }) : undefined}
        confirmLabel={t('revoke')}
        onConfirm={() =>
          revokeInvitation.mutateAsync(target!.id, {
            onSuccess: (r) => toast.success(r.message ?? t('revoked')),
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </>
  );
}
