import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AcceptInvitation } from '@/components/auth/accept-invitation';

export async function generateMetadata({ params }: PageProps<'/[locale]/invitations/accept'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('acceptInvitation') };
}

export default async function Page({ params }: PageProps<'/[locale]/invitations/accept'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <AcceptInvitation />
    </Suspense>
  );
}
