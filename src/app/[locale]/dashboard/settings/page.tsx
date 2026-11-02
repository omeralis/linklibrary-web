import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SettingsView } from '@/components/settings/settings-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/settings'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('settings') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/settings'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsView />
    </Suspense>
  );
}
