import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProsePage } from '@/components/public/prose-page';

export async function generateMetadata({ params }: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });
  return { title: t('title'), description: t('intro'), alternates: { canonical: `/${locale}/terms`, languages: { ar: '/ar/terms', en: '/en/terms' } } };
}

export default async function Page({ params }: PageProps<'/[locale]/terms'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProsePage namespace="terms" draft={true} />;
}
