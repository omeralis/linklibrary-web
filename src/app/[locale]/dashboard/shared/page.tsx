import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SharedView } from '@/components/sharing/shared-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/shared'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('shared') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/shared'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SharedView />
    </Suspense>
  );
}
