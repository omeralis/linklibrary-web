/* eslint-disable @next/next/no-img-element -- favicons come from arbitrary third-party hosts; next/image would require a wildcard remotePattern. */
'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { safeImageUrl } from '@/lib/url';
import { cn } from '@/lib/utils';

export function LinkFavicon({ src, className }: { src: string | null | undefined; className?: string }) {
  const [failed, setFailed] = React.useState(false);
  const url = safeImageUrl(src);
  if (!url || failed) {
    return (
      <span className={cn('flex size-4 shrink-0 items-center justify-center text-muted-foreground', className)} aria-hidden>
        <Globe className="size-3.5" />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      width={16}
      height={16}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('size-4 shrink-0 rounded-sm object-contain', className)}
    />
  );
}
