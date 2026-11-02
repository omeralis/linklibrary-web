import type { Metadata } from 'next';
import { BookOpen, Mail, ShieldAlert } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('intro') };
}

/** The backend has no contact endpoint; the address is configured with NEXT_PUBLIC_CONTACT_EMAIL. */
export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  const validEmail = email && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email) ? email : null;

  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{t('intro')}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4 text-primary" aria-hidden /> {t('emailTitle')}
            </CardTitle>
            <CardDescription>{validEmail ? t('emailBody') : t('emailUnset')}</CardDescription>
          </CardHeader>
          {validEmail && (
            <CardContent>
              <Button asChild variant="outline">
                <a href={`mailto:${validEmail}`} dir="ltr">
                  {validEmail}
                </a>
              </Button>
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="size-4 text-primary" aria-hidden /> {t('securityTitle')}
            </CardTitle>
            <CardDescription>{t('securityBody')}</CardDescription>
          </CardHeader>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" aria-hidden /> {t('helpTitle')}
            </CardTitle>
            <CardDescription>{t('helpBody')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/#faq">{t('faq')}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/privacy">{t('privacy')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
