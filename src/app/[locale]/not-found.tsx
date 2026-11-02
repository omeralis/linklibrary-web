import { Compass, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-10">
        <Logo />
      </Link>
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t('body')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">
            <Home aria-hidden /> {t('home')}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">
            <Compass aria-hidden /> {t('explore')}
          </Link>
        </Button>
      </div>
    </main>
  );
}
