/* eslint-disable @next/next/no-img-element -- preview images are hosted on arbitrary third-party domains. */
'use client';

import * as React from 'react';
import { safeImageUrl } from '@/lib/url';
import { cn } from '@/lib/utils';

/** Third-party image with no referrer, lazy loading, and a graceful fallback when it fails to load. */
export function RemoteImage({
  src,
  alt = '',
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [failed, setFailed] = React.useState(false);
  const url = safeImageUrl(src);
  if (!url || failed) return <>{fallback ?? null}</>;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
