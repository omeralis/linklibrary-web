'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Category } from '@/lib/api/types';
import { SOURCE_TYPES } from '@/lib/validation/schemas';
import { categoryName } from '@/lib/format';
import { cn } from '@/lib/utils';

const ANY = '__any__';

/** URL-driven filters for the server-rendered explore page (each change re-renders on the server). */
export function ExploreFilters({ categories }: { categories: Category[] }) {
  const t = useTranslations('explore');
  const ts = useTranslations('links.sourceTypes');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = React.useTransition();
  const [term, setTerm] = React.useState(searchParams.get('q') ?? '');

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const category = searchParams.get('category') ?? '';
  const q = searchParams.get('q') ?? '';
  const hasFilters = ['q', 'category', 'tag', 'source_type', 'language'].some((k) => searchParams.get(k));

  return (
    <div className={cn('grid gap-4 transition-opacity', pending && 'opacity-70')} aria-busy={pending}>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = term.trim();
          update({
            q: value.length >= 2 ? value : null,
            sort: value.length >= 2 ? 'relevance' : searchParams.get('sort') === 'relevance' ? null : searchParams.get('sort'),
          });
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="h-11 ps-9"
            maxLength={200}
            minLength={2}
          />
        </div>
        <Button type="submit" size="lg" loading={pending}>
          {t('search')}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={searchParams.get('source_type') || ANY} onValueChange={(v) => update({ source_type: v === ANY ? null : v })}>
          <SelectTrigger className="w-40" aria-label={t('type')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t('anyType')}</SelectItem>
            {SOURCE_TYPES.map((s) => (
              <SelectItem key={s} value={s}>
                {ts(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={searchParams.get('language') || ANY} onValueChange={(v) => update({ language: v === ANY ? null : v })}>
          <SelectTrigger className="w-36" aria-label={t('language')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t('anyLanguage')}</SelectItem>
            <SelectItem value="ar">العربية</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
        <Select value={searchParams.get('sort') || (q ? 'relevance' : 'latest')} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="w-40" aria-label={t('sort')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">{t('sorts.latest')}</SelectItem>
            <SelectItem value="popular">{t('sorts.popular')}</SelectItem>
            <SelectItem value="relevance" disabled={!q}>
              {t('sorts.relevance')}
            </SelectItem>
          </SelectContent>
        </Select>
        {searchParams.get('tag') && (
          <Button variant="secondary" size="sm" onClick={() => update({ tag: null })}>
            #{searchParams.get('tag')} <X aria-hidden />
          </Button>
        )}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTerm('');
              startTransition(() => router.push(pathname));
            }}
          >
            {t('clear')}
          </Button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap" aria-label={t('categories')}>
            <li>
              <button
                type="button"
                onClick={() => update({ category: null })}
                aria-pressed={!category}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  !category ? 'border-primary bg-brand-soft text-brand-soft-foreground' : 'bg-card hover:bg-accent',
                )}
              >
                {t('allCategories')}
              </button>
            </li>
            {categories
              .filter((c) => (c.links_count ?? 0) > 0 || c.slug === category)
              .map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => update({ category: c.slug === category ? null : c.slug })}
                    aria-pressed={c.slug === category}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      c.slug === category ? 'border-primary bg-brand-soft text-brand-soft-foreground' : 'bg-card hover:bg-accent',
                    )}
                  >
                    {categoryName(c, locale)}
                    {c.links_count !== undefined && <span className="ms-1.5 text-xs text-muted-foreground tabular-nums">{c.links_count}</span>}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
