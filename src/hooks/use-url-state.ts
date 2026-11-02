'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';

/**
 * Reads/writes list filters in the URL query string so filtered views are shareable and survive reloads.
 * Setting any filter other than `page` resets pagination.
 */
export function useUrlState() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const values = useMemo(() => Object.fromEntries(searchParams.entries()) as Record<string, string>, [searchParams]);

  const set = useCallback(
    (patch: Record<string, string | number | boolean | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === '' || value === false) next.delete(key);
        else next.set(key, String(value));
      }
      if (!('page' in patch)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const page = Math.max(1, Number.parseInt(values.page ?? '1', 10) || 1);
  return { values, set, page };
}
