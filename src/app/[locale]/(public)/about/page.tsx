import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProsePage } from '@/components/public/prose-page';

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title'), description: t('intro'), alternates: { canonical: `/${locale}/about`, languages: { ar: '/ar/about', en: '/en/about' } } };
}

export default async function Page({ params }: PageProps<'/[locale]/about'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProsePage namespace="about" draft={false} />;
}
