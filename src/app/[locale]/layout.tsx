import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
import { routing, localeDirection, type Locale } from '@/i18n/routing';
import { AppProviders } from '@/components/providers/app-providers';
import { SITE_URL } from '@/lib/api/config';
import { BRAND_NAME } from '@/lib/brand';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${BRAND_NAME} — ${t('tagline')}`, template: `%s · ${BRAND_NAME}` },
    description: t('description'),
    applicationName: BRAND_NAME,
    icons: { apple: '/icons/apple-touch-icon.png' },
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: '/ar', en: '/en', 'x-default': '/ar' },
    },
    openGraph: {
      type: 'website',
      siteName: BRAND_NAME,
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? ['en_US'] : ['ar_SA'],
      title: `${BRAND_NAME} — ${t('tagline')}`,
      description: t('description'),
    },
    twitter: { card: 'summary', title: BRAND_NAME, description: t('description') },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#16181d' },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const dir = localeDirection(locale as Locale);
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <html lang={locale} dir={dir} className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-[100] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>
          <AppProviders dir={dir}>{children as ReactNode}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
