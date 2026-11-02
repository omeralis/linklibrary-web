import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SearchView } from '@/components/search/search-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/search'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('search') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/search'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchView />
    </Suspense>
  );
}
