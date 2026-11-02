import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RegisterForm } from '@/components/auth/register-form';

export async function generateMetadata({ params }: PageProps<'/[locale]/register'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.pages' });
  return { title: t('register') };
}

export default async function Page({ params }: PageProps<'/[locale]/register'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <RegisterForm />
    </Suspense>
  );
}
