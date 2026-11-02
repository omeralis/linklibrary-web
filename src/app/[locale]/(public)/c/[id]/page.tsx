import type { Metadata } from 'next';
import { FolderOpen } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { PublicLinkCard } from '@/components/public/public-link-card';
import { PublicPagination } from '@/components/public/public-pagination';
import { PublicError } from '@/components/public/public-error';
import { UserAvatar } from '@/components/layout/user-avatar';
import { serverPublicApi, settle } from '@/lib/api/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<'/[locale]/c/[id]'>): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'publicCollection' });
  if (!UUID.test(id)) return { title: t('unavailableTitle'), robots: { index: false } };
  const res = await settle(serverPublicApi.collection(locale, id));
  const c = res.data?.meta.collection;
  if (!c) return { title: t('unavailableTitle'), robots: { index: false } };
  return {
    title: c.name,
    description: c.description ?? undefined,
    alternates: { canonical: `/${locale}/c/${id}`, languages: { ar: `/ar/c/${id}`, en: `/en/c/${id}` } },
  };
}

export default async function PublicCollectionPage({ params, searchParams }: PageProps<'/[locale]/c/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('publicCollection');
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof sp.page === 'string' ? sp.page : '1', 10) || 1);
  const res = UUID.test(id) ? await settle(serverPublicApi.collection(locale, id, page)) : null;

  if (!res || (res.error && res.error.status === 404)) {
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState icon={FolderOpen} title={t('unavailableTitle')} description={t('unavailableBody')} />
      </div>
    );
  }
  if (res.error) {
    return (
      <div className="container-page max-w-2xl py-16">
        <PublicError code={res.error.code} status={res.error.status} />
      </div>
    );
  }
  const { items, pagination, meta } = res.data;
  const collection = meta.collection;

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
          <FolderOpen className="size-4" aria-hidden /> {t('eyebrow')}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{collection.name}</h1>
        {collection.description && <p className="mt-3 text-muted-foreground">{collection.description}</p>}
        {collection.owner && (
          <Link href={`/u/${collection.owner.username}`} className="mt-4 inline-flex items-center gap-2 text-sm hover:underline">
            <UserAvatar name={collection.owner.name} src={collection.owner.avatar_url} className="size-6" />
            {t('by', { name: collection.owner.name })}
          </Link>
        )}
      </header>
      {items.length === 0 ? (
        <EmptyState icon={FolderOpen} title={t('emptyTitle')} description={t('emptyBody')} />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((link) => (
              <li key={link.public_id}>
                <PublicLinkCard link={link} />
              </li>
            ))}
          </ul>
          <PublicPagination pagination={pagination} basePath={`/c/${id}`} query={{}} />
        </>
      )}
    </div>
  );
}
