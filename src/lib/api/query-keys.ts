import type { LinkListParams, PublicListParams, SearchParams, SharedListParams } from './types';

/** Central TanStack Query key factory — invalidate by prefix (e.g. queryKeys.links.all). */
export const queryKeys = {
  session: ['session'] as const,
  links: {
    all: ['links'] as const,
    list: (params: LinkListParams) => ['links', 'list', params] as const,
    detail: (id: string) => ['links', 'detail', id] as const,
    processing: (id: string) => ['links', 'processing', id] as const,
    security: (id: string) => ['links', 'security', id] as const,
    counts: ['links', 'counts'] as const,
  },
  sharing: {
    all: ['sharing'] as const,
    invitations: (linkId: string) => ['sharing', 'invitations', linkId] as const,
    access: (linkId: string) => ['sharing', 'access', linkId] as const,
    received: ['sharing', 'received'] as const,
    sharedWithMe: (params: SharedListParams) => ['sharing', 'shared-with-me', params] as const,
  },
  collections: {
    all: ['collections'] as const,
    list: ['collections', 'list'] as const,
    detail: (id: string) => ['collections', 'detail', id] as const,
  },
  taxonomy: {
    categories: ['taxonomy', 'categories'] as const,
    tags: (q: string) => ['taxonomy', 'tags', q] as const,
  },
  search: (params: SearchParams) => ['search', params] as const,
  notifications: {
    all: ['notifications'] as const,
    list: (params: { page?: number; unread?: boolean }) => ['notifications', 'list', params] as const,
    unread: ['notifications', 'unread'] as const,
  },
  account: {
    sessions: ['account', 'sessions'] as const,
    tokens: ['account', 'tokens'] as const,
  },
  public: {
    links: (params: PublicListParams) => ['public', 'links', params] as const,
    categories: ['public', 'categories'] as const,
    tags: ['public', 'tags'] as const,
  },
  admin: {
    appeals: (status: string, page: number) => ['admin', 'appeals', status, page] as const,
    categories: ['admin', 'categories'] as const,
    audit: (params: object) => ['admin', 'audit', params] as const,
  },
};
