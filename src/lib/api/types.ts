/**
 * Domain types for the LinkLibrary API (v1).
 *
 * These are hand-curated from the backend resources (app/Http/Resources/*.php) because the OpenAPI
 * contract marks every property optional. `contract-check.ts` asserts at compile time that each type
 * stays assignable to the generated OpenAPI schema (`schema.d.ts`), so drift fails `npm run typecheck`.
 */

export type Locale = 'ar' | 'en';
export type Theme = 'system' | 'light' | 'dark';
export type Visibility = 'PRIVATE' | 'PUBLIC';
export type SecurityStatus = 'PENDING' | 'CLEAR' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'BLOCKED';
export type SourceType = 'WEBSITE' | 'ARTICLE' | 'VIDEO' | 'PLAYLIST' | 'PDF' | 'REPOSITORY' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
export type AccessRole = 'owner' | 'viewer' | 'public';

// ───────────────────────────────────────────── Envelope

export interface Pagination {
  current_page: number;
  per_page: number;
  has_more: boolean;
  total?: number;
  last_page?: number;
}

export interface ApiEnvelope<T, M = Record<string, unknown>> {
  success: true;
  message: string | null;
  data: T;
  meta?: M & { pagination?: Pagination };
}

export interface Paginated<T, M = Record<string, unknown>> {
  items: T[];
  pagination: Pagination;
  meta: M;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors: Record<string, string[]>;
  code: string;
}

// ───────────────────────────────────────────── Users

export interface User {
  public_id: string;
  name: string;
  username: string;
  email: string;
  email_verified: boolean;
  email_verified_at: string | null;
  avatar_url: string | null;
  bio: string | null;
  locale: Locale;
  theme: Theme;
  profile_public: boolean;
  is_admin: boolean;
  created_at: string | null;
}

export interface AuthResult {
  user: User;
  auth_mode: 'session' | 'token';
  token?: string;
  token_type?: 'Bearer';
  expires_at?: string | null;
}

export interface PublicUserSummary {
  username: string;
  name: string;
  avatar_url: string | null;
  profile_url: string;
}

export interface PublicUser {
  username: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  profile_url: string;
  joined_at: string;
  stats: { public_links: number; public_collections: number };
}

export interface UserSession {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  last_active_at: string | null;
  current: boolean;
}

export interface ApiToken {
  id: number;
  name: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  current: boolean;
}

// ───────────────────────────────────────────── Taxonomy

export interface CategoryBrief {
  slug: string;
  name: string;
  name_ar: string;
  name_en: string;
}

export interface Category extends CategoryBrief {
  description: string | null;
  description_ar: string | null;
  description_en: string | null;
  parent_slug?: string | null;
  sort_order: number;
  is_active?: boolean;
  links_count?: number;
}

export interface Tag {
  name: string;
  slug: string;
  links_count?: number;
}

export interface LinkTag {
  name: string;
  slug: string;
  source: 'USER' | 'AI' | null;
}

// ───────────────────────────────────────────── Links

export interface LinkSecurity {
  status: SecurityStatus;
  can_open: boolean;
  /** Translation key such as "security.unknown", or null when no warning is required. */
  warning: string | null;
  checked_at: string | null;
}

export interface LinkAi {
  summary: string | null;
  detailed_summary: string | null;
  suggested_title: string | null;
  suggested_category: CategoryBrief | null;
  suggested_tags: string[];
  generated: true;
}

export interface Processing {
  status: ProcessingStatus;
  security: SecurityStatus;
  extraction: string;
  extraction_error_code: string | null;
  ai: string;
  ai_enabled: boolean;
}

export interface LinkPermissions {
  can_edit: boolean;
  can_delete: boolean;
  can_change_visibility: boolean;
  can_publish?: boolean;
  can_share?: boolean;
  can_reshare: boolean;
}

/** Public representation (`access_role: "public"`). */
export interface PublicLink {
  public_id: string;
  internal_path: string;
  frontend_url: string;
  access_role: AccessRole;
  title: string;
  description: string | null;
  image_url: string | null;
  favicon_url: string | null;
  site_name: string | null;
  hostname: string;
  source_type: SourceType;
  language: string | null;
  author: string | null;
  source_published_at: string | null;
  category: CategoryBrief | null;
  tags: LinkTag[];
  ai: LinkAi | null;
  url: string | null;
  open_url: string | null;
  security: LinkSecurity;
  owner: PublicUserSummary | null;
  published_at: string | null;
}

/** Viewer representation (link shared with the current user). */
export interface ViewerLink extends PublicLink {
  access_role: 'viewer';
  shared_by: string | null;
  permissions: LinkPermissions;
}

export type LinkOverrides = {
  title: string | null;
  description: string | null;
  image_url: string | null;
  source_type: SourceType | null;
  category: CategoryBrief | null;
};

export type LinkExtracted = {
  title: string | null;
  description: string | null;
  image_url: string | null;
  canonical_url: string | null;
  content_type: string | null;
  source_type: SourceType;
  status: string;
  error_code: string | null;
  extracted_at: string | null;
};

/** Owner representation. */
export interface OwnedLink extends PublicLink {
  access_role: 'owner';
  visibility: Visibility;
  allow_resharing: boolean;
  is_favorite: boolean;
  notes: string | null;
  overrides: LinkOverrides;
  extracted: LinkExtracted;
  processing_status: ProcessingStatus;
  processing: Processing;
  permissions: Required<LinkPermissions>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type AnyLink = PublicLink | ViewerLink | OwnedLink;

export function isOwnedLink(link: AnyLink): link is OwnedLink {
  return link.access_role === 'owner';
}
export function isViewerLink(link: AnyLink): link is ViewerLink {
  return link.access_role === 'viewer';
}

export interface OpenLinkResult {
  url: string;
  security_status: SecurityStatus;
  warning: boolean;
}

// ───────────────────────────────────────────── Security

export interface SecurityScan {
  trigger: string;
  status: string;
  verdict: SecurityStatus | null;
  providers: { provider: string | null; verdict: string | null; threats: string[]; error_code: string | null }[];
  error_code: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface Appeal {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  security_status_at_submission: SecurityStatus;
  reason: string;
  resolution_verdict: string | null;
  reviewer_notes: string | null;
  resolved_at: string | null;
  created_at: string | null;
}

export interface AdminAppeal extends Appeal {
  link: { id: number; url: string; hostname: string; security_status: SecurityStatus };
  submitted_by: { username: string };
}

export interface SecurityDetails {
  status: SecurityStatus;
  stored_status: SecurityStatus;
  source: 'PROVIDER' | 'MANUAL_REVIEW';
  checked_at: string | null;
  expires_at: string | null;
  can_publish: boolean;
  can_share: boolean;
  can_open: boolean;
  disclaimer: string;
  history: SecurityScan[];
  appeals: Appeal[];
}

// ───────────────────────────────────────────── Collections

export interface Collection {
  public_id: string;
  frontend_url: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  items_count: number | null;
  owner: PublicUserSummary | null;
  /** Owner representation only. */
  visibility?: Visibility;
  sort_order?: number;
  items?: OwnedLink[];
  created_at: string | null;
  updated_at: string | null;
}

// ───────────────────────────────────────────── Sharing

export type PersonRef = {
  username: string;
  name: string;
};

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface Invitation {
  id: string;
  email: string;
  status: InvitationStatus;
  invited_by?: PersonRef;
  via_reshare: boolean;
  expires_at: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string | null;
}

export interface ReceivedInvitation {
  id: string;
  invited_by: PersonRef;
  expires_at: string | null;
  created_at: string | null;
}

export interface Grant {
  id: string;
  grantee: PersonRef;
  grantor: PersonRef;
  parent_grant_id: string | null;
  depth: number;
  status: 'ACTIVE' | 'REVOKED';
  effective: boolean;
  revoke_reason: string | null;
  created_at: string | null;
  revoked_at: string | null;
}

export interface AccessMeta {
  allow_resharing: boolean;
  viewer_count: number;
}

// ───────────────────────────────────────────── Notifications

export type NotificationKind =
  | 'sharing.invitation_received'
  | 'sharing.invitation_accepted'
  | 'sharing.access_revoked'
  | 'security.warning'
  | 'processing.failed'
  | 'account.password_changed'
  | (string & {});

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  data: {
    link_id?: string;
    invitation_id?: string;
    inviter_name?: string;
    accepted_by_name?: string;
    expires_at?: string;
    security_status?: SecurityStatus;
    stage?: string;
    error_code?: string | null;
    [key: string]: unknown;
  };
  read: boolean;
  read_at: string | null;
  created_at: string | null;
}

// ───────────────────────────────────────────── Admin

export interface AuditLog {
  id: number;
  action: string;
  actor: string | null;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

// ───────────────────────────────────────────── Query params

export type LinkSort = 'latest' | 'oldest' | 'title' | 'popular' | 'relevance';

export interface LinkListParams {
  q?: string;
  favorite?: boolean;
  visibility?: Visibility;
  category?: string;
  tag?: string;
  source_type?: SourceType;
  security_status?: SecurityStatus;
  collection?: string;
  trashed?: 'only' | 'with';
  sort?: LinkSort;
  page?: number;
  per_page?: number;
}

export interface PublicListParams {
  q?: string;
  category?: string;
  tag?: string;
  source_type?: SourceType;
  language?: Locale;
  sort?: 'latest' | 'popular' | 'relevance';
  page?: number;
  per_page?: number;
}

export interface SearchParams {
  q: string;
  scope?: 'own' | 'shared' | 'all';
  type?: 'links' | 'collections';
  category?: string;
  tag?: string;
  source_type?: SourceType;
  favorite?: boolean;
  sort?: 'relevance' | 'latest' | 'popular';
  page?: number;
  per_page?: number;
}

export interface SharedListParams {
  q?: string;
  category?: string;
  tag?: string;
  source_type?: SourceType;
  sort?: LinkSort;
  page?: number;
  per_page?: number;
}
