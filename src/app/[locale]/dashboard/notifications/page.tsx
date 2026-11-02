import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { NotificationsView } from '@/components/notifications/notifications-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/notifications'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('notifications') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/notifications'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotificationsView />
    </Suspense>
  );
}
