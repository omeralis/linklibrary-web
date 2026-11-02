'use client';

import { FolderOpen, Globe2, Lock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { RemoteImage } from '@/components/common/remote-image';
import type { Collection } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';

export function CollectionCard({ collection, href }: { collection: Collection; href: string }) {
  const t = useTranslations('collections');
  const locale = useLocale();
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-ring/40 hover:shadow-sm">
      <div className="aspect-[2.4/1] overflow-hidden border-b bg-gradient-to-br from-brand-soft to-muted">
        <RemoteImage
          src={collection.cover_image_url}
          className="size-full"
          fallback={
            <div className="flex size-full items-center justify-center text-brand-soft-foreground/60">
              <FolderOpen className="size-8" aria-hidden />
            </div>
          }
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-semibold">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {collection.name}
          </Link>
        </h3>
        {collection.description && <p className="line-clamp-2 text-sm text-muted-foreground">{collection.description}</p>}
        <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          {collection.items_count !== null && (
            <span>{t('itemsCount', { count: collection.items_count, formatted: formatNumber(collection.items_count, locale) })}</span>
          )}
          {collection.visibility && (
            <Badge variant={collection.visibility === 'PUBLIC' ? 'brand' : 'muted'} className="ms-auto">
              {collection.visibility === 'PUBLIC' ? <Globe2 aria-hidden /> : <Lock aria-hidden />}
              {t(`visibility.${collection.visibility}`)}
            </Badge>
          )}
        </div>
      </div>
    </article>
  );
}
