import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CollectionsView } from '@/components/collections/collections-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/collections'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('collections') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/collections'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CollectionsView />
    </Suspense>
  );
}
