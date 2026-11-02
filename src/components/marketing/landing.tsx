import { ArrowRight, Bookmark, Compass, FolderTree, Globe2, Languages, Lock, Search, ShieldCheck, Sparkles, Share2, Users, Check } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { serverPublicApi } from '@/lib/api/server';
import type { PublicLink } from '@/lib/api/types';
import { HeroIllustration } from './hero-illustration';
import { PublicLinkCard } from '@/components/public/public-link-card';

async function latestPublic(locale: string): Promise<PublicLink[]> {
  try {
    const page = await serverPublicApi.links(locale, { sort: 'latest', per_page: 3 });
    return page.items;
  } catch {
    return []; // API unreachable: the section is simply omitted.
  }
}

export async function Landing() {
  const t = await getTranslations('landing');
  const locale = await getLocale();
  const recent = await latestPublic(locale);

  const features = [
    { icon: Bookmark, key: 'save' },
    { icon: Sparkles, key: 'ai' },
    { icon: FolderTree, key: 'organize' },
    { icon: Search, key: 'search' },
    { icon: Share2, key: 'share' },
    { icon: Languages, key: 'bilingual' },
  ] as const;

  const steps = ['save', 'enrich', 'use'] as const;
  const ladder = [
    { status: 'PENDING', tone: 'bg-info-soft text-info-foreground' },
    { status: 'UNKNOWN', tone: 'bg-muted text-muted-foreground' },
    { status: 'CLEAR', tone: 'bg-success-soft text-success-foreground' },
    { status: 'SUSPICIOUS', tone: 'bg-warning-soft text-warning-foreground' },
    { status: 'MALICIOUS', tone: 'bg-destructive-soft text-destructive' },
  ] as const;
  const faqs = ['private', 'safe', 'ai', 'share', 'public', 'arabic'] as const;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,var(--brand-soft),transparent_70%)] opacity-60 dark:opacity-40" />
        <div className="container-page grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Badge variant="brand" className="mb-5">
              <ShieldCheck aria-hidden /> {t('hero.eyebrow')}
            </Badge>
            <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">{t('hero.title')}</h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">{t('hero.subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  {t('hero.primary')} <ArrowRight className="rtl-flip" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/explore">
                  <Compass aria-hidden /> {t('hero.secondary')}
                </Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {(['private', 'checked', 'bilingual'] as const).map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" aria-hidden /> {t(`hero.points.${k}`)}
                </li>
              ))}
            </ul>
          </div>
          <HeroIllustration />
        </div>
      </section>

      {/* Value proposition */}
      <section className="container-page py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">{t('value.title')}</h2>
          <p className="mt-4 text-pretty text-muted-foreground">{t('value.body')}</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-y bg-card/40">
        <div className="container-page py-16 md:py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium text-primary">{t('features.eyebrow')}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t('features.title')}</h2>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, key }) => (
              <li key={key} className="bg-card p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold">{t(`features.items.${key}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`features.items.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container-page scroll-mt-20 py-16 md:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium text-primary">{t('how.eyebrow')}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t('how.title')}</h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((key, index) => (
            <li key={key} className="relative rounded-2xl border bg-card p-6">
              <span className="mb-4 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
                {index + 1}
              </span>
              <h3 className="font-semibold">{t(`how.steps.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`how.steps.${key}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Security & privacy */}
      <section id="security" className="scroll-mt-20 border-y bg-card/40">
        <div className="container-page grid gap-12 py-16 md:py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-primary">{t('security.eyebrow')}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t('security.title')}</h2>
            <p className="mt-4 text-muted-foreground">{t('security.body')}</p>
            <ul className="mt-6 grid gap-3 text-sm">
              {(['private', 'scan', 'publish', 'share', 'noTrack'] as const).map((k) => (
                <li key={k} className="flex gap-3">
                  <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{t(`security.points.${k}`)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-muted-foreground">{t('security.disclaimer')}</p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-semibold">{t('security.ladderTitle')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('security.ladderBody')}</p>
            <ul className="mt-5 grid gap-2">
              {ladder.map(({ status, tone }) => (
                <li key={status} className="flex items-start gap-3 rounded-lg border p-3">
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}>{t(`security.statuses.${status}.label`)}</span>
                  <span className="text-sm text-muted-foreground">{t(`security.statuses.${status}.body`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="container-page py-16 md:py-20">
        <div className="grid gap-10 rounded-3xl border bg-gradient-to-br from-brand-soft/60 to-card p-8 md:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Sparkles className="mb-4 size-7 text-primary" aria-hidden />
            <h2 className="text-3xl font-semibold tracking-tight">{t('ai.title')}</h2>
            <p className="mt-4 text-muted-foreground">{t('ai.body')}</p>
          </div>
          <ul className="grid content-center gap-3 text-sm">
            {(['summaries', 'tags', 'categories', 'control', 'optional'] as const).map((k) => (
              <li key={k} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{t(`ai.points.${k}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Discovery */}
      <section className="border-t">
        <div className="container-page py-16 md:py-20">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary">
                <Globe2 className="me-1 inline size-4" aria-hidden />
                {t('discovery.eyebrow')}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t('discovery.title')}</h2>
              <p className="mt-3 text-muted-foreground">{t('discovery.body')}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/explore">
                {t('discovery.cta')} <ArrowRight className="rtl-flip" aria-hidden />
              </Link>
            </Button>
          </div>
          {recent.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-3">
              {recent.map((link) => (
                <li key={link.public_id}>
                  <PublicLinkCard link={link} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              <Users className="mx-auto mb-3 size-6" aria-hidden />
              {t('discovery.empty')}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t bg-card/40">
        <div className="container-page grid gap-10 py-16 md:py-20 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">{t('faq.title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('faq.body')}</p>
          </div>
          <div className="divide-y rounded-2xl border bg-card">
            {faqs.map((k) => (
              <details key={k} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {t(`faq.items.${k}.q`)}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{t(`faq.items.${k}.a`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 md:py-24">
        <div className="rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground md:py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">{t('cta.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground">{t('cta.body')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">{t('cta.primary')}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/login">{t('cta.secondary')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
