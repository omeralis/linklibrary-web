'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/use-taxonomy';
import { categoryName } from '@/lib/format';

export const NO_CATEGORY = '__none__';

/** Category picker bound to a slug ('' = none / automatic). */
export function CategorySelect({
  value,
  onChange,
  id,
  placeholder,
  allowNone = true,
  noneLabel,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (slug: string) => void;
  id?: string;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const t = useTranslations('links.fields');
  const locale = useLocale();
  const categories = useCategories();
  return (
    <Select value={value || NO_CATEGORY} onValueChange={(v) => onChange(v === NO_CATEGORY ? '' : v)} disabled={categories.isPending}>
      <SelectTrigger id={id} className={className ?? 'w-full'} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder ?? t('categoryPlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NO_CATEGORY}>{noneLabel ?? t('categoryNone')}</SelectItem>}
        {(categories.data ?? []).map((c) => (
          <SelectItem key={c.slug} value={c.slug}>
            {categoryName(c, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
