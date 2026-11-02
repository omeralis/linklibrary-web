import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecurityBadge, ProcessingBadge } from '@/components/links/status-badges';
import { OpenLinkButton } from '@/components/links/open-link-button';
import { OwnerSharingPanel } from '@/components/sharing/owner-sharing-panel';
import { renderWithProviders, jsonResponse } from '../test-utils';
import { ownedLink, publicLink, user, viewerLink } from '../fixtures';

afterEach(() => vi.unstubAllGlobals());

describe('SecurityBadge', () => {
  it('never says "safe" and labels every status in text (not colour only)', () => {
    renderWithProviders(<SecurityBadge status="CLEAR" showTooltip={false} />);
    expect(screen.getByText('No threats found')).toBeInTheDocument();
    expect(screen.queryByText(/safe/i)).not.toBeInTheDocument();
  });
  it('renders Arabic labels', () => {
    renderWithProviders(<SecurityBadge status="MALICIOUS" showTooltip={false} />, { locale: 'ar' });
    expect(screen.getByText('خطِر')).toBeInTheDocument();
  });
  it('can be hidden for CLEAR in dense lists', () => {
    const { container } = renderWithProviders(<SecurityBadge status="CLEAR" hideWhenClear />);
    expect(container).toBeEmptyDOMElement();
  });
  it('processing badge announces status', () => {
    renderWithProviders(<ProcessingBadge status="PROCESSING" />);
    expect(screen.getByRole('status')).toHaveTextContent('Processing');
  });
});

describe('OpenLinkButton (safe external navigation)', () => {
  it('renders a noopener/noreferrer new-tab link for CLEAR links', () => {
    renderWithProviders(<OpenLinkButton link={publicLink()} />);
    const a = screen.getByRole('link', { name: /open/i });
    expect(a).toHaveAttribute('href', 'https://laravel.com/docs/queues');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(a.getAttribute('rel')).toContain('noreferrer');
  });
  it('is disabled for blocked links (MALICIOUS: can_open=false)', () => {
    renderWithProviders(<OpenLinkButton link={viewerLink({ open_url: null, security: { status: 'MALICIOUS', can_open: false, warning: 'security.malicious', checked_at: null } })} />);
    expect(screen.getByRole('button', { name: /blocked/i })).toBeDisabled();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('refuses javascript: URLs even if the API returned one', () => {
    renderWithProviders(<OpenLinkButton link={publicLink({ open_url: 'javascript:alert(1)' })} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('shows a warning interstitial and re-checks via GET /links/{id}/open for unverified links', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, message: null, data: { url: 'https://unknown.example/x', security_status: 'UNKNOWN', warning: true } }));
    vi.stubGlobal('fetch', fetchMock);
    const link = ownedLink({ security: { status: 'UNKNOWN', can_open: true, warning: 'security.unknown', checked_at: null } });
    renderWithProviders(<OpenLinkButton link={link} />);
    await userEvent.click(screen.getByRole('button', { name: /open/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Open with caution')).toBeInTheDocument();
    const go = await within(dialog).findByRole('link', { name: /continue to site/i });
    expect(go).toHaveAttribute('href', 'https://unknown.example/x');
    expect(fetchMock.mock.calls[0][0]).toContain(`/api/v1/links/${link.public_id}/open`);
  });
});

describe('OwnerSharingPanel respects backend restrictions', () => {
  it('disables publishing and inviting for UNKNOWN links and explains why', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, message: null, data: [], meta: { pagination: { current_page: 1, per_page: 50, has_more: false } } })));
    const link = ownedLink({
      security: { status: 'UNKNOWN', can_open: true, warning: 'security.unknown', checked_at: null },
      permissions: { can_edit: true, can_delete: true, can_change_visibility: true, can_publish: false, can_share: false, can_reshare: true },
    });
    renderWithProviders(<OwnerSharingPanel link={link} user={user} />);
    expect(screen.getByRole('switch', { name: /make this link public/i })).toBeDisabled();
    expect(screen.getByPlaceholderText('name@example.com')).toBeDisabled();
    expect(screen.getAllByText(/couldn't be verified/i).length).toBeGreaterThan(0);
  });
  it('requires a verified e-mail even for CLEAR links', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, message: null, data: [] })));
    renderWithProviders(<OwnerSharingPanel link={ownedLink()} user={{ ...user, email_verified: false }} />);
    expect(screen.getByRole('switch', { name: /make this link public/i })).toBeDisabled();
    expect(screen.getAllByText(/verify your e-mail/i).length).toBeGreaterThan(0);
  });
  it('enables both for a CLEAR link and a verified owner', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, message: null, data: [] })));
    renderWithProviders(<OwnerSharingPanel link={ownedLink()} user={user} />);
    expect(screen.getByRole('switch', { name: /make this link public/i })).toBeEnabled();
    expect(screen.getByPlaceholderText('name@example.com')).toBeEnabled();
  });
});
