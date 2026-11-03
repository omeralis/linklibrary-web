'use client';

import { Globe2, Lock, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/layout/user-avatar';
import type { OwnedLink, User } from '@/lib/api/types';
import { publishRestriction, shareRestriction } from '@/lib/link-status';
import { useSetResharing, useSetVisibility } from '@/hooks/use-links';
import { useErrorMessage } from '@/hooks/use-error-message';
import { InviteForm } from './invite-form';
import { InvitationsList } from './invitations-list';
import { AccessGraph } from './access-graph';

/**
 * Visibility + private sharing for the owner. Publishing and sharing are enabled only when the backend
 * says so (`permissions.can_publish` / `can_share`, i.e. security status CLEAR) and the e-mail is verified;
 * otherwise the controls are disabled with the reason spelled out.
 */
export function OwnerSharingPanel({ link, user }: { link: OwnedLink; user: User }) {
  const t = useTranslations('sharing');
  const tr = useTranslations('links.restrictions');
  const errorMessage = useErrorMessage();
  const visibility = useSetVisibility(link.public_id);
  const resharing = useSetResharing(link.public_id);
  const isPublic = link.visibility === 'PUBLIC';
  const publishBlocked = publishRestriction(link, user.email_verified);
  const shareBlocked = shareRestriction(link, user.email_verified);
  // Making a public link private is always allowed.
  const visibilityDisabled = visibility.isPending || (!isPublic && !!publishBlocked);
  // When publishing and sharing are blocked for the same reason, explain it once above both sections.
  const sharedReason = !isPublic && publishBlocked && publishBlocked === shareBlocked ? publishBlocked : null;

  // Temporary policy: UNKNOWN links may circulate, but everyone is told they were not security-verified.
  const unverifiedNotice = !link.security.verified && link.security.status === 'UNKNOWN' && (link.permissions.can_publish || link.permissions.can_share);

  return (
    <div className="grid gap-6">
      {unverifiedNotice && (
        <Alert variant="warning" data-testid="unverified-sharing-warning">
          <ShieldAlert aria-hidden />
          <AlertDescription>{t('unverifiedWarning')}</AlertDescription>
        </Alert>
      )}
      {sharedReason && (
        <Alert variant="warning" data-testid="sharing-restriction">
          <ShieldAlert aria-hidden />
          <AlertDescription>{tr(sharedReason)}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPublic ? <Globe2 className="size-4 text-primary" aria-hidden /> : <Lock className="size-4" aria-hidden />}
            {t('visibility.title')}
          </CardTitle>
          <CardDescription>{t('visibility.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="visibility-switch" className="text-sm">
                {t('visibility.publicLabel')}
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">{isPublic ? t('visibility.publicOn') : t('visibility.publicOff')}</p>
            </div>
            <Switch
              id="visibility-switch"
              checked={isPublic}
              disabled={visibilityDisabled}
              onCheckedChange={(checked) =>
                visibility.mutate(checked ? 'PUBLIC' : 'PRIVATE', {
                  onSuccess: (r) => toast.success(r.message ?? t('visibility.updated')),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            />
          </div>
          {!isPublic && publishBlocked && !sharedReason && (
            <Alert variant="warning">
              <ShieldAlert aria-hidden />
              <AlertDescription>{tr(publishBlocked)}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('private.title')}</CardTitle>
          <CardDescription>{t('private.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {shareBlocked && !sharedReason && (
            <Alert variant="warning">
              <ShieldAlert aria-hidden />
              <AlertDescription>{tr(shareBlocked)}</AlertDescription>
            </Alert>
          )}
          <InviteForm linkId={link.public_id} disabled={!!shareBlocked} />
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="reshare-switch">{t('private.allowResharing')}</Label>
              <p className="mt-1 text-sm text-muted-foreground">{shareBlocked ? t('private.allowResharingBlocked') : t('private.allowResharingHint')}</p>
            </div>
            <Switch
              id="reshare-switch"
              checked={link.allow_resharing}
              disabled={resharing.isPending || !!shareBlocked}
              onCheckedChange={(checked) =>
                resharing.mutate(checked, { onSuccess: () => toast.success(t('private.resharingUpdated')), onError: (e) => toast.error(errorMessage(e)) })
              }
            />
          </div>
          <Separator />
          <section aria-labelledby="access-heading" className="grid gap-3">
            <h3 id="access-heading" className="text-sm font-semibold">
              {t('access.title')}
            </h3>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2" data-testid="owner-row">
              <UserAvatar name={user.name} src={user.avatar_url} className="size-7" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{t('access.you', { name: user.name })}</p>
              <Badge variant="brand">{t('access.ownerRole')}</Badge>
            </div>
            <AccessGraph linkId={link.public_id} isOwner />
          </section>
          <Separator />
          <section aria-labelledby="invitations-heading" className="grid gap-3">
            <h3 id="invitations-heading" className="text-sm font-semibold">
              {t('invitations.title')}
            </h3>
            <InvitationsList linkId={link.public_id} />
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
