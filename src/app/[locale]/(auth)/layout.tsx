import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';
import { LocaleSwitcher, LocaleSwitcherFallback } from '@/components/layout/locale-switcher';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function AuthLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,var(--brand-soft),transparent_55%)]">
      <header className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="rounded-md">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <Suspense fallback={<LocaleSwitcherFallback />}>
            <LocaleSwitcher />
          </Suspense>
          <ThemeSwitcher />
        </div>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="pb-6 text-center text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">
          {t('privacyLink')}
        </Link>
        <span className="mx-2" aria-hidden>
          ·
        </span>
        <Link href="/terms" className="hover:text-foreground">
          {t('termsLink')}
        </Link>
      </footer>
    </div>
  );
}
