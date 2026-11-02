'use client';

import * as React from 'react';
import { ArrowLeft, Lock, Settings2, Share2, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkFavicon } from '@/components/common/link-favicon';
import { RemoteImage } from '@/components/common/remote-image';
import { OpenLinkButton } from '@/components/links/open-link-button';
import { SecurityBadge } from '@/components/links/status-badges';
import { AiPanel } from '@/components/links/ai-panel';
import { InviteForm } from '@/components/sharing/invite-form';
import { AccessGraph } from '@/components/sharing/access-graph';
import { UserAvatar } from '@/components/layout/user-avatar';
import { ErrorState } from '@/components/common/error-state';
import type { AnyLink, PublicLink } from '@/lib/api/types';
import { isOwnedLink, isViewerLink } from '@/lib/api/types';
import { categoryName, formatDate } from '@/lib/format';
import { useLink } from '@/hooks/use-links';
import { useSession } from '@/hooks/use-session';
import { isApiError } from '@/lib/api/errors';

/**
 * /l/{id}. The server renders the public representation (SEO); when the visitor is signed in the
 * client asks GET /links/{id}, which returns the owner/viewer representation the caller is entitled to.
 * A private link that is not shared with the visitor stays "not available" (same 404 as non-existent).
 */
export function LinkPageView({ id, initial }: { id: string; initial: PublicLink | null }) {
  const t = useTranslations('linkPage');
  const { user, status } = useSession();
  const authed = useLink(id, status === 'authenticated');
  const link: AnyLink | null = authed.data ?? initial;

  if (!link) {
    if (status === 'loading' || (status === 'authenticated' && authed.isPending)) {
      return (
        <div className="container-page max-w-4xl space-y-4 py-12" aria-busy>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-64" />
        </div>
      );
    }
    if (authed.isError && !(isApiError(authed.error) && authed.error.status === 404)) {
      return (
        <div className="container-page max-w-2xl py-16">
          <ErrorState error={authed.error} onRetry={() => authed.refetch()} />
        </div>
      );
    }
    return (
      <div className="container-page max-w-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold">{t('unavailableTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('unavailableBody')}</p>
        <div className="mt-6 flex justify-center gap-2">
          {!user && (
            <Button asChild>
              <Link href={`/login?next=${encodeURIComponent(`/l/${id}`)}`}>{t('signIn')}</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/explore">{t('explore')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <LinkContent link={link} />;
}

function LinkContent({ link }: { link: AnyLink }) {
  const t = useTranslations('linkPage');
  const ts = useTranslations('links.sourceTypes');
  const locale = useLocale();
  const owned = isOwnedLink(link);
  const viewer = isViewerLink(link) ? link : null;

  return (
    <article className="container-page max-w-5xl py-10 md:py-14">
      <Button asChild variant="ghost" size="sm" className="-ms-2 mb-6 text-muted-foreground">
        <Link href={viewer ? '/dashboard/shared' : owned ? '/dashboard/links' : '/explore'}>
          <ArrowLeft className="rtl-flip" aria-hidden /> {viewer ? t('backShared') : owned ? t('backLibrary') : t('backExplore')}
        </Link>
      </Button>

      {owned && (
        <Alert variant="info" className="mb-6">
          <Settings2 aria-hidden />
          <AlertTitle>{t('ownerTitle')}</AlertTitle>
          <AlertDescription>
            <p>{link.visibility === 'PUBLIC' ? t('ownerPublic') : t('ownerPrivate')}</p>
            <Button asChild size="sm" variant="outline" className="mt-2 bg-card/70">
              <Link href={`/dashboard/links/${link.public_id}`}>{t('manage')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {viewer && (
        <Alert variant="info" className="mb-6">
          <Users aria-hidden />
          <AlertTitle>{viewer.shared_by ? t('sharedBy', { name: viewer.shared_by }) : t('sharedWithYou')}</AlertTitle>
          <AlertDescription>
            {t('readOnly')} {viewer.permissions.can_reshare ? t('canReshare') : t('noReshare')}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <LinkFavicon src={link.favicon_url} />
            <span dir="ltr" className="truncate">
              {link.site_name || link.hostname}
            </span>
          </div>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance break-words"><bdi>{link.title}</bdi></h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <OpenLinkButton link={link} variant="default" size="default" label={t('visit')} />
            <SecurityBadge status={link.security.status} />
            {link.category && <Badge variant="outline">{categoryName(link.category, locale)}</Badge>}
            <Badge variant="muted">{ts(link.source_type)}</Badge>
          </div>
          {link.image_url && (
            <div className="mt-8 aspect-[1.91/1] overflow-hidden rounded-xl border bg-muted">
              <RemoteImage src={link.image_url} alt="" className="size-full" />
            </div>
          )}
          {link.description && <p className="mt-6 text-lg leading-relaxed text-pretty"><bdi>{link.description}</bdi></p>}
          {link.tags.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {link.tags.map((tag) => (
                <li key={tag.slug}>
                  <Link href={`/explore?tag=${encodeURIComponent(tag.slug)}`} className="rounded-full border bg-card px-3 py-1 text-sm hover:bg-accent">
                    <bdi>#{tag.name}</bdi>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8">
            <AiPanel link={link} />
          </div>
        </div>
        <aside className="grid h-fit gap-6">
          {link.owner && (
            <Card className="gap-3 py-4">
              <CardContent className="flex items-center gap-3 px-4">
                <UserAvatar name={link.owner.name} src={link.owner.avatar_url} className="size-10" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t('savedBy')}</p>
                  <Link href={`/u/${link.owner.username}`} className="block truncate font-medium hover:underline">
                    {link.owner.name}
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="gap-2 py-4">
            <CardContent className="grid gap-2 px-4 text-sm">
              {link.author && (
                <p>
                  <span className="text-muted-foreground">{t('author')}: </span>
                  {link.author}
                </p>
              )}
              {link.source_published_at && (
                <p>
                  <span className="text-muted-foreground">{t('publishedAtSource')}: </span>
                  {formatDate(link.source_published_at, locale)}
                </p>
              )}
              {link.published_at && (
                <p>
                  <span className="text-muted-foreground">{t('sharedOn')}: </span>
                  {formatDate(link.published_at, locale)}
                </p>
              )}
              {link.language && (
                <p>
                  <span className="text-muted-foreground">{t('language')}: </span>
                  {link.language.toUpperCase()}
                </p>
              )}
            </CardContent>
          </Card>
          {viewer?.permissions.can_reshare && (
            <Card className="gap-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Share2 className="size-4" aria-hidden /> {t('reshareTitle')}
                </CardTitle>
                <CardDescription>{t('reshareBody')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <InviteForm linkId={viewer.public_id} disabled={viewer.security.status !== 'CLEAR'} />
                {viewer.security.status !== 'CLEAR' && <p className="text-xs text-muted-foreground">{t('reshareBlocked')}</p>}
                <AccessGraph linkId={viewer.public_id} isOwner={false} />
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </article>
  );
}
