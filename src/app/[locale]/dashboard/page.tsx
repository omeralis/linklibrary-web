import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DashboardOverview } from '@/components/dashboard/overview';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('dashboard') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardOverview />
    </Suspense>
  );
}
