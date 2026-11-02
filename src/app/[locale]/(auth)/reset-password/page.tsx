import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export async function generateMetadata({ params }: PageProps<'/[locale]/reset-password'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('resetPassword') };
}

export default async function Page({ params }: PageProps<'/[locale]/reset-password'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
