'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSession } from '@/hooks/use-session';
import type { User } from '@/lib/api/types';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Client-side route guard for the dashboard. GET /auth/me decides; the API remains authoritative
 * for every request (401 → session cleared → redirected here to /login?next=…).
 */
export function RequireAuth({ children }: { children: (user: User) => React.ReactNode }) {
  const { user, status, error, refetch } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (status === 'guest') {
      const qs = searchParams.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [status, pathname, searchParams, router]);

  if (status === 'authenticated' && user) return <>{children(user)}</>;
  if (status === 'error') {
    return (
      <div className="container-page py-16">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }
  return <ShellSkeleton />;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh" aria-busy aria-live="polite">
      <div className="hidden w-64 shrink-0 border-e bg-sidebar p-4 lg:block">
        <Skeleton className="mb-8 h-8 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-8" />
        ))}
      </div>
      <div className="flex-1">
        <div className="h-16 border-b" />
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

/** Inverse guard for /login, /register, /forgot-password: signed-in users go to the dashboard. */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only bounce visitors who arrive already signed in; a sign-in completed on this page navigates itself.
  const decided = React.useRef(false);
  React.useEffect(() => {
    if (decided.current || status === 'loading') return;
    decided.current = true;
    if (status === 'authenticated') {
      const next = searchParams.get('next');
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
    }
  }, [status, router, searchParams]);
  return <>{children}</>;
}
