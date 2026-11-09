import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ShareReceiver } from '@/components/links/share-receiver';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/share'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'links.share' });
  return { title: t('metaTitle') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/share'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ShareReceiver />
    </Suspense>
  );
}
