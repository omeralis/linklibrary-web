'use client';

import * as React from 'react';
import { AddLinkProvider } from '@/components/links/add-link-provider';
import { GlobalSearchProvider } from '@/components/search/global-search';
import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';
import { RequireAuth } from './require-auth';
import { VerifyEmailBanner } from './verify-email-banner';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={null}>
      <RequireAuth>
        {(user) => (
          <AddLinkProvider>
            <GlobalSearchProvider>
              <div className="flex min-h-dvh">
                <AppSidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <AppTopbar user={user} />
                  <VerifyEmailBanner user={user} />
                  <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
                    {children}
                  </main>
                </div>
              </div>
            </GlobalSearchProvider>
          </AddLinkProvider>
        )}
      </RequireAuth>
    </React.Suspense>
  );
}
