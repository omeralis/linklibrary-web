'use client';

import * as React from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SOURCE_TYPES } from '@/lib/validation/schemas';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { CategorySelect } from './category-select';
import type { LinkView } from './link-card';

const ANY = '__any__';

export interface FilterState {
  q: string;
  category: string;
  tag: string;
  source_type: string;
  visibility: string;
  security_status: string;
  sort: string;
}

export interface FilterOptions {
  visibility?: boolean;
  security?: boolean;
  sorts: readonly string[];
}

/** Search box (debounced, ≥2 chars as required by the API) + filter popover + sort + view toggle. */
export function LinkFilters({
  values,
  onChange,
  view,
  onViewChange,
  options,
}: {
  values: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  view: LinkView;
  onViewChange: (view: LinkView) => void;
  options: FilterOptions;
}) {
  const t = useTranslations('links.filters');
  const ts = useTranslations('links.sourceTypes');
  const tsec = useTranslations('security.status');
  const tv = useTranslations('links.visibility');
  const [term, setTerm] = React.useState(values.q);
  const debounced = useDebouncedValue(term.trim(), 350);

  // Keep the box in sync when the URL changes externally (back/forward, "clear filters").
  const [syncedQ, setSyncedQ] = React.useState(values.q);
  if (syncedQ !== values.q) {
    setSyncedQ(values.q);
    setTerm(values.q);
  }
  React.useEffect(() => {
    const q = debounced.length >= 2 ? debounced : '';
    if (q !== values.q) onChange({ q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const activeCount = [
    values.category,
    values.tag,
    values.source_type,
    options.visibility ? values.visibility : '',
    options.security ? values.security_status : '',
  ].filter(Boolean).length;

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="ps-9"
          maxLength={200}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default">
              <SlidersHorizontal aria-hidden />
              {t('filters')}
              {activeCount > 0 && (
                <Badge variant="brand" className="ms-1 px-1.5">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="filter-category">{t('category')}</Label>
                <CategorySelect id="filter-category" value={values.category} onChange={(category) => onChange({ category })} noneLabel={t('any')} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="filter-tag">{t('tag')}</Label>
                <Input
                  id="filter-tag"
                  defaultValue={values.tag}
                  key={values.tag}
                  onBlur={(e) => onChange({ tag: e.target.value.trim() })}
                  onKeyDown={(e) => e.key === 'Enter' && onChange({ tag: (e.target as HTMLInputElement).value.trim() })}
                  placeholder={t('tagPlaceholder')}
                  maxLength={60}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="filter-type">{t('sourceType')}</Label>
                <Select value={values.source_type || ANY} onValueChange={(v) => onChange({ source_type: v === ANY ? '' : v })}>
                  <SelectTrigger id="filter-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>{t('any')}</SelectItem>
                    {SOURCE_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ts(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {options.visibility && (
                <div className="grid gap-1.5">
                  <Label htmlFor="filter-visibility">{t('visibility')}</Label>
                  <Select value={values.visibility || ANY} onValueChange={(v) => onChange({ visibility: v === ANY ? '' : v })}>
                    <SelectTrigger id="filter-visibility" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t('any')}</SelectItem>
                      <SelectItem value="PRIVATE">{tv('PRIVATE')}</SelectItem>
                      <SelectItem value="PUBLIC">{tv('PUBLIC')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {options.security && (
                <div className="grid gap-1.5">
                  <Label htmlFor="filter-security">{t('security')}</Label>
                  <Select value={values.security_status || ANY} onValueChange={(v) => onChange({ security_status: v === ANY ? '' : v })}>
                    <SelectTrigger id="filter-security" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t('any')}</SelectItem>
                      {(['CLEAR', 'PENDING', 'UNKNOWN', 'SUSPICIOUS', 'MALICIOUS'] as const).map((s) => (
                        <SelectItem key={s} value={s}>
                          {tsec(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onChange({ category: '', tag: '', source_type: '', visibility: '', security_status: '' })}>
                  <X aria-hidden /> {t('clear')}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Select value={values.sort || options.sorts[0]} onValueChange={(sort) => onChange({ sort })}>
          <SelectTrigger className="w-40" aria-label={t('sort')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.sorts.map((s) => (
              <SelectItem key={s} value={s} disabled={s === 'relevance' && !values.q}>
                {t(`sorts.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border bg-card p-0.5 shadow-xs" role="group" aria-label={t('view')}>
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => onViewChange('grid')}
            aria-pressed={view === 'grid'}
            aria-label={t('grid')}
          >
            <LayoutGrid aria-hidden />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => onViewChange('list')}
            aria-pressed={view === 'list'}
            aria-label={t('list')}
          >
            <List aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Per-viewer remembered list/grid preference (localStorage is fine here: a UI convenience, not data). */
const viewListeners = new Set<() => void>();
const viewMemory = new Map<string, LinkView>();

function readView(key: string): LinkView {
  const remembered = viewMemory.get(key);
  if (remembered) return remembered;
  try {
    const saved = window.localStorage.getItem(key);
    return saved === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export function useViewPreference(key = 'll:view'): [LinkView, (v: LinkView) => void] {
  const view = React.useSyncExternalStore(
    (cb) => {
      viewListeners.add(cb);
      return () => viewListeners.delete(cb);
    },
    () => readView(key),
    () => 'grid' as LinkView,
  );
  const update = React.useCallback(
    (v: LinkView) => {
      viewMemory.set(key, v);
      try {
        window.localStorage.setItem(key, v);
      } catch {
        /* storage unavailable */
      }
      viewListeners.forEach((cb) => cb());
    },
    [key],
  );
  return [view, update];
}
