import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CollectionDetailView } from '@/components/collections/collection-detail-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/collections/[id]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('collectionDetail') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/collections/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CollectionDetailView id={id} />
    </Suspense>
  );
}
