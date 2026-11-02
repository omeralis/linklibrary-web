import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/logo';
import { BRAND_NAME } from '@/lib/brand';

export async function SiteFooter() {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  const year = new Date().getFullYear();

  const groups = [
    {
      title: t('product'),
      links: [
        { href: '/explore', label: nav('explore') },
        { href: '/#features', label: t('features') },
        { href: '/#how-it-works', label: nav('howItWorks') },
        { href: '/#faq', label: t('faq') },
      ],
    },
    {
      title: t('company'),
      links: [
        { href: '/about', label: nav('about') },
        { href: '/contact', label: t('contact') },
      ],
    },
    {
      title: t('legal'),
      links: [
        { href: '/privacy', label: t('privacy') },
        { href: '/terms', label: t('terms') },
      ],
    },
  ];

  return (
    <footer className="border-t bg-card/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">{t('blurb')}</p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t('copyright', { year, brand: BRAND_NAME })}</p>
          <p>{t('securityNote')}</p>
        </div>
      </div>
    </footer>
  );
}
