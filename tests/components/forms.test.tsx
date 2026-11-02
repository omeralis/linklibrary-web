import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';
import { AddLinkProvider, useAddLink } from '@/components/links/add-link-provider';
import { PaginationBar } from '@/components/common/pagination-bar';
import { renderWithProviders, jsonResponse } from '../test-utils';
import { ownedLink } from '../fixtures';

afterEach(() => vi.unstubAllGlobals());

function cookieJar() {
  let cookie = 'XSRF-TOKEN=test';
  Object.defineProperty(document, 'cookie', { configurable: true, get: () => cookie, set: (v: string) => (cookie = v) });
}

describe('LoginForm', () => {
  it('validates on the client with translated messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: false, message: 'Unauthenticated', errors: {}, code: 'UNAUTHENTICATED' }, 401)));
    renderWithProviders(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findAllByText('This field is required.')).toHaveLength(2);
  });

  it('maps a backend 422 onto the e-mail field', async () => {
    cookieJar();
    const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.endsWith('/auth/me')) return jsonResponse({ success: false, message: 'x', errors: {}, code: 'UNAUTHENTICATED' }, 401);
      return jsonResponse({ success: false, message: 'The given data was invalid.', errors: { email: ['These credentials do not match our records.'] }, code: 'VALIDATION_ERROR' }, 422);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderWithProviders(<LoginForm />);
    await userEvent.type(screen.getByLabelText('E-mail'), 'sara@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('These credentials do not match our records.')).toBeInTheDocument();
    const login = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/auth/login'))!;
    expect(JSON.parse(login[1]!.body as string)).toEqual({ email: 'sara@example.com', password: 'wrong-password', remember: true });
  });
});

function Opener() {
  const addLink = useAddLink();
  return <button onClick={() => addLink.open()}>open</button>;
}

describe('Add link dialog', () => {
  it('normalises the URL, posts it and handles duplicates', async () => {
    cookieJar();
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, message: 'You have already saved this link.', data: ownedLink(), meta: { already_saved: true } }));
    vi.stubGlobal('fetch', fetchMock);
    renderWithProviders(
      <AddLinkProvider>
        <Opener />
      </AddLinkProvider>,
    );
    await userEvent.click(screen.getByText('open'));
    await userEvent.type(await screen.findByLabelText('Web address'), 'laravel.com/docs/queues');
    await userEvent.click(screen.getByRole('button', { name: 'Save link' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://localhost:8000/api/v1/links');
    expect(JSON.parse(init.body as string)).toEqual({ url: 'https://laravel.com/docs/queues' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows URL_NOT_ALLOWED from the backend on the URL field', async () => {
    cookieJar();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ success: false, message: 'This URL points to a destination that is not allowed.', errors: { url: ['This URL points to a destination that is not allowed.'] }, code: 'URL_NOT_ALLOWED' }, 422)));
    renderWithProviders(
      <AddLinkProvider>
        <Opener />
      </AddLinkProvider>,
    );
    await userEvent.click(screen.getByText('open'));
    await userEvent.type(await screen.findByLabelText('Web address'), 'http://192.168.1.1.nip.io/admin');
    await userEvent.click(screen.getByRole('button', { name: 'Save link' }));
    expect(await screen.findByText('This URL points to a destination that is not allowed.')).toBeInTheDocument();
  });

  it('rejects javascript: URLs before calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderWithProviders(
      <AddLinkProvider>
        <Opener />
      </AddLinkProvider>,
    );
    await userEvent.click(screen.getByText('open'));
    await userEvent.type(await screen.findByLabelText('Web address'), 'javascript:alert(1)');
    await userEvent.click(screen.getByRole('button', { name: 'Save link' }));
    expect(await screen.findByText('Enter a valid http(s) web address.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('PaginationBar', () => {
  it('is hidden for a single page and disables Next on the last page', async () => {
    const onPage = vi.fn();
    const { container, unmount } = renderWithProviders(<PaginationBar pagination={{ current_page: 1, per_page: 20, has_more: false }} onPageChange={onPage} />);
    expect(container).toBeEmptyDOMElement();
    unmount();
    renderWithProviders(<PaginationBar pagination={{ current_page: 2, per_page: 20, has_more: false, last_page: 2, total: 30 }} onPageChange={onPage} />);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(onPage).toHaveBeenCalledWith(1);
  });
});
