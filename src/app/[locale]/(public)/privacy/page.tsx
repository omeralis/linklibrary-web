import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProsePage } from '@/components/public/prose-page';

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  return { title: t('title'), description: t('intro'), alternates: { canonical: `/${locale}/privacy`, languages: { ar: '/ar/privacy', en: '/en/privacy' } } };
}

export default async function Page({ params }: PageProps<'/[locale]/privacy'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProsePage namespace="privacy" draft={true} />;
}
