import { ApiError } from './errors';
import { API_ORIGIN, API_PREFIX, REQUEST_TIMEOUT_MS } from './config';
import { toQueryString, type QueryParams } from './query-string';
import type { ApiEnvelope, Paginated, Pagination } from './types';

/**
 * Browser API client for the Laravel Sanctum SPA (cookie) flow — see FRONTEND_INTEGRATION_HANDOFF §2.1.
 *
 * - Always `credentials: 'include'` so the HttpOnly session cookie travels with every request.
 * - Mutating requests send `X-XSRF-TOKEN` (read from the readable XSRF-TOKEN cookie); the cookie is
 *   fetched from /sanctum/csrf-cookie when missing, and refreshed + retried once on 419.
 * - No token is ever stored in localStorage/sessionStorage.
 * - Authenticated responses are never cached (`cache: 'no-store'`).
 */

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Override the Accept-Language header (defaults to <html lang>). */
  locale?: string;
}

let csrfPromise: Promise<void> | null = null;

export function readXsrfToken(cookieString: string = typeof document !== 'undefined' ? document.cookie : ''): string {
  const match = cookieString.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/** Ensures the XSRF-TOKEN cookie exists. Concurrent callers share one request. */
export async function ensureCsrfCookie(force = false): Promise<void> {
  if (!force && readXsrfToken()) return;
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
      .then((res) => {
        if (!res.ok && res.status !== 204) throw new ApiError(res.status, 'CSRF_COOKIE_FAILED', '');
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) throw error;
        throw new ApiError(0, 'NETWORK_ERROR', '');
      })
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

function currentLocale(): string {
  if (typeof document !== 'undefined' && document.documentElement.lang) return document.documentElement.lang;
  return 'ar';
}

function combineSignals(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  let didTimeout = false;
  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return undefined; // Non-JSON (HTML error page, proxy error…)
  }
}

export async function request<T, M = Record<string, unknown>>(path: string, options: RequestOptions = {}, isRetry = false): Promise<ApiEnvelope<T, M>> {
  const method = options.method ?? 'GET';
  const mutating = method !== 'GET';
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (mutating) await ensureCsrfCookie();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': options.locale ?? currentLocale(),
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (!isForm && options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (mutating) headers['X-XSRF-TOKEN'] = readXsrfToken();

  const { signal, timedOut, cleanup } = combineSignals(options.signal, options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_ORIGIN}${API_PREFIX}${path}${toQueryString(options.query)}`, {
      method,
      credentials: 'include',
      cache: 'no-store',
      headers,
      body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
      signal,
    });
  } catch (error) {
    if (timedOut()) throw new ApiError(0, 'TIMEOUT', '');
    if (options.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new ApiError(0, 'ABORTED', '');
    }
    throw new ApiError(0, 'NETWORK_ERROR', '');
  } finally {
    cleanup();
  }

  const body = (await parseBody(res)) as { success?: boolean } | null | undefined;

  if (res.status === 419 && !isRetry && mutating) {
    await ensureCsrfCookie(true);
    return request<T, M>(path, options, true);
  }

  if (!res.ok || body?.success === false) {
    const retryAfterHeader = res.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) || null : null;
    throw ApiError.fromBody(res.status, (body as never) ?? null, retryAfter);
  }

  if (body === undefined) throw new ApiError(res.status, 'INVALID_RESPONSE', '');
  return (body ?? { success: true, message: null, data: null }) as unknown as ApiEnvelope<T, M>;
}

/** Unwraps a paginated envelope into `{ items, pagination, meta }`. */
export async function requestPage<T, M = Record<string, unknown>>(path: string, options: RequestOptions = {}): Promise<Paginated<T, M>> {
  const envelope = await request<T[], M>(path, options);
  return toPage(envelope);
}

export function toPage<T, M>(envelope: ApiEnvelope<T[], M>): Paginated<T, M> {
  const { pagination, ...rest } = (envelope.meta ?? {}) as M & { pagination?: Pagination };
  const items = Array.isArray(envelope.data) ? envelope.data : [];
  return {
    items,
    pagination: pagination ?? { current_page: 1, per_page: items.length, has_more: false, total: items.length, last_page: 1 },
    meta: rest as M,
  };
}

export const api = {
  get: <T, M = Record<string, unknown>>(path: string, query?: QueryParams, opts: Omit<RequestOptions, 'method' | 'query'> = {}) =>
    request<T, M>(path, { ...opts, query }),
  page: <T, M = Record<string, unknown>>(path: string, query?: QueryParams, opts: Omit<RequestOptions, 'method' | 'query'> = {}) =>
    requestPage<T, M>(path, { ...opts, query }),
  post: <T, M = Record<string, unknown>>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T, M>(path, { ...opts, method: 'POST', body }),
  patch: <T, M = Record<string, unknown>>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T, M>(path, { ...opts, method: 'PATCH', body }),
  delete: <T, M = Record<string, unknown>>(path: string, query?: QueryParams, opts: Omit<RequestOptions, 'method' | 'query'> = {}) =>
    request<T, M>(path, { ...opts, method: 'DELETE', query }),
};
