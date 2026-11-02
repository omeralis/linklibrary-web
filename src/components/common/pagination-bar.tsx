'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Pagination } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export function PaginationBar({ pagination, onPageChange, className }: { pagination: Pagination; onPageChange: (page: number) => void; className?: string }) {
  const t = useTranslations('common.pagination');
  const locale = useLocale();
  const { current_page: page, has_more, last_page, total } = pagination;
  if (page === 1 && !has_more) return null;

  return (
    <nav aria-label={t('label')} className={cn('mt-6 flex items-center justify-between gap-3', className)}>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {last_page
          ? t('pageOf', { page: formatNumber(page, locale), total: formatNumber(last_page, locale) })
          : t('page', { page: formatNumber(page, locale) })}
        {total !== undefined && <span className="hidden sm:inline"> · {t('results', { count: total })}</span>}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="rtl-flip" aria-hidden />
          {t('previous')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!has_more}>
          {t('next')}
          <ChevronRight className="rtl-flip" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
