import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export async function generateMetadata({ params }: PageProps<'/[locale]/forgot-password'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('forgotPassword') };
}

export default async function Page({ params }: PageProps<'/[locale]/forgot-password'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
