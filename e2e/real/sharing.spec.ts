import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { Api, createLink, deleteAccount, mailLink, mailLinks, markClear, newUser, runId, seededUser, type TestUser } from './support';

/**
 * Private sharing against the real API: invitations by e-mail (read from the API's mail log), acceptance,
 * read-only viewer representation, resharing, recursive revocation with an independent access path, and
 * refusal for everyone without a valid grant. Five disposable users, one browser context each.
 *
 * Graph built by the test:   owner ─► bob ─► carol
 *                                 │     └──► dave
 *                                 └─────────► dave   (independent direct path)
 * Revoking bob must remove bob and carol, while dave keeps access through the direct grant.
 */
interface Actor {
  user: TestUser;
  ctx: BrowserContext;
  page: Page;
  api: Api;
}

async function actor(browser: Browser, label: string): Promise<Actor> {
  const user = newUser(label);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const api = await seededUser(page, user);
  return { user, ctx, page, api };
}

const token = (url: string) => new URL(url).searchParams.get('token')!;

test.describe.serial('real API — private sharing', () => {
  let owner: Actor, bob: Actor, carol: Actor, dave: Actor, eve: Actor;
  let linkId = '';
  const NOTES = `private owner notes ${runId}`;

  test.beforeAll(async ({ browser }) => {
    [owner, bob, carol, dave, eve] = await Promise.all(['shOwner', 'shBob', 'shCarol', 'shDave', 'shEve'].map((l) => actor(browser, l)));
    const link = await createLink(owner.api, `https://shared-${runId}.e2e-fixture.example.org/guide`, { custom_title: `Shared guide ${runId}`, notes: NOTES });
    linkId = link.public_id;
    await expect.poll(async () => ((await owner.api.get(`/links/${linkId}`)).body.data as { security: { status: string } }).security.status, { timeout: 30_000 }).not.toBe('PENDING');
    markClear(linkId);
  });
  test.afterAll(async () => {
    for (const a of [owner, bob, carol, dave, eve].filter(Boolean)) {
      await deleteAccount(a.ctx, a.user);
      await a.ctx.close();
    }
  });

  test('outsiders cannot see a private link (404, same as non-existent)', async () => {
    const res = await eve.api.get(`/links/${linkId}`);
    expect(res.status).toBe(404);
    expect((await eve.api.get(`/links/${linkId}/access`)).status).toBe(404);
    expect((await eve.api.post(`/links/${linkId}/invitations`, { email: carol.user.email })).status).toBe(404);
    await eve.page.goto(`/en/l/${linkId}`);
    await expect(eve.page.getByRole('heading', { level: 1 })).toHaveText("This link isn't available");
  });

  test('owner invites bob through the UI; the invitation is listed as pending', async () => {
    await owner.page.goto(`/en/dashboard/links/${linkId}?tab=sharing`);
    await owner.page.getByPlaceholder('name@example.com').fill(bob.user.email);
    await owner.page.getByRole('button', { name: 'Invite' }).click();
    await expect(owner.page.getByText('Invitation sent.')).toBeVisible();
    const row = owner.page.getByRole('listitem').filter({ hasText: bob.user.email });
    await expect(row.getByText('Pending', { exact: true })).toBeVisible();
    // Resharing is off by default and the switch explains what it does.
    await expect(owner.page.getByRole('switch', { name: 'Allow resharing' })).toHaveAttribute('aria-checked', 'false');
  });

  test('bob accepts from the e-mail; read-only view without owner-only data', async () => {
    const url = await mailLink(bob.user.email, '/invitations/accept');
    await bob.page.goto(url);
    await bob.page.getByRole('button', { name: 'Accept invitation' }).click();
    await expect(bob.page).toHaveURL(new RegExp(`/en/l/${linkId}$`));
    await expect(bob.page.getByText(`Shared with you by ${owner.user.name}`)).toBeVisible();
    await expect(bob.page.getByText('You have read-only access.')).toBeVisible();
    await expect(bob.page.getByText('Only the owner can share it with others.')).toBeVisible();
    await expect(bob.page.getByText(NOTES)).toHaveCount(0);

    const viewer = await bob.api.get(`/links/${linkId}`);
    expect(viewer.status).toBe(200);
    const body = viewer.body.data as Record<string, unknown>;
    expect(body).not.toHaveProperty('notes');
    expect(JSON.stringify(body)).not.toContain(NOTES);
    expect((body.permissions as { can_reshare: boolean }).can_reshare).toBe(false);
    // Read-only is enforced by the API, not just hidden in the UI.
    expect((await bob.api.patch(`/links/${linkId}`, { custom_title: 'hijack' })).status).toBe(404);
    expect((await bob.api.patch(`/links/${linkId}/visibility`, { visibility: 'PUBLIC' })).status).toBe(404);
    expect((await bob.api.del(`/links/${linkId}`)).status).toBe(404);

    await bob.page.goto('/en/dashboard/shared');
    await expect(bob.page.getByRole('link', { name: `Shared guide ${runId}` })).toBeVisible();
    // Accepting again is idempotent (no second grant is created).
    expect((await bob.api.post(`/invitations/${token(url)}/accept`)).status).toBe(200);
    expect(((await owner.api.get(`/links/${linkId}/access`)).body.data as unknown[]).length).toBe(1);
  });

  test('resharing is refused by the backend until the owner allows it', async () => {
    const denied = await bob.api.post(`/links/${linkId}/invitations`, { email: carol.user.email });
    expect(denied.status).toBe(403);

    await owner.page.goto(`/en/dashboard/links/${linkId}?tab=sharing`);
    await owner.page.getByRole('switch', { name: 'Allow resharing' }).click();
    await expect(owner.page.getByText('Sharing settings updated.')).toBeVisible();
    await expect(owner.page.getByRole('switch', { name: 'Allow resharing' })).toHaveAttribute('aria-checked', 'true');
  });

  test('bob reshares to carol through the UI and to dave; a token only works for its own address', async () => {
    await bob.page.goto(`/en/l/${linkId}`);
    await expect(bob.page.getByText('The owner allows you to share it with others.')).toBeVisible();
    await bob.page.getByPlaceholder('name@example.com').fill(carol.user.email);
    await bob.page.getByRole('button', { name: 'Invite' }).click();
    await expect(bob.page.getByText('Invitation sent.')).toBeVisible();
    expect((await bob.api.post(`/links/${linkId}/invitations`, { email: dave.user.email })).status).toBe(201);

    const carolUrl = await mailLink(carol.user.email, '/invitations/accept');
    // dave must not be able to use carol's invitation.
    const stolen = await dave.api.post(`/invitations/${token(carolUrl)}/accept`);
    expect([403, 404, 422]).toContain(stolen.status);

    await carol.page.goto(carolUrl);
    await carol.page.getByRole('button', { name: 'Accept invitation' }).click();
    await expect(carol.page.getByText(`Shared with you by ${bob.user.name}`)).toBeVisible();
    expect((await carol.api.get(`/links/${linkId}`)).status).toBe(200);

    // dave accepts in-app from "Shared with me → Invitations".
    await dave.page.goto('/en/dashboard/shared?tab=invitations');
    await dave.page.getByRole('button', { name: 'Accept' }).first().click();
    await expect.poll(async () => (await dave.api.get(`/links/${linkId}`)).status).toBe(200);
  });

  test('dave also receives a direct grant from the owner (independent path)', async () => {
    const seen = mailLinks(dave.user.email, '/invitations/accept');
    expect((await owner.api.post(`/links/${linkId}/invitations`, { email: dave.user.email })).status).toBe(201);
    const url = await mailLink(dave.user.email, '/invitations/accept', 20_000, seen);
    const res = await dave.api.post(`/invitations/${token(url)}/accept`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);

    const access = await owner.api.get(`/links/${linkId}/access`);
    const grants = access.body.data as { grantee: { username: string }; grantor: { username: string }; effective: boolean }[];
    const edges = grants.map((g) => `${g.grantor.username}>${g.grantee.username}`).sort();
    expect(edges).toEqual(
      [`${owner.user.username}>${bob.user.username}`, `${bob.user.username}>${carol.user.username}`, `${bob.user.username}>${dave.user.username}`, `${owner.user.username}>${dave.user.username}`].sort(),
    );
    expect(access.body.meta?.viewer_count).toBe(3);
    // A viewer only sees the grants they created.
    const bobView = (await bob.api.get(`/links/${linkId}/access`)).body.data as { grantor: { username: string } }[];
    expect(bobView.every((g) => g.grantor.username === bob.user.username)).toBe(true);
  });

  test('owner sees who has access and revokes bob recursively; dave keeps access via the direct path', async () => {
    await owner.page.goto(`/en/dashboard/links/${linkId}?tab=sharing`);
    const tree = owner.page.getByRole('list', { name: 'Access tree' });
    await expect(tree.getByText(`@${bob.user.username}`)).toBeVisible();
    await expect(tree.getByText(`@${carol.user.username}`)).toBeVisible();
    await expect(tree.getByText(`@${dave.user.username}`)).toHaveCount(2);
    await expect(owner.page.getByText('3 people have access.')).toBeVisible();

    const bobRow = tree.getByRole('listitem').filter({ hasText: `@${bob.user.username}` }).first();
    await bobRow.getByRole('button', { name: 'Revoke' }).first().click();
    const dialog = owner.page.getByRole('alertdialog');
    await expect(dialog.getByText(`Revoke access for ${bob.user.name}?`)).toBeVisible();
    // carol loses access with bob; dave does not (direct grant), so only one dependent is announced.
    await expect(dialog.getByText('1 person who received it through them will also lose access.')).toBeVisible();
    await expect(dialog.getByText('Anyone who also received it through a different person keeps access.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Revoke' }).click();
    await expect(owner.page.getByText('Access revoked for 2 people.')).toBeVisible(); // bob + carol, not dave

    expect((await bob.api.get(`/links/${linkId}`)).status).toBe(404);
    expect((await carol.api.get(`/links/${linkId}`)).status).toBe(404);
    expect((await dave.api.get(`/links/${linkId}`)).status).toBe(200);
    await carol.page.goto(`/en/l/${linkId}`);
    await expect(carol.page.getByRole('heading', { level: 1 })).toHaveText("This link isn't available");
    await expect(owner.page.getByText('1 person has access.')).toBeVisible();
  });

  test('a pending invitation can be revoked and then cannot be accepted', async () => {
    await owner.page.goto(`/en/dashboard/links/${linkId}?tab=sharing`);
    await owner.page.getByPlaceholder('name@example.com').fill(eve.user.email);
    await owner.page.getByRole('button', { name: 'Invite' }).click();
    await expect(owner.page.getByText('Invitation sent.')).toBeVisible();
    const url = await mailLink(eve.user.email, '/invitations/accept');
    const row = owner.page.getByRole('listitem').filter({ hasText: eve.user.email });
    await row.getByRole('button', { name: 'Revoke' }).click();
    await owner.page.getByRole('alertdialog').getByRole('button', { name: 'Revoke' }).click();
    await expect(owner.page.getByText('Invitation revoked.')).toBeVisible();
    const res = await eve.api.post(`/invitations/${token(url)}/accept`);
    expect(res.status).not.toBe(200);
    expect((await eve.api.get(`/links/${linkId}`)).status).toBe(404);
  });

  test('notifications: invitation, acceptance and revocation reach the right people; mark read', async () => {
    const kinds = async (a: Actor) => ((await a.api.get('/notifications?per_page=50')).body.data as { kind: string }[]).map((x) => x.kind);
    expect(await kinds(bob)).toEqual(expect.arrayContaining(['sharing.invitation_received', 'sharing.access_revoked']));
    expect(await kinds(carol)).toEqual(expect.arrayContaining(['sharing.invitation_received', 'sharing.access_revoked']));
    expect(await kinds(owner)).toContain('sharing.invitation_accepted');
    expect(await kinds(dave)).not.toContain('sharing.access_revoked'); // dave kept access

    const unread = ((await bob.api.get('/notifications/unread-count')).body.data as { unread: number }).unread;
    expect(unread).toBeGreaterThan(0);
    await bob.page.goto('/en/dashboard/notifications');
    await expect(bob.page.getByText('Your access to a shared link was removed')).toBeVisible();
    await expect(bob.page.getByText(`${owner.user.name} shared a link with you`)).toBeVisible();
    await expect(bob.page.getByRole('button', { name: `Notifications, ${unread} unread` })).toBeVisible();
    await bob.page.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(bob.page.getByText('All notifications marked as read.')).toBeVisible();
    await expect.poll(async () => ((await bob.api.get('/notifications/unread-count')).body.data as { unread: number }).unread).toBe(0);
    await expect(bob.page.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible();
  });
});
