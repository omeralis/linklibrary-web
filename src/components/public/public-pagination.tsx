import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import type { Pagination } from '@/lib/api/types';

/** Link-based pagination for server-rendered public lists (crawlable, works without JS). */
export function PublicPagination({ pagination, basePath, query }: { pagination: Pagination; basePath: string; query: Record<string, string | undefined> }) {
  const t = useTranslations('common.pagination');
  const { current_page: page, has_more, last_page } = pagination;
  if (page === 1 && !has_more) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) qs.set(k, v);
    if (p > 1) qs.set('page', String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav aria-label={t('label')} className="mt-8 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{last_page ? t('pageOf', { page, total: last_page }) : t('page', { page })}</p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(page - 1)} rel="prev">
              <ChevronLeft className="rtl-flip" aria-hidden /> {t('previous')}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="rtl-flip" aria-hidden /> {t('previous')}
          </Button>
        )}
        {has_more ? (
          <Button asChild variant="outline" size="sm">
            <Link href={href(page + 1)} rel="next">
              {t('next')} <ChevronRight className="rtl-flip" aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            {t('next')} <ChevronRight className="rtl-flip" aria-hidden />
          </Button>
        )}
      </div>
    </nav>
  );
}
