'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useSession } from '@/hooks/use-session';

/**
 * Applies the signed-in user's saved theme (GET /auth/me → user.theme) once per user per page load.
 * Changes made with the theme switcher are written back with PATCH /me, so both stay consistent.
 */
export function PreferenceSync() {
  const { user } = useSession();
  const { setTheme } = useTheme();
  const applied = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!user || applied.current === user.public_id) return;
    applied.current = user.public_id;
    setTheme(user.theme);
  }, [user, setTheme]);

  return null;
}
