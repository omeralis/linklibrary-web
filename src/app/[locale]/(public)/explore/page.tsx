import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Compass } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ExploreFilters } from '@/components/public/explore-filters';
import { PublicLinkCard } from '@/components/public/public-link-card';
import { PublicPagination } from '@/components/public/public-pagination';
import { PublicError } from '@/components/public/public-error';
import { EmptyState } from '@/components/common/empty-state';
import { serverPublicApi, settle } from '@/lib/api/server';
import type { Category, PublicListParams, SourceType } from '@/lib/api/types';
import { SOURCE_TYPES } from '@/lib/validation/schemas';

export async function generateMetadata({ params }: PageProps<'/[locale]/explore'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explore' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: `/${locale}/explore`, languages: { ar: '/ar/explore', en: '/en/explore' } },
  };
}

const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);

export default async function ExplorePage({ params, searchParams }: PageProps<'/[locale]/explore'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('explore');

  const q = str(sp.q)?.trim();
  const sourceType = str(sp.source_type);
  const language = str(sp.language);
  const sort = str(sp.sort);
  const query: PublicListParams = {
    q: q && q.length >= 2 ? q.slice(0, 200) : undefined,
    category: str(sp.category),
    tag: str(sp.tag),
    source_type: SOURCE_TYPES.includes(sourceType as SourceType) ? (sourceType as SourceType) : undefined,
    language: language === 'ar' || language === 'en' ? language : undefined,
    sort: sort === 'popular' || sort === 'relevance' || sort === 'latest' ? sort : undefined,
    page: Math.min(500, Math.max(1, Number.parseInt(str(sp.page) ?? '1', 10) || 1)),
    per_page: 24,
  };

  // Public full-text search when a query is present, otherwise the filtered public feed.
  const [links, categories] = await Promise.all([
    settle(query.q ? serverPublicApi.search(locale, { ...query, q: query.q }) : serverPublicApi.links(locale, query)),
    settle(serverPublicApi.categories(locale)),
  ]);

  return (
    <div className="container-page py-10 md:py-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Compass className="size-7 text-primary" aria-hidden /> {t('title')}
        </h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </header>
      <Suspense>
        <ExploreFilters categories={(categories.data as Category[] | null) ?? []} />
      </Suspense>
      <section aria-live="polite" className="mt-8">
        {links.error ? (
          <PublicError code={links.error.code} status={links.error.status} />
        ) : links.data.items.length === 0 ? (
          <EmptyState icon={Compass} title={query.q ? t('noResults') : t('emptyTitle')} description={query.q ? t('noResultsBody') : t('emptyBody')} />
        ) : (
          <>
            {links.data.pagination.total !== undefined && (
              <p className="mb-4 text-sm text-muted-foreground">{t('count', { count: links.data.pagination.total })}</p>
            )}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {links.data.items.map((link) => (
                <li key={link.public_id}>
                  <PublicLinkCard link={link} />
                </li>
              ))}
            </ul>
            <PublicPagination
              pagination={links.data.pagination}
              basePath="/explore"
              query={{ q: query.q, category: query.category, tag: query.tag, source_type: query.source_type, language: query.language, sort: query.sort }}
            />
          </>
        )}
      </section>
    </div>
  );
}
