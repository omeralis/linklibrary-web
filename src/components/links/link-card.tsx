'use client';

import * as React from 'react';
import { Star, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkFavicon } from '@/components/common/link-favicon';
import { RemoteImage } from '@/components/common/remote-image';
import type { AnyLink, OwnedLink } from '@/lib/api/types';
import { isOwnedLink, isViewerLink } from '@/lib/api/types';
import { categoryName, formatRelative } from '@/lib/format';
import { isProcessing, linkHref } from '@/lib/link-status';
import { useToggleFavorite } from '@/hooks/use-links';
import { useErrorMessage } from '@/hooks/use-error-message';
import { cn } from '@/lib/utils';
import { safeImageUrl } from '@/lib/url';
import { ProcessingBadge, SecurityBadge, VisibilityBadge } from './status-badges';
import { LinkActionsMenu } from './link-actions-menu';

export type LinkView = 'grid' | 'list';

function FavoriteButton({ link }: { link: OwnedLink }) {
  const t = useTranslations('links.actions');
  const toggle = useToggleFavorite();
  const errorMessage = useErrorMessage();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={link.is_favorite}
      aria-label={link.is_favorite ? t('unfavorite') : t('favorite')}
      onClick={() => toggle.mutate({ id: link.public_id, favorite: !link.is_favorite }, { onError: (e) => toast.error(errorMessage(e)) })}
    >
      <Star className={cn(link.is_favorite && 'fill-warning text-warning')} aria-hidden />
    </Button>
  );
}

function hrefFor(link: AnyLink, publicContext: boolean) {
  return publicContext ? `/l/${link.public_id}` : linkHref(link);
}

function Thumbnail({ link, className, compact = false }: { link: AnyLink; className?: string; compact?: boolean }) {
  const fallback = compact ? (
    <div className={cn('flex size-full items-center justify-center bg-gradient-to-br from-muted to-brand-soft/60', className)}>
      <LinkFavicon src={link.favicon_url} className="size-5" />
    </div>
  ) : (
    <div className={cn('flex size-full items-center justify-center bg-gradient-to-br from-muted to-brand-soft/60', className)}>
      <span className="flex items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs" dir="ltr">
        <LinkFavicon src={link.favicon_url} />
        {link.hostname}
      </span>
    </div>
  );
  return <RemoteImage src={link.image_url} className={cn('size-full', className)} fallback={fallback} />;
}

function Meta({ link }: { link: AnyLink }) {
  const locale = useLocale();
  const date = isOwnedLink(link) ? link.created_at : link.published_at;
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <LinkFavicon src={link.favicon_url} />
      <span className="truncate" dir="ltr">
        {link.site_name || link.hostname}
      </span>
      {date && (
        <>
          <span aria-hidden>·</span>
          <time dateTime={date} className="shrink-0">
            {formatRelative(date, locale)}
          </time>
        </>
      )}
    </div>
  );
}

function StatusRow({ link }: { link: AnyLink }) {
  const locale = useLocale();
  const t = useTranslations('links');
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isOwnedLink(link) && <ProcessingBadge status={link.processing_status} />}
      <SecurityBadge status={link.security.status} hideWhenClear />
      {isOwnedLink(link) && link.visibility === 'PUBLIC' && <VisibilityBadge visibility="PUBLIC" />}
      {isViewerLink(link) && link.shared_by && (
        <Badge variant="info">
          <Users aria-hidden />
          {t('sharedBy', { name: link.shared_by })}
        </Badge>
      )}
      {link.category && <Badge variant="outline">{categoryName(link.category, locale)}</Badge>}
    </div>
  );
}

export function LinkCard({
  link,
  view = 'grid',
  trashed = false,
  publicContext = false,
}: {
  link: AnyLink;
  view?: LinkView;
  trashed?: boolean;
  publicContext?: boolean;
}) {
  const owned = !publicContext && isOwnedLink(link) ? link : null;
  const href = hrefFor(link, publicContext);
  const busy = owned ? isProcessing(owned.processing_status) : false;

  if (view === 'list') {
    return (
      <article
        className="group relative flex items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-xs transition-colors hover:border-ring/40"
        aria-busy={busy}
      >
        <div className="hidden size-14 shrink-0 overflow-hidden rounded-md border bg-muted sm:block">
          <Thumbnail link={link} compact />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-sm font-medium">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              <bdi>{link.title}</bdi>
            </Link>
          </h3>
          <Meta link={link} />
        </div>
        <div className="relative z-10 hidden max-w-[40%] md:block">
          <StatusRow link={link} />
        </div>
        {owned && (
          <div className="relative z-10 flex shrink-0 items-center">
            {!trashed && <FavoriteButton link={owned} />}
            <LinkActionsMenu link={owned} trashed={trashed} />
          </div>
        )}
      </article>
    );
  }

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-ring/40 hover:shadow-sm"
      aria-busy={busy}
    >
      <CardMedia src={link.image_url} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Meta link={link} />
        <h3 className="line-clamp-2 leading-snug font-semibold">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            <bdi>{link.title}</bdi>
          </Link>
        </h3>
        {link.description && <p className="line-clamp-2 text-sm text-muted-foreground"><bdi>{link.description}</bdi></p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="relative z-10 min-w-0">
            <StatusRow link={link} />
            {link.tags.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {link.tags.slice(0, 4).map((tag) => (
                  <li key={tag.slug} className="text-xs text-muted-foreground">
                    <bdi>#{tag.name}</bdi>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {owned && (
            <div className="relative z-10 -me-2 -mb-1 flex shrink-0 items-center">
              {!trashed && <FavoriteButton link={owned} />}
              <LinkActionsMenu link={owned} trashed={trashed} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Grid media: a 2:1 preview when the page has an image (object-cover, never stretched); otherwise
 * nothing, so image-less cards stay compact instead of showing an empty placeholder.
 */
export function CardMedia({ src }: { src: string | null | undefined }) {
  const [failed, setFailed] = React.useState(false);
  const url = safeImageUrl(src);
  if (url && !failed) {
    return (
      <div className="aspect-[2/1] overflow-hidden border-b bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- third-party preview images */}
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
      </div>
    );
  }
  // No (working) image: no placeholder band — the card's meta line already shows the source.
  return null;
}

export function LinkCardSkeleton({ view = 'grid' }: { view?: LinkView }) {
  if (view === 'list') {
    return (
      <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3">
        <Skeleton className="hidden size-14 sm:block" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function LinkGrid({
  links,
  view,
  loading,
  trashed,
  publicContext,
  skeletonCount = 6,
}: {
  links?: AnyLink[];
  view: LinkView;
  loading?: boolean;
  trashed?: boolean;
  publicContext?: boolean;
  skeletonCount?: number;
}) {
  // auto-fill keeps cards at a comfortable width whether there is one link or hundreds.
  const cls = view === 'grid' ? 'grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,17.5rem),1fr))]' : 'flex flex-col gap-2';
  if (loading) {
    return (
      <div className={cls} aria-busy>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <LinkCardSkeleton key={i} view={view} />
        ))}
      </div>
    );
  }
  return (
    <ul className={cls}>
      {(links ?? []).map((link) => (
        <li key={link.public_id} className={view === 'grid' ? 'flex' : undefined}>
          <div className="w-full">
            <LinkCard link={link} view={view} trashed={trashed} publicContext={publicContext} />
          </div>
        </li>
      ))}
    </ul>
  );
}
