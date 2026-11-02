'use client';

import * as React from 'react';
import { ExternalLink, ShieldAlert, ShieldX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { linksApi } from '@/lib/api/endpoints';
import type { AnyLink } from '@/lib/api/types';
import { useErrorMessage } from '@/hooks/use-error-message';
import { safeExternalUrl, displayUrl } from '@/lib/url';

const EXTERNAL_REL = 'noopener noreferrer nofollow ugc';

/**
 * Opens the destination in a new tab, respecting the backend security policy:
 * - `security.can_open === false` (MALICIOUS, or SUSPICIOUS for viewers) → disabled with explanation;
 * - `security.warning` set (PENDING/UNKNOWN/SUSPICIOUS) → interstitial that re-checks via GET /links/{id}/open;
 * - otherwise a plain `target=_blank rel=noopener noreferrer` anchor to the server-provided `open_url`.
 */
export function OpenLinkButton({
  link,
  size = 'sm',
  variant = 'outline',
  label,
}: {
  link: AnyLink;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  label?: string;
}) {
  const t = useTranslations('links.open');
  const ts = useTranslations('security');
  const errorMessage = useErrorMessage();
  const [open, setOpen] = React.useState(false);
  const [resolved, setResolved] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const href = safeExternalUrl(link.open_url);
  const text = label ?? t('button');

  if (!link.security.can_open || !href) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex">
            <Button size={size} variant={variant} disabled aria-disabled>
              <ShieldX aria-hidden />
              {t('blocked')}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{ts(`explain.${link.security.status}`)}</TooltipContent>
      </Tooltip>
    );
  }

  if (!link.security.warning) {
    return (
      <Button asChild size={size} variant={variant}>
        <a href={href} target="_blank" rel={EXTERNAL_REL}>
          <ExternalLink aria-hidden />
          {text}
          <span className="sr-only">{t('newTab')}</span>
        </a>
      </Button>
    );
  }

  async function prepare() {
    setOpen(true);
    setError(null);
    setResolved(null);
    if (link.access_role === 'public') {
      setResolved(href);
      return;
    }
    setLoading(true);
    try {
      const res = await linksApi.open(link.public_id);
      setResolved(safeExternalUrl(res.url));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size={size} variant={variant} onClick={prepare}>
        <ExternalLink aria-hidden />
        {text}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-warning-soft text-warning-foreground">
              <ShieldAlert className="size-5" aria-hidden />
            </div>
            <DialogTitle>{t('warningTitle')}</DialogTitle>
            <DialogDescription>{ts(`explain.${link.security.status}`)}</DialogDescription>
          </DialogHeader>
          <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-all" dir="ltr">
            {displayUrl(resolved ?? href)}
          </p>
          <p className="text-sm text-muted-foreground">{t('warningBody')}</p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('stay')}
            </Button>
            {resolved ? (
              <Button asChild variant="default">
                <a href={resolved} target="_blank" rel={EXTERNAL_REL} onClick={() => setOpen(false)}>
                  <ExternalLink aria-hidden />
                  {t('continue')}
                </a>
              </Button>
            ) : (
              <Button loading={loading} disabled>
                {t('continue')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
