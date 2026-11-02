import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request, readXsrfToken, toPage } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { jsonResponse } from '../test-utils';

function setCookie(value: string) {
  Object.defineProperty(document, 'cookie', { configurable: true, get: () => value, set: () => undefined });
}

describe('API client (Sanctum SPA flow)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    document.documentElement.lang = 'ar';
    setCookie('');
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('reads the XSRF cookie', () => {
    expect(readXsrfToken('a=1; XSRF-TOKEN=abc%3D%3D; b=2')).toBe('abc==');
    expect(readXsrfToken('a=1')).toBe('');
  });

  it('GET sends credentials, Accept-Language and no XSRF header', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: null, data: { ok: 1 } }));
    const res = await request<{ ok: number }>('/auth/me');
    expect(res.data.ok).toBe(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8000/api/v1/auth/me');
    expect(init.credentials).toBe('include');
    expect(init.cache).toBe('no-store');
    expect(init.headers['Accept-Language']).toBe('ar');
    expect(init.headers['X-XSRF-TOKEN']).toBeUndefined();
  });

  it('fetches /sanctum/csrf-cookie before the first mutation and sends X-XSRF-TOKEN', async () => {
    let cookie = '';
    Object.defineProperty(document, 'cookie', { configurable: true, get: () => cookie, set: () => undefined });
    fetchMock.mockImplementationOnce(async () => {
      cookie = 'XSRF-TOKEN=tok%2B1';
      return new Response(null, { status: 204 });
    });
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: 'ok', data: null }));
    await request('/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' } });
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8000/sanctum/csrf-cookie');
    const init = fetchMock.mock.calls[1][1];
    expect(init.headers['X-XSRF-TOKEN']).toBe('tok+1');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ email: 'a@b.c', password: 'x' });
  });

  it('refreshes the CSRF cookie and retries once on 419', async () => {
    setCookie('XSRF-TOKEN=old');
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: false, message: 'expired', errors: {}, code: 'CSRF_TOKEN_MISMATCH' }, 419))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: null, data: 1 }));
    const res = await request<number>('/links', { method: 'POST', body: { url: 'https://x.com' } });
    expect(res.data).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/sanctum/csrf-cookie');
  });

  it('does not send a JSON content type for FormData uploads', async () => {
    setCookie('XSRF-TOKEN=t');
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, message: null, data: null }));
    const form = new FormData();
    form.append('image', new Blob(['x']), 'a.png');
    await request('/me/avatar', { method: 'POST', body: form });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.body).toBe(form);
  });

  it.each([
    [401, 'UNAUTHENTICATED'],
    [403, 'EMAIL_NOT_VERIFIED'],
    [404, 'NOT_FOUND'],
    [409, 'ALREADY_SHARED'],
    [422, 'LINK_NOT_PUBLISHABLE'],
    [500, 'SERVER_ERROR'],
  ])('maps HTTP %i to ApiError(%s)', async (status, code) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'msg', errors: { security_status: ['UNKNOWN'] }, code }, status));
    const error = await request('/x').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(error.message).toBe('msg');
  });

  it('exposes 422 field errors and Retry-After on 429', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'invalid', errors: { email: ['Taken.'] }, code: 'VALIDATION_ERROR' }, 422));
    const v = await request('/auth/register').catch((e) => e);
    expect(v.fieldError('email')).toBe('Taken.');
    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, message: 'slow', errors: {}, code: 'RATE_LIMITED' }, 429, { 'Retry-After': '42' }));
    const r = await request('/search').catch((e) => e);
    expect(r.isRateLimited).toBe(true);
    expect(r.retryAfter).toBe(42);
  });

  it('derives a code when the body is not JSON (proxy/HTML error page)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>Bad gateway</html>', { status: 503 }));
    const e = await request('/x').catch((x) => x);
    expect(e.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('reports network failures and timeouts distinctly', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect((await request('/x').catch((e) => e)).code).toBe('NETWORK_ERROR');

    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
    );
    const pending = request('/slow', { timeoutMs: 1000 }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(1001);
    expect((await pending).code).toBe('TIMEOUT');
    vi.useRealTimers();
  });

  it('supports caller cancellation', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
    );
    const pending = request('/x', { signal: controller.signal }).catch((e) => e);
    controller.abort();
    expect((await pending).code).toBe('ABORTED');
  });

  it('unwraps pagination meta', () => {
    const page = toPage({ success: true, message: null, data: [1, 2], meta: { pagination: { current_page: 1, per_page: 2, has_more: true, total: 5, last_page: 3 }, scope: 'own' } });
    expect(page.items).toEqual([1, 2]);
    expect(page.pagination.total).toBe(5);
    expect(page.meta).toEqual({ scope: 'own' });
  });
});
