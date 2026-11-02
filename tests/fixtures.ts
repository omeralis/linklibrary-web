import type { OwnedLink, PublicLink, User, ViewerLink } from '@/lib/api/types';

export const user: User = {
  public_id: 'fe2dc82e-755d-4cf3-8826-e3378c146d6c',
  name: 'Sara Ali',
  username: 'sara',
  email: 'sara@example.com',
  email_verified: true,
  email_verified_at: '2026-11-01T19:32:03+00:00',
  avatar_url: null,
  bio: null,
  locale: 'en',
  theme: 'system',
  profile_public: true,
  is_admin: false,
  created_at: '2026-11-01T19:32:03+00:00',
};

/** Shapes copied from FRONTEND_INTEGRATION_HANDOFF.md §4.1 / SavedLinkResource. */
export function publicLink(overrides: Partial<PublicLink> = {}): PublicLink {
  return {
    public_id: '9cb9e437-a3ef-40f5-870a-2f36b6caac1e',
    internal_path: '/l/9cb9e437-a3ef-40f5-870a-2f36b6caac1e',
    frontend_url: 'http://localhost:3000/l/9cb9e437-a3ef-40f5-870a-2f36b6caac1e',
    access_role: 'public',
    title: 'Queues - Laravel',
    description: 'Laravel queues allow you to defer time consuming tasks.',
    image_url: 'https://laravel.com/img/og.png',
    favicon_url: 'https://laravel.com/favicon.ico',
    site_name: 'Laravel',
    hostname: 'laravel.com',
    source_type: 'WEBSITE',
    language: 'en',
    author: null,
    source_published_at: null,
    category: null,
    tags: [{ name: 'laravel', slug: 'laravel', source: null }],
    ai: null,
    url: 'https://laravel.com/docs/queues',
    open_url: 'https://laravel.com/docs/queues',
    security: { status: 'CLEAR', can_open: true, warning: null, checked_at: '2026-11-01T19:32:03+00:00' },
    owner: { username: 'sara', name: 'Sara Ali', avatar_url: null, profile_url: 'http://localhost:3000/u/sara' },
    published_at: '2026-11-01T19:32:03+00:00',
    ...overrides,
  };
}

export function ownedLink(overrides: Partial<OwnedLink> = {}): OwnedLink {
  return {
    ...publicLink(),
    access_role: 'owner',
    published_at: null,
    tags: [{ name: 'laravel', slug: 'laravel', source: 'USER' }],
    visibility: 'PRIVATE',
    allow_resharing: false,
    is_favorite: false,
    notes: 'read later',
    overrides: { title: null, description: null, image_url: null, source_type: null, category: null },
    extracted: {
      title: 'Queues - Laravel',
      description: 'Laravel queues allow you to defer time consuming tasks.',
      image_url: 'https://laravel.com/img/og.png',
      canonical_url: 'https://laravel.com/docs/queues',
      content_type: 'text/html',
      source_type: 'WEBSITE',
      status: 'COMPLETED',
      error_code: null,
      extracted_at: '2026-11-01T19:32:03+00:00',
    },
    processing_status: 'COMPLETED',
    processing: { status: 'COMPLETED', security: 'CLEAR', extraction: 'COMPLETED', extraction_error_code: null, ai: 'DISABLED', ai_enabled: false },
    permissions: { can_edit: true, can_delete: true, can_change_visibility: true, can_publish: true, can_share: true, can_reshare: true },
    created_at: '2026-11-01T19:32:03+00:00',
    updated_at: '2026-11-01T19:32:03+00:00',
    deleted_at: null,
    ...overrides,
  };
}

export function viewerLink(overrides: Partial<ViewerLink> = {}): ViewerLink {
  return {
    ...publicLink(),
    access_role: 'viewer',
    shared_by: 'Sara Ali',
    permissions: { can_edit: false, can_delete: false, can_change_visibility: false, can_reshare: false },
    ...overrides,
  };
}
