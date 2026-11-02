import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminView } from '@/components/admin/admin-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/admin'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('admin') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/admin'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminView />
    </Suspense>
  );
}
