'use client';

import { Sparkles, Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { OwnedLink, PublicLink } from '@/lib/api/types';
import { isOwnedLink } from '@/lib/api/types';
import { categoryName } from '@/lib/format';
import { useTagMutations, useUpdateLink } from '@/hooks/use-links';
import { useErrorMessage } from '@/hooks/use-error-message';

/**
 * AI suggestions are clearly labelled and never applied automatically: the owner chooses to copy a
 * suggestion into their manual overrides, which then take precedence (user > extracted > AI).
 * When AI is disabled (`ai === null` and `processing.ai_enabled === false`) a short note is shown.
 */
export function AiPanel({ link }: { link: PublicLink | OwnedLink }) {
  const t = useTranslations('links.ai');
  const locale = useLocale();
  const owned = isOwnedLink(link) ? link : null;

  if (!link.ai) {
    if (!owned) return null;
    const state = owned.processing.ai_enabled ? owned.processing.ai : 'DISABLED';
    return (
      <Card className="gap-2 py-4">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-primary" aria-hidden /> {t('title')}
          </CardTitle>
          <CardDescription>
            {state === 'DISABLED' ? t('disabled') : state === 'FAILED' ? t('failed') : state === 'SKIPPED' ? t('skipped') : t('pending')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const ai = link.ai;
  return (
    <Card className="gap-4 border-brand-soft-foreground/15 bg-brand-soft/30 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary" aria-hidden /> {t('title')}
          <Badge variant="brand" className="ms-auto">
            {t('generated')}
          </Badge>
        </CardTitle>
        <CardDescription>{t('disclaimer')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 px-4 text-sm">
        {ai.summary && <p className="leading-relaxed">{ai.summary}</p>}
        {ai.detailed_summary && ai.detailed_summary !== ai.summary && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-primary">{t('detailed')}</summary>
            <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">{ai.detailed_summary}</p>
          </details>
        )}
        {owned ? (
          <AiSuggestions link={owned} />
        ) : (
          ai.suggested_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ai.suggested_tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          )
        )}
        {ai.suggested_category && !owned && (
          <p className="text-muted-foreground">{t('suggestedCategory', { name: categoryName(ai.suggested_category, locale) })}</p>
        )}
      </CardContent>
    </Card>
  );
}

function AiSuggestions({ link }: { link: OwnedLink }) {
  const t = useTranslations('links.ai');
  const locale = useLocale();
  const update = useUpdateLink(link.public_id);
  const tags = useTagMutations(link.public_id);
  const errorMessage = useErrorMessage();
  const ai = link.ai!;
  const missingTags = ai.suggested_tags.filter((tag) => !link.tags.some((x) => x.name.toLowerCase() === tag.toLowerCase()));
  const apply = (payload: Parameters<typeof update.mutate>[0]) =>
    update.mutate(payload, { onSuccess: () => toast.success(t('applied')), onError: (e) => toast.error(errorMessage(e)) });

  return (
    <div className="grid gap-3 border-t pt-3">
      {ai.suggested_title && ai.suggested_title !== link.title && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0">
            <span className="text-muted-foreground">{t('suggestedTitle')}: </span>
            {ai.suggested_title}
          </p>
          <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => apply({ custom_title: ai.suggested_title })}>
            <Check aria-hidden /> {t('use')}
          </Button>
        </div>
      )}
      {ai.suggested_category && link.overrides.category?.slug !== ai.suggested_category.slug && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>
            <span className="text-muted-foreground">{t('suggestedCategoryLabel')}: </span>
            {categoryName(ai.suggested_category, locale)}
          </p>
          <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => apply({ category: ai.suggested_category!.slug })}>
            <Check aria-hidden /> {t('use')}
          </Button>
        </div>
      )}
      {missingTags.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">{t('suggestedTags')}:</span>
            {missingTags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={tags.add.isPending}
            onClick={() => tags.add.mutate(missingTags, { onSuccess: () => toast.success(t('applied')), onError: (e) => toast.error(errorMessage(e)) })}
          >
            <Check aria-hidden /> {t('addTags')}
          </Button>
        </div>
      )}
    </div>
  );
}
