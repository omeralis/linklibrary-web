import type { Metadata } from 'next';
import { CalendarDays, FolderOpen, Link2, UserX } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { PublicLinkCard } from '@/components/public/public-link-card';
import { PublicPagination } from '@/components/public/public-pagination';
import { PublicError } from '@/components/public/public-error';
import { CollectionCard } from '@/components/collections/collection-card';
import { UserAvatar } from '@/components/layout/user-avatar';
import { serverPublicApi, settle } from '@/lib/api/server';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const USERNAME = /^[a-z0-9_]{3,30}$/;

export async function generateMetadata({ params }: PageProps<'/[locale]/u/[username]'>): Promise<Metadata> {
  const { locale, username } = await params;
  const t = await getTranslations({ locale, namespace: 'profilePage' });
  const name = decodeURIComponent(username).toLowerCase();
  if (!USERNAME.test(name)) return { title: t('unavailableTitle'), robots: { index: false } };
  const res = await settle(serverPublicApi.user(locale, name));
  if (!res.data) return { title: t('unavailableTitle'), robots: { index: false } };
  return {
    title: t('metaTitle', { name: res.data.name, username: res.data.username }),
    description: res.data.bio ?? undefined,
    alternates: { canonical: `/${locale}/u/${name}`, languages: { ar: `/ar/u/${name}`, en: `/en/u/${name}` } },
  };
}

export default async function ProfilePage({ params, searchParams }: PageProps<'/[locale]/u/[username]'>) {
  const { locale, username: raw } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('profilePage');
  const sp = await searchParams;
  const username = decodeURIComponent(raw).toLowerCase();
  const tab = sp.tab === 'collections' ? 'collections' : 'links';
  const page = Math.max(1, Number.parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);

  const user = USERNAME.test(username) ? await settle(serverPublicApi.user(locale, username)) : null;
  if (!user || (user.error && user.error.status === 404)) {
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState icon={UserX} title={t('unavailableTitle')} description={t('unavailableBody')} />
      </div>
    );
  }
  if (user.error) {
    return (
      <div className="container-page max-w-2xl py-16">
        <PublicError code={user.error.code} status={user.error.status} />
      </div>
    );
  }
  const profile = user.data;
  const [links, collections] = await Promise.all([
    tab === 'links' ? settle(serverPublicApi.userLinks(locale, username, { page, per_page: 24 })) : null,
    tab === 'collections' ? settle(serverPublicApi.userCollections(locale, username, page)) : null,
  ]);

  const tabClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
      active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
    );

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center">
        <UserAvatar name={profile.name} src={profile.avatar_url} className="size-20 text-xl" />
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{profile.name}</h1>
          <p className="text-muted-foreground" dir="ltr">
            @{profile.username}
          </p>
          {profile.bio && <p className="mt-3 max-w-2xl text-pretty">{profile.bio}</p>}
          <ul className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Link2 className="size-4" aria-hidden />{' '}
              {t('links', { count: profile.stats.public_links, formatted: formatNumber(profile.stats.public_links, locale) })}
            </li>
            <li className="flex items-center gap-1.5">
              <FolderOpen className="size-4" aria-hidden />{' '}
              {t('collections', { count: profile.stats.public_collections, formatted: formatNumber(profile.stats.public_collections, locale) })}
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> {t('joined', { date: formatDate(profile.joined_at, locale, { year: 'numeric', month: 'long' }) })}
            </li>
          </ul>
        </div>
      </header>

      <nav aria-label={t('tabsLabel')} className="mb-6 flex gap-6 border-b">
        <Link href={`/u/${username}`} className={tabClass(tab === 'links')} aria-current={tab === 'links' ? 'page' : undefined}>
          <Link2 className="size-4" aria-hidden /> {t('tabLinks')}
        </Link>
        <Link href={`/u/${username}?tab=collections`} className={tabClass(tab === 'collections')} aria-current={tab === 'collections' ? 'page' : undefined}>
          <FolderOpen className="size-4" aria-hidden /> {t('tabCollections')}
        </Link>
      </nav>

      {tab === 'links' &&
        links &&
        (links.error ? (
          <PublicError code={links.error.code} status={links.error.status} />
        ) : links.data.items.length === 0 ? (
          <EmptyState icon={Link2} title={t('noLinks')} />
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {links.data.items.map((link) => (
                <li key={link.public_id}>
                  <PublicLinkCard link={link} />
                </li>
              ))}
            </ul>
            <PublicPagination pagination={links.data.pagination} basePath={`/u/${username}`} query={{}} />
          </>
        ))}
      {tab === 'collections' &&
        collections &&
        (collections.error ? (
          <PublicError code={collections.error.code} status={collections.error.status} />
        ) : collections.data.items.length === 0 ? (
          <EmptyState icon={FolderOpen} title={t('noCollections')} />
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.data.items.map((c) => (
                <li key={c.public_id}>
                  <CollectionCard collection={c} href={`/c/${c.public_id}`} />
                </li>
              ))}
            </ul>
            <PublicPagination pagination={collections.data.pagination} basePath={`/u/${username}`} query={{ tab: 'collections' }} />
          </>
        ))}
    </div>
  );
}
