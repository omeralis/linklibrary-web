import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Landing } from '@/components/marketing/landing';

/** Landing includes the latest public links (ISR, same 30 s window the API advertises). */
export const revalidate = 30;

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { description: t('description'), alternates: { canonical: `/${locale}`, languages: { ar: '/ar', en: '/en' } } };
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Landing />;
}
