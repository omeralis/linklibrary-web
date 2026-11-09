'use client';

import * as React from 'react';
import { Share2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { extractSharedUrl, sharedTitle } from '@/lib/share';
import { useAddLink } from './add-link-provider';

/**
 * Landing page of the Web Share Target (installed app → system "Share" → LinkLibrary). The shared link and the
 * text the other app sent (its own title, e.g. a Facebook post) pre-fill the normal "save a link" dialog, so
 * sites that refuse automated fetching still get a usable title. Nothing is saved until the user confirms.
 */
export function ShareReceiver() {
  const t = useTranslations('links.share');
  const params = useSearchParams();
  const addLink = useAddLink();
  const rawTitle = params.get('title');
  const rawText = params.get('text');
  const url = React.useMemo(() => extractSharedUrl(params.get('url'), rawText, rawTitle), [params, rawText, rawTitle]);
  const title = React.useMemo(() => sharedTitle(rawTitle, rawText, url), [rawTitle, rawText, url]);
  const opened = React.useRef(false);

  React.useEffect(() => {
    if (url && !opened.current) {
      opened.current = true;
      addLink.open({ url, title: title || undefined });
    }
  }, [url, title, addLink]);

  return (
    <div className="container-page mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
        <Share2 className="size-6" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold">{url ? t('title') : t('noUrlTitle')}</h1>
      <p className="text-sm text-muted-foreground">{url ? t('body') : t('noUrlBody')}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => addLink.open(url ? { url, title: title || undefined } : undefined)}>{url ? t('reopen') : t('addManually')}</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/links">{t('toLibrary')}</Link>
        </Button>
      </div>
    </div>
  );
}
