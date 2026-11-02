'use client';

import { Bell, Bookmark, FolderOpen, Globe2, Library, Mail, Plus, Search, Users, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { LinkCard } from '@/components/links/link-card';
import { ProcessingBadge } from '@/components/links/status-badges';
import { LinkFavicon } from '@/components/common/link-favicon';
import { useAddLink } from '@/components/links/add-link-provider';
import { useGlobalSearch } from '@/components/search/global-search';
import { sharingApi, collectionsApi } from '@/lib/api/endpoints';
import { useLinksCount, useLinksList } from '@/hooks/use-links';
import { useReceivedInvitations } from '@/hooks/use-sharing';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useSession } from '@/hooks/use-session';
import { formatNumber } from '@/lib/format';
import { isProcessing } from '@/lib/link-status';

function Stat({ label, value, icon: Icon, href, loading }: { label: string; value: number | undefined; icon: LucideIcon; href: string; loading: boolean }) {
  const locale = useLocale();
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-4 shadow-xs transition-colors hover:border-ring/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {loading ? <Skeleton className="h-8 w-12" /> : value === undefined ? '—' : formatNumber(value, locale)}
      </div>
    </Link>
  );
}

/** Dashboard home. Every number comes from the API (pagination totals); nothing is estimated. */
export function DashboardOverview() {
  const t = useTranslations('dashboard');
  const { user } = useSession();
  const addLink = useAddLink();
  const search = useGlobalSearch();
  const total = useLinksCount({});
  const favorites = useLinksCount({ favorite: true });
  const publicCount = useLinksCount({ visibility: 'PUBLIC' });
  const collections = useQuery({
    queryKey: ['collections', 'count'],
    queryFn: () => collectionsApi.list(1, 1),
    select: (p) => p.pagination.total ?? p.items.length,
  });
  const shared = useQuery({
    queryKey: ['sharing', 'count'],
    queryFn: () => sharingApi.sharedWithMe({ per_page: 1 }),
    select: (p) => p.pagination.total ?? p.items.length,
  });
  const unread = useUnreadCount();
  const recent = useLinksList({ sort: 'latest', per_page: 6 });
  const invitations = useReceivedInvitations();

  const inFlight = (recent.data?.items ?? []).filter(
    (l) => isProcessing(l.processing_status) || l.processing_status === 'FAILED' || l.processing_status === 'PARTIAL',
  );
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingAfternoon') : t('greetingEvening');

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{user?.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => addLink.open()}>
            <Plus aria-hidden /> {t('quick.addLink')}
          </Button>
          <Button variant="outline" onClick={search.open}>
            <Search aria-hidden /> {t('quick.search')}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/collections?new=1">
              <FolderOpen aria-hidden /> {t('quick.newCollection')}
            </Link>
          </Button>
        </div>
      </div>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          {t('statsTitle')}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label={t('stats.links')} value={total.data} icon={Library} href="/dashboard/links" loading={total.isPending} />
          <Stat label={t('stats.favorites')} value={favorites.data} icon={Bookmark} href="/dashboard/favorites" loading={favorites.isPending} />
          <Stat label={t('stats.public')} value={publicCount.data} icon={Globe2} href="/dashboard/links?visibility=PUBLIC" loading={publicCount.isPending} />
          <Stat label={t('stats.collections')} value={collections.data} icon={FolderOpen} href="/dashboard/collections" loading={collections.isPending} />
          <Stat label={t('stats.shared')} value={shared.data} icon={Users} href="/dashboard/shared" loading={shared.isPending} />
          <Stat label={t('stats.unread')} value={unread} icon={Bell} href="/dashboard/notifications" loading={false} />
        </div>
      </section>

      {(invitations.data?.items.length ?? 0) > 0 && (
        <Card className="border-brand-soft-foreground/20 bg-brand-soft/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-primary" aria-hidden /> {t('invitationsTitle', { count: invitations.data!.items.length })}
            </CardTitle>
            <CardDescription>{t('invitationsBody')}</CardDescription>
            <CardAction>
              <Button asChild size="sm">
                <Link href="/dashboard/shared?tab=invitations">{t('review')}</Link>
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <section aria-labelledby="recent-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-heading" className="text-lg font-semibold">
              {t('recentTitle')}
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/links">
                {t('viewAll')} <ArrowRight className="rtl-flip" aria-hidden />
              </Link>
            </Button>
          </div>
          {recent.isError ? (
            <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
          ) : recent.isPending ? (
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recent.data.items.length === 0 ? (
            <EmptyState
              icon={Library}
              title={t('emptyTitle')}
              description={t('emptyBody')}
              action={
                <Button onClick={() => addLink.open()}>
                  <Plus aria-hidden /> {t('quick.addLink')}
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-2">
              {recent.data.items.map((link) => (
                <li key={link.public_id}>
                  <LinkCard link={link} view="list" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside aria-labelledby="processing-heading" className="grid h-fit gap-4">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle id="processing-heading" className="text-base">
                {t('processingTitle')}
              </CardTitle>
              <CardDescription>{t('processingBody')}</CardDescription>
            </CardHeader>
            <CardContent>
              {recent.isPending ? (
                <Skeleton className="h-16" />
              ) : inFlight.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('processingIdle')}</p>
              ) : (
                <ul className="grid gap-2">
                  {inFlight.map((l) => (
                    <li key={l.public_id}>
                      <Link href={`/dashboard/links/${l.public_id}`} className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent">
                        <LinkFavicon src={l.favicon_url} />
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        <ProcessingBadge status={l.processing_status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="gap-3">
            <CardHeader>
              <CardTitle className="text-base">{t('tipsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid list-disc gap-2 ps-5 text-sm text-muted-foreground">
                <li>{t('tips.search')}</li>
                <li>{t('tips.security')}</li>
                <li>{t('tips.collections')}</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
