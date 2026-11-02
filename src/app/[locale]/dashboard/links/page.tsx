import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LinkLibraryView } from '@/components/links/link-library-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/links'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('library') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/links'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LinkLibraryView />
    </Suspense>
  );
}
