import 'server-only';
import { headers } from 'next/headers';
import { ApiError } from './errors';
import { API_ORIGIN, API_PREFIX } from './config';
import { toQueryString, type QueryParams } from './query-string';
import type { ApiEnvelope, Category, Collection, Paginated, PublicLink, PublicListParams, PublicUser } from './types';
import { toPage } from './client';

/**
 * Server-side fetcher for PUBLIC endpoints only (Server Components, metadata, sitemap).
 * Authenticated data is never fetched on the server: the Sanctum session cookie belongs to the API
 * origin and authenticated responses must not be cached (handoff §7).
 *
 * When FRONTEND_SERVER_KEY is configured (server-only env var, matching the backend), the request
 * carries X-Frontend-Key + X-Client-IP so the API rate-limits per visitor instead of per server.
 */
const SERVER_API_ORIGIN = (process.env.API_INTERNAL_URL || API_ORIGIN).replace(/\/+$/, '');
const REVALIDATE_SECONDS = 30;
const SERVER_TIMEOUT_MS = 8_000;

async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded || h.get('x-real-ip') || null;
  } catch {
    return null; // Outside a request scope (e.g. build-time sitemap)
  }
}

async function publicGet<T, M = Record<string, unknown>>(path: string, locale: string, query?: QueryParams): Promise<ApiEnvelope<T, M>> {
  const hdrs: Record<string, string> = { Accept: 'application/json', 'Accept-Language': locale };
  const key = process.env.FRONTEND_SERVER_KEY;
  if (key) {
    hdrs['X-Frontend-Key'] = key;
    const ip = await clientIp();
    if (ip) hdrs['X-Client-IP'] = ip;
  }
  let res: Response;
  try {
    res = await fetch(`${SERVER_API_ORIGIN}${API_PREFIX}${path}${toQueryString({ ...query, locale })}`, {
      headers: hdrs,
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(SERVER_TIMEOUT_MS),
    });
  } catch (error) {
    const timeout = error instanceof DOMException && error.name === 'TimeoutError';
    throw new ApiError(0, timeout ? 'TIMEOUT' : 'NETWORK_ERROR', '');
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || (body as { success?: boolean } | null)?.success === false) {
    throw ApiError.fromBody(res.status, body as never, Number(res.headers.get('Retry-After')) || null);
  }
  return body as ApiEnvelope<T, M>;
}

const enc = encodeURIComponent;
const asQuery = (p: object) => p as QueryParams;

export const serverPublicApi = {
  links: async (locale: string, params: PublicListParams = {}): Promise<Paginated<PublicLink>> =>
    toPage(await publicGet<PublicLink[]>('/public/links', locale, asQuery(params))),
  search: async (locale: string, params: PublicListParams & { q: string }): Promise<Paginated<PublicLink>> =>
    toPage(await publicGet<PublicLink[]>('/public/search', locale, asQuery(params))),
  link: async (locale: string, id: string) => (await publicGet<PublicLink>(`/public/links/${enc(id)}`, locale)).data,
  categories: async (locale: string) => (await publicGet<Category[]>('/public/categories', locale)).data,
  user: async (locale: string, username: string) => (await publicGet<PublicUser>(`/public/users/${enc(username)}`, locale)).data,
  userLinks: async (locale: string, username: string, params: PublicListParams = {}) =>
    toPage(await publicGet<PublicLink[]>(`/public/users/${enc(username)}/links`, locale, asQuery(params))),
  userCollections: async (locale: string, username: string, page = 1) =>
    toPage(await publicGet<Collection[]>(`/public/users/${enc(username)}/collections`, locale, { page })),
  collection: async (locale: string, id: string, page = 1) =>
    toPage(await publicGet<PublicLink[], { collection: Collection }>(`/public/collections/${enc(id)}`, locale, { page })),
};

/** Runs a server fetch and turns 404 into `null` (privacy rule: 404 = "not available"). */
export async function orNotFound<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Runs a server fetch and returns an error object instead of throwing (renders an inline error state). */
export async function settle<T>(promise: Promise<T>): Promise<{ data: T; error: null } | { data: null; error: ApiError }> {
  try {
    return { data: await promise, error: null };
  } catch (error) {
    return { data: null, error: error instanceof ApiError ? error : new ApiError(0, 'NETWORK_ERROR', '') };
  }
}
