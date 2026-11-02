import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { VerifyEmail } from '@/components/auth/verify-email';

export async function generateMetadata({ params }: PageProps<'/[locale]/verify-email'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('verifyEmail') };
}

export default async function Page({ params }: PageProps<'/[locale]/verify-email'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <VerifyEmail />
    </Suspense>
  );
}
