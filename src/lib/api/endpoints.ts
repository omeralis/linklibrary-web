import { api, request, toPage } from './client';
import type {
  AccessMeta,
  AdminAppeal,
  AnyLink,
  ApiToken,
  Appeal,
  AppNotification,
  AuditLog,
  AuthResult,
  Category,
  Collection,
  Grant,
  Invitation,
  LinkListParams,
  Locale,
  OpenLinkResult,
  OwnedLink,
  Processing,
  PublicLink,
  PublicListParams,
  PublicUser,
  ReceivedInvitation,
  SearchParams,
  SecurityDetails,
  SecurityScan,
  SharedListParams,
  SourceType,
  Tag,
  Theme,
  User,
  UserSession,
  ViewerLink,
  Visibility,
} from './types';
import type { QueryParams } from './query-string';

const enc = encodeURIComponent;
const q = (params: object | undefined) => params as QueryParams | undefined;

// ─────────────────────────────────────────────────────────────── Auth

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  locale?: Locale;
}

export const authApi = {
  me: (signal?: AbortSignal) => api.get<User>('/auth/me', undefined, { signal }).then((r) => r.data),
  login: (payload: { email: string; password: string; remember?: boolean }) => api.post<AuthResult>('/auth/login', payload),
  register: (payload: RegisterPayload) => api.post<AuthResult>('/auth/register', payload),
  logout: () => api.post<null>('/auth/logout'),
  forgotPassword: (email: string) => api.post<null>('/auth/forgot-password', { email }),
  resetPassword: (payload: { token: string; email: string; password: string; password_confirmation: string }) =>
    api.post<null>('/auth/reset-password', payload),
  /**
   * Verifies an e-mail address from the signed link parameters. `expires` and `signature` are passed
   * in that order and unchanged (handoff §2.3), so the signature computed by the backend still matches.
   */
  verifyEmail: (params: { id: string; hash: string; expires: string; signature: string }) =>
    request<null>(`/auth/email/verify/${enc(params.id)}/${enc(params.hash)}?expires=${enc(params.expires)}&signature=${enc(params.signature)}`),
  resendVerification: () => api.post<null>('/auth/email/verification-notification'),
};

// ─────────────────────────────────────────────────────────────── Profile & account

export interface ProfileUpdate {
  name?: string;
  username?: string;
  email?: string;
  current_password?: string;
  bio?: string | null;
  locale?: Locale;
  theme?: Theme;
  profile_public?: boolean;
}

export const accountApi = {
  profile: () => api.get<User>('/me').then((r) => r.data),
  update: (payload: ProfileUpdate) => api.patch<User>('/me', payload),
  updatePassword: (payload: { current_password: string; password: string; password_confirmation: string }) => api.patch<null>('/me/password', payload),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<User>('/me/avatar', form);
  },
  deleteAvatar: () => api.delete<User>('/me/avatar'),
  deleteAccount: (payload: { password: string; confirmation: 'DELETE' }) => request<null>('/me', { method: 'DELETE', body: payload }),
  sessions: () => api.get<UserSession[], { supported?: boolean }>('/me/sessions'),
  revokeSession: (id: string) => api.delete<null>(`/me/sessions/${enc(id)}`),
  revokeOtherSessions: (current_password: string) => api.post<null>('/me/sessions/revoke-others', { current_password }),
  tokens: () => api.get<ApiToken[]>('/me/tokens').then((r) => r.data),
  revokeToken: (id: number) => api.delete<null>(`/me/tokens/${id}`),
};

// ─────────────────────────────────────────────────────────────── Links

export interface CreateLinkPayload {
  url: string;
  custom_title?: string | null;
  custom_description?: string | null;
  custom_source_type?: SourceType | null;
  notes?: string | null;
  category?: string | null;
  tags?: string[];
  collections?: string[];
}

export interface UpdateLinkPayload {
  custom_title?: string | null;
  custom_description?: string | null;
  custom_image_url?: string | null;
  custom_source_type?: SourceType | null;
  notes?: string | null;
  category?: string | null;
  tags?: string[];
}

export const linksApi = {
  list: (params: LinkListParams = {}, signal?: AbortSignal) => api.page<OwnedLink>('/links', q(params), { signal }),
  create: (payload: CreateLinkPayload) => api.post<OwnedLink, { already_saved?: boolean }>('/links', payload),
  /** Owner, viewer or (when the link is public and the caller signed in) public representation. */
  get: (id: string, signal?: AbortSignal) => api.get<AnyLink>(`/links/${enc(id)}`, undefined, { signal }).then((r) => r.data),
  update: (id: string, payload: UpdateLinkPayload) => api.patch<OwnedLink>(`/links/${enc(id)}`, payload),
  remove: (id: string, permanent = false) => api.delete<null>(`/links/${enc(id)}`, permanent ? { permanent: 1 } : undefined),
  restore: (id: string) => api.post<OwnedLink>(`/links/${enc(id)}/restore`),
  favorite: (id: string, favorite?: boolean) =>
    api.post<{ public_id: string; is_favorite: boolean }>(`/links/${enc(id)}/favorite`, favorite === undefined ? undefined : { favorite }),
  setVisibility: (id: string, visibility: Visibility) => api.patch<OwnedLink>(`/links/${enc(id)}/visibility`, { visibility }),
  setResharing: (id: string, allow_resharing: boolean) =>
    api.patch<{ public_id: string; allow_resharing: boolean }>(`/links/${enc(id)}/sharing-settings`, { allow_resharing }),
  addTags: (id: string, tags: string[]) => api.post<OwnedLink>(`/links/${enc(id)}/tags`, { tags }),
  removeTag: (id: string, slug: string) => api.delete<OwnedLink>(`/links/${enc(id)}/tags/${enc(slug)}`),
  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<OwnedLink>(`/links/${enc(id)}/cover`, form);
  },
  deleteCover: (id: string) => api.delete<OwnedLink>(`/links/${enc(id)}/cover`),
  reanalyze: (id: string) => api.post<Processing>(`/links/${enc(id)}/reanalyze`),
  processingStatus: (id: string, signal?: AbortSignal) => api.get<Processing>(`/links/${enc(id)}/processing-status`, undefined, { signal }).then((r) => r.data),
  open: (id: string) => api.get<OpenLinkResult>(`/links/${enc(id)}/open`).then((r) => r.data),
  security: (id: string) => api.get<SecurityDetails>(`/links/${enc(id)}/security`).then((r) => r.data),
  rescan: (id: string) => api.post<SecurityScan>(`/links/${enc(id)}/security/rescan`),
  appeal: (id: string, reason: string) => api.post<Appeal>(`/links/${enc(id)}/security/appeal`, { reason }),
};

// ─────────────────────────────────────────────────────────────── Sharing

export const sharingApi = {
  invite: (linkId: string, email: string) => api.post<Invitation>(`/links/${enc(linkId)}/invitations`, { email }),
  invitations: (linkId: string, page = 1) => api.page<Invitation>(`/links/${enc(linkId)}/invitations`, { page, per_page: 50 }),
  revokeInvitation: (linkId: string, invitationId: string) => api.delete<null>(`/links/${enc(linkId)}/invitations/${enc(invitationId)}`),
  access: (linkId: string) =>
    api.get<Grant[], AccessMeta>(`/links/${enc(linkId)}/access`).then((r) => ({ grants: r.data, meta: r.meta as AccessMeta | undefined })),
  revokeGrant: (linkId: string, grantId: string) => api.delete<{ revoked_users: number }>(`/links/${enc(linkId)}/access/${enc(grantId)}`),
  acceptByToken: (token: string) => api.post<ViewerLink>(`/invitations/${enc(token)}/accept`),
  acceptById: (invitationId: string) => api.post<ViewerLink>(`/me/invitations/${enc(invitationId)}/accept`),
  received: (page = 1) => api.page<ReceivedInvitation, { email_verified?: boolean }>('/me/invitations', { page }),
  sharedWithMe: (params: SharedListParams = {}, signal?: AbortSignal) => api.page<ViewerLink>('/shared-with-me', q(params), { signal }),
};

// ─────────────────────────────────────────────────────────────── Collections

export interface CollectionPayload {
  name?: string;
  description?: string | null;
  visibility?: Visibility;
  cover_image_url?: string | null;
  sort_order?: number;
}

export const collectionsApi = {
  list: (page = 1, perPage = 50) => api.page<Collection>('/collections', { page, per_page: perPage }),
  get: (id: string) => api.get<Collection>(`/collections/${enc(id)}`).then((r) => r.data),
  create: (payload: CollectionPayload) => api.post<Collection>('/collections', payload),
  update: (id: string, payload: CollectionPayload) => api.patch<Collection>(`/collections/${enc(id)}`, payload),
  remove: (id: string) => api.delete<null>(`/collections/${enc(id)}`),
  addLinks: (id: string, links: string[]) => api.post<{ added: number }>(`/collections/${enc(id)}/links`, { links }),
  removeLink: (id: string, linkId: string) => api.delete<null>(`/collections/${enc(id)}/links/${enc(linkId)}`),
  reorder: (id: string, links: string[]) => api.patch<null>(`/collections/${enc(id)}/reorder`, { links }),
};

// ─────────────────────────────────────────────────────────────── Taxonomy, search, notifications

export const taxonomyApi = {
  categories: () => api.get<Category[]>('/categories').then((r) => r.data),
  tags: (query?: string) => api.get<Tag[]>('/tags', { q: query }).then((r) => r.data),
};

export const searchApi = {
  links: (params: SearchParams, signal?: AbortSignal) => api.page<AnyLink, { scope?: string }>('/search', q({ ...params, type: 'links' }), { signal }),
  collections: (params: SearchParams, signal?: AbortSignal) =>
    api.get<Collection[]>('/search', q({ ...params, type: 'collections' }), { signal }).then((r) => toPage(r)),
};

export const notificationsApi = {
  list: (params: { page?: number; unread?: boolean } = {}) => api.page<AppNotification>('/notifications', q(params)),
  unreadCount: (signal?: AbortSignal) => api.get<{ unread: number }>('/notifications/unread-count', undefined, { signal }).then((r) => r.data.unread),
  markRead: (id: string) => api.patch<AppNotification>(`/notifications/${enc(id)}/read`),
  markAllRead: () => api.post<{ updated: number }>('/notifications/read-all'),
};

// ─────────────────────────────────────────────────────────────── Public (browser-side, client components)

export const publicApi = {
  links: (params: PublicListParams = {}, signal?: AbortSignal) => api.page<PublicLink>('/public/links', q(params), { signal }),
  search: (params: PublicListParams & { q: string }, signal?: AbortSignal) => api.page<PublicLink>('/public/search', q(params), { signal }),
  link: (id: string) => api.get<PublicLink>(`/public/links/${enc(id)}`).then((r) => r.data),
  categories: () => api.get<Category[]>('/public/categories').then((r) => r.data),
  tags: (query?: string) => api.get<Tag[]>('/public/tags', { q: query }).then((r) => r.data),
  user: (username: string) => api.get<PublicUser>(`/public/users/${enc(username)}`).then((r) => r.data),
  userLinks: (username: string, params: PublicListParams = {}) => api.page<PublicLink>(`/public/users/${enc(username)}/links`, q(params)),
  userCollections: (username: string, page = 1) => api.page<Collection>(`/public/users/${enc(username)}/collections`, { page }),
  collection: (id: string, page = 1) => api.page<PublicLink, { collection: Collection }>(`/public/collections/${enc(id)}`, { page }),
};

// ─────────────────────────────────────────────────────────────── Admin (role-gated by the backend)

export interface CategoryPayload {
  slug?: string;
  name_ar?: string;
  name_en?: string;
  description_ar?: string | null;
  description_en?: string | null;
  parent?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export const adminApi = {
  appeals: (status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING', page = 1) => api.page<AdminAppeal>('/admin/security/appeals', { status, page }),
  resolveAppeal: (id: string, payload: { decision: 'APPROVE' | 'REJECT'; verdict?: 'CLEAR' | 'SUSPICIOUS'; notes?: string | null }) =>
    api.post<AdminAppeal>(`/admin/security/appeals/${enc(id)}/resolve`, payload),
  setVerdict: (linkId: number, payload: { verdict: 'CLEAR' | 'SUSPICIOUS' | 'MALICIOUS'; notes?: string | null }) =>
    api.patch<{ link_id: number; security_status: string }>(`/admin/security/links/${linkId}`, payload),
  categories: () => api.get<Category[]>('/admin/categories').then((r) => r.data),
  createCategory: (payload: CategoryPayload) => api.post<Category>('/admin/categories', payload),
  updateCategory: (slug: string, payload: CategoryPayload) => api.patch<Category>(`/admin/categories/${enc(slug)}`, payload),
  deactivateCategory: (slug: string) => api.delete<null>(`/admin/categories/${enc(slug)}`),
  auditLogs: (params: { action?: string; target_type?: string; target_id?: string; page?: number } = {}) => api.page<AuditLog>('/admin/audit-logs', q(params)),
};
