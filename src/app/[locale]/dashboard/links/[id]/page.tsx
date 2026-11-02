import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/common/page-skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LinkDetailView } from '@/components/links/link-detail-view';

export async function generateMetadata({ params }: PageProps<'/[locale]/dashboard/links/[id]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('linkDetail') };
}

export default async function Page({ params }: PageProps<'/[locale]/dashboard/links/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LinkDetailView id={id} />
    </Suspense>
  );
}
