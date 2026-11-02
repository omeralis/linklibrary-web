'use client';

import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RemoteImage } from '@/components/common/remote-image';
import type { OwnedLink } from '@/lib/api/types';
import { categoryName, formatDate, formatDateTime } from '@/lib/format';
import { displayUrl, safeExternalUrl } from '@/lib/url';
import { useTagMutations } from '@/hooks/use-links';
import { useErrorMessage } from '@/hooks/use-error-message';
import { AiPanel } from './ai-panel';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function LinkOverview({ link }: { link: OwnedLink }) {
  const t = useTranslations('links.detail');
  const ts = useTranslations('links.sourceTypes');
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const tags = useTagMutations(link.public_id);
  const [newTag, setNewTag] = React.useState('');
  const canonical = safeExternalUrl(link.extracted.canonical_url);

  function addTag() {
    const tag = newTag.trim();
    if (!tag) return;
    tags.add.mutate([tag], { onSuccess: () => setNewTag(''), onError: (e) => toast.error(errorMessage(e)) });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-6">
        {link.image_url && (
          <div className="aspect-[1.91/1] overflow-hidden rounded-xl border bg-muted">
            <RemoteImage src={link.image_url} className="size-full" />
          </div>
        )}
        {link.description ? (
          <p className="leading-relaxed text-pretty">{link.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('noDescription')}</p>
        )}
        <AiPanel link={link} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('notes')}</CardTitle>
          </CardHeader>
          <CardContent>
            {link.notes ? <p className="text-sm whitespace-pre-line">{link.notes}</p> : <p className="text-sm text-muted-foreground">{t('noNotes')}</p>}
          </CardContent>
        </Card>
      </div>
      <div className="grid h-fit gap-6">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="text-base">{t('tags')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {link.tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noTags')}</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {link.tags.map((tag) => (
                  <li key={tag.slug}>
                    <Badge variant={tag.source === 'AI' ? 'brand' : 'secondary'} className="gap-1 pe-1">
                      #{tag.name}
                      {tag.source === 'AI' && <span className="text-[10px] opacity-75">{t('aiTag')}</span>}
                      <button
                        type="button"
                        className="rounded-sm p-0.5 hover:bg-background/60"
                        aria-label={t('removeTag', { tag: tag.name })}
                        disabled={tags.remove.isPending}
                        onClick={() => tags.remove.mutate(tag.slug, { onError: (e) => toast.error(errorMessage(e)) })}
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addTag();
              }}
            >
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                maxLength={50}
                placeholder={t('addTagPlaceholder')}
                aria-label={t('addTagPlaceholder')}
                className="h-8"
              />
              <Button
                type="submit"
                size="icon-sm"
                variant="outline"
                aria-label={t('addTag')}
                disabled={!newTag.trim() || link.tags.length >= 20}
                loading={tags.add.isPending}
              >
                {!tags.add.isPending && <Plus aria-hidden />}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="text-base">{t('details')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row label={t('url')}>
                <span dir="ltr" className="font-mono text-xs">
                  {displayUrl(link.url)}
                </span>
              </Row>
              {canonical && canonical !== link.url && (
                <Row label={t('canonical')}>
                  <span dir="ltr" className="font-mono text-xs">
                    {displayUrl(canonical)}
                  </span>
                </Row>
              )}
              <Row label={t('type')}>{ts(link.source_type)}</Row>
              {link.category && <Row label={t('category')}>{categoryName(link.category, locale)}</Row>}
              {link.language && <Row label={t('language')}>{link.language.toUpperCase()}</Row>}
              {link.author && <Row label={t('author')}>{link.author}</Row>}
              {link.source_published_at && <Row label={t('published')}>{formatDate(link.source_published_at, locale)}</Row>}
              <Row label={t('saved')}>{formatDateTime(link.created_at, locale)}</Row>
              <Row label={t('updated')}>{formatDateTime(link.updated_at, locale)}</Row>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
