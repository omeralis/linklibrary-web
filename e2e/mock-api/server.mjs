#!/usr/bin/env node
/**
 * TEST-ONLY contract double of the LinkLibrary Laravel API (never used by the app at runtime).
 *
 * The real backend needs PHP 8.4 + PostgreSQL 18, which the CI/sandbox does not have, so Playwright runs
 * the real Next.js production build against this in-memory server. It reproduces the documented
 * contract (docs/FRONTEND_INTEGRATION_HANDOFF.md + docs/openapi.yaml): envelopes, error codes,
 * Sanctum SPA cookies + XSRF validation, privacy 404s, security rules for publish/share, owner/viewer/
 * public representations, pagination meta and asynchronous processing.
 *
 * Extra /__test/* routes stand in for e-mail delivery (verification and invitation links).
 */
import http from 'node:http';
import { randomUUID, randomBytes, createHash } from 'node:crypto';

const PORT = Number(process.env.MOCK_API_PORT || 8787);
const FRONTEND = process.env.MOCK_FRONTEND_ORIGIN || 'http://localhost:3100';
const PASSWORD = 'Password12345';

let db;
function reset() {
  db = {
    users: [],
    sessions: new Map(), // sessionId -> { userId, xsrf }
    links: [], // saved links
    collections: [],
    invitations: [],
    grants: [],
    notifications: [],
    appeals: [],
    categories: [
      { slug: 'programming', name_ar: 'برمجة', name_en: 'Programming', description_ar: null, description_en: null, sort_order: 1, is_active: true },
      { slug: 'design', name_ar: 'تصميم', name_en: 'Design', description_ar: null, description_en: null, sort_order: 2, is_active: true },
    ],
    verifications: new Map(),
  };
  addUser({ name: 'Demo User', username: 'demo', email: 'demo@linklibrary.test', verified: true, profile_public: true });
  addUser({ name: 'Omar Ali', username: 'omar', email: 'omar@example.com', verified: true, profile_public: false });
}

function now() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
}
function addUser({ name, username, email, verified = false, profile_public = false, password = PASSWORD, locale = 'en' }) {
  const u = { id: db.users.length + 1, public_id: randomUUID(), name, username, email, password, email_verified_at: verified ? now() : null, avatar_url: null, bio: null, locale, theme: 'system', profile_public, is_admin: false, created_at: now() };
  db.users.push(u);
  return u;
}
const userResource = (u) => ({
  public_id: u.public_id, name: u.name, username: u.username, email: u.email, email_verified: !!u.email_verified_at, email_verified_at: u.email_verified_at,
  avatar_url: u.avatar_url, bio: u.bio, locale: u.locale, theme: u.theme, profile_public: u.profile_public, is_admin: u.is_admin, created_at: u.created_at,
});
const summary = (u) => (u && u.profile_public ? { username: u.username, name: u.name, avatar_url: u.avatar_url, profile_url: `${FRONTEND}/u/${u.username}` } : null);
const catBrief = (slug, locale) => {
  const c = db.categories.find((x) => x.slug === slug);
  return c ? { slug: c.slug, name: locale === 'ar' ? c.name_ar : c.name_en, name_ar: c.name_ar, name_en: c.name_en } : null;
};

// ───────────────────────────────────────── HTTP helpers
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
const ok = (res, data, message = null, status = 200, meta) => send(res, status, { success: true, message, data, ...(meta ? { meta } : {}) });
const fail = (res, status, code, message, errors = {}) => send(res, status, { success: false, message, errors, code });
const notFound = (res) => fail(res, 404, 'NOT_FOUND', 'The requested resource was not found.');
const validation = (res, errors, code = 'VALIDATION_ERROR', message = 'The given data was invalid.') => fail(res, 422, code, message, errors);

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(/;\s*/).filter(Boolean).map((c) => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
}
function paginate(items, query) {
  const perPage = Math.max(1, Math.min(50, Number(query.get('per_page')) || 20));
  const page = Math.max(1, Number(query.get('page')) || 1);
  const start = (page - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    meta: { pagination: { current_page: page, per_page: perPage, has_more: start + perPage < items.length, total: items.length, last_page: Math.max(1, Math.ceil(items.length / perPage)) } },
  };
}
async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  if ((req.headers['content-type'] || '').includes('application/json')) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return { __raw: true };
}

// ───────────────────────────────────────── link helpers
function normalizeUrl(raw) {
  try {
    const u = new URL(String(raw).trim());
    if (!['http:', 'https:'].includes(u.protocol)) return { error: 'INVALID_URL' };
    if (u.username || u.password) return { error: 'INVALID_URL' };
    if (!u.hostname.includes('.')) return { error: 'INVALID_URL' };
    if (/^(localhost|127\.|10\.|192\.168\.)/.test(u.hostname) || u.hostname.endsWith('.local')) return { error: 'URL_NOT_ALLOWED' };
    u.hash = '';
    return { url: u.toString(), hostname: u.hostname };
  } catch {
    return { error: 'INVALID_URL' };
  }
}
function processingStatus(l) {
  if (l.security === 'PENDING') return 'PENDING';
  if (l.security === 'SUSPICIOUS' || l.security === 'MALICIOUS') return 'BLOCKED';
  return l.extraction === 'PENDING' ? 'PENDING' : l.extraction === 'PROCESSING' ? 'PROCESSING' : l.extraction;
}
function processing(l) {
  return { status: processingStatus(l), security: l.security, extraction: l.extraction, extraction_error_code: null, ai: 'DISABLED', ai_enabled: false };
}
/** Simulated pipeline: each status poll advances one step (PENDING → PROCESSING → COMPLETED). */
function advance(l) {
  if (l.extraction === 'PENDING') { l.extraction = 'PROCESSING'; return; }
  if (l.extraction === 'PROCESSING') {
    l.extraction = 'COMPLETED';
    l.security = l.hostname.includes('unknown') ? 'UNKNOWN' : 'CLEAR';
    l.title = l.title || `Page at ${l.hostname}`;
    l.description = l.description || `An example page hosted on ${l.hostname}.`;
    l.checked_at = now();
  }
}
const canPublish = (l) => l.security === 'CLEAR';
const canOpen = (l, isOwner) => l.security === 'CLEAR' || l.security === 'PENDING' || l.security === 'UNKNOWN' || (l.security === 'SUSPICIOUS' && isOwner);

function linkResource(l, role, locale, viewer) {
  const owner = db.users.find((u) => u.id === l.user_id);
  const open = canOpen(l, role === 'owner');
  const category = l.custom_category ? catBrief(l.custom_category, locale) : null;
  const data = {
    public_id: l.public_id, internal_path: `/l/${l.public_id}`, frontend_url: `${FRONTEND}/l/${l.public_id}`, access_role: role,
    title: l.custom_title || l.title || l.hostname, description: l.custom_description || l.description || null,
    image_url: l.custom_image_url || null, favicon_url: null, site_name: null, hostname: l.hostname,
    source_type: l.custom_source_type || 'WEBSITE', language: 'en', author: null, source_published_at: null, category,
    tags: l.tags.map((t) => ({ name: t.name, slug: t.slug, source: role === 'owner' ? t.source : null })),
    ai: null, url: open || role === 'owner' ? l.url : null, open_url: open ? l.url : null,
    security: { status: l.security, can_open: open, warning: l.security === 'CLEAR' ? null : `security.${l.security.toLowerCase()}`, checked_at: l.checked_at },
    owner: summary(owner), published_at: l.visibility === 'PUBLIC' ? l.published_at : null,
  };
  if (role === 'viewer') {
    const grant = db.grants.find((g) => g.link_id === l.public_id && g.grantee_id === viewer?.id && g.status === 'ACTIVE');
    const grantor = db.users.find((u) => u.id === grant?.grantor_id);
    data.shared_by = grantor?.name ?? null;
    data.permissions = { can_edit: false, can_delete: false, can_change_visibility: false, can_reshare: l.allow_resharing && canPublish(l) };
  }
  if (role === 'owner') {
    Object.assign(data, {
      visibility: l.visibility, allow_resharing: l.allow_resharing, is_favorite: l.is_favorite, notes: l.notes,
      overrides: { title: l.custom_title, description: l.custom_description, image_url: l.custom_image_url, source_type: l.custom_source_type, category },
      extracted: { title: l.title, description: l.description, image_url: null, canonical_url: l.url, content_type: 'text/html', source_type: 'WEBSITE', status: l.extraction, error_code: null, extracted_at: l.checked_at },
      processing_status: processingStatus(l), processing: processing(l),
      permissions: { can_edit: true, can_delete: true, can_change_visibility: true, can_publish: canPublish(l), can_share: canPublish(l), can_reshare: true },
      created_at: l.created_at, updated_at: l.updated_at, deleted_at: l.deleted_at,
    });
  }
  return data;
}
function roleFor(l, user) {
  if (!l || l.deleted_at) return null;
  if (user && l.user_id === user.id) return 'owner';
  if (user && db.grants.some((g) => g.link_id === l.public_id && g.grantee_id === user.id && g.status === 'ACTIVE') && canOpen(l, false)) return 'viewer';
  if (l.visibility === 'PUBLIC' && canPublish(l)) return 'public';
  return null;
}
const isPublicEligible = (l) => !l.deleted_at && l.visibility === 'PUBLIC' && canPublish(l);
function matches(l, q) {
  if (!q) return true;
  const hay = [l.custom_title, l.title, l.custom_description, l.description, l.notes, l.hostname, ...l.tags.map((t) => t.name)].filter(Boolean).join(' ').toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}
function slugify(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, '-').slice(0, 50);
}
function collectionResource(c, asOwner, withItems, locale) {
  const owner = db.users.find((u) => u.id === c.user_id);
  const data = {
    public_id: c.public_id, frontend_url: `${FRONTEND}/c/${c.public_id}`, name: c.name, description: c.description, cover_image_url: c.cover_image_url,
    items_count: c.items.length, owner: summary(owner), created_at: c.created_at, updated_at: c.updated_at,
  };
  if (asOwner) Object.assign(data, { visibility: c.visibility, sort_order: 0 });
  if (withItems) data.items = c.items.map((id) => db.links.find((l) => l.public_id === id)).filter((l) => l && !l.deleted_at).map((l) => linkResource(l, 'owner', locale));
  return data;
}
function notify(user, kind, data) {
  db.notifications.unshift({ id: randomUUID(), user_id: user.id, kind, data, read_at: null, created_at: now() });
}

// ───────────────────────────────────────── router
const routes = [];
const route = (method, pattern, handler, opts = {}) => routes.push({ method, re: new RegExp(`^${pattern.replace(/\{(\w+)\}/g, '(?<$1>[^/]+)')}$`), handler, ...opts });

route('GET', '/sanctum/csrf-cookie', (ctx, res) => { ctx.ensureSession(); res.writeHead(204); res.end(); }, { raw: true });

// Auth
route('POST', '/api/v1/auth/register', ({ res, body, ctx }) => {
  const errors = {};
  if (!body.name) errors.name = ['The name field is required.'];
  if (!/^[a-z0-9_]{3,30}$/.test(body.username || '')) errors.username = ['The username format is invalid.'];
  else if (db.users.some((u) => u.username === body.username)) errors.username = ['The username has already been taken.'];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email || '')) errors.email = ['The email field must be a valid email address.'];
  else if (db.users.some((u) => u.email === body.email)) errors.email = ['The email has already been taken.'];
  if (!body.password || body.password.length < 10) errors.password = ['The password field must be at least 10 characters.'];
  else if (body.password !== body.password_confirmation) errors.password = ['The password field confirmation does not match.'];
  if (Object.keys(errors).length) return validation(res, errors);
  const u = addUser({ name: body.name, username: body.username, email: body.email, password: body.password, locale: body.locale || 'en' });
  ctx.login(u);
  return ok(res, { user: userResource(u), auth_mode: 'session' }, 'Account created. Please check your e-mail to verify your address.', 201);
});
route('POST', '/api/v1/auth/login', ({ res, body, ctx }) => {
  const u = db.users.find((x) => x.email === body.email);
  if (!u || u.password !== body.password) return validation(res, { email: ['These credentials do not match our records.'] });
  ctx.login(u);
  return ok(res, { user: userResource(u), auth_mode: 'session' }, 'Signed in successfully.');
});
route('POST', '/api/v1/auth/logout', ({ res, ctx }) => { ctx.logout(); ok(res, null, 'Signed out successfully.'); }, { auth: true });
route('GET', '/api/v1/auth/me', ({ res, user }) => ok(res, userResource(user)), { auth: true });
route('POST', '/api/v1/auth/email/verification-notification', ({ res, user }) => (user.email_verified_at ? ok(res, null, 'Your e-mail address is already verified.') : ok(res, null, 'A new verification link has been sent.', 202)), { auth: true });
route('GET', '/api/v1/auth/email/verify/{id}/{hash}', ({ res, params, query }) => {
  const u = db.users.find((x) => x.public_id === params.id);
  const expected = db.verifications.get(params.id);
  if (!u || !expected || expected.hash !== params.hash || expected.signature !== query.get('signature')) return fail(res, 403, 'INVALID_VERIFICATION_LINK', 'This verification link is invalid or has expired.');
  u.email_verified_at = u.email_verified_at || now();
  return ok(res, null, 'Your e-mail address has been verified.');
});
route('POST', '/api/v1/auth/forgot-password', ({ res }) => ok(res, null, 'If an account exists for that address, a password reset link has been sent.', 202));
route('POST', '/api/v1/auth/reset-password', ({ res }) => fail(res, 422, 'INVALID_RESET_TOKEN', 'This password reset link is invalid or has expired.', { email: ['This password reset link is invalid or has expired.'] }));

// Profile
route('GET', '/api/v1/me', ({ res, user }) => ok(res, userResource(user)), { auth: true });
route('PATCH', '/api/v1/me', ({ res, user, body }) => {
  if (body.username !== undefined && !/^[a-z0-9_]{3,30}$/.test(body.username)) return validation(res, { username: ['The username format is invalid.'] });
  if (body.username && db.users.some((u) => u.username === body.username && u.id !== user.id)) return validation(res, { username: ['The username has already been taken.'] });
  if (body.email !== undefined && body.email !== user.email) {
    if (body.current_password !== user.password) return validation(res, { current_password: ['The password is incorrect.'] });
    user.email = body.email; user.email_verified_at = null;
  }
  for (const k of ['name', 'username', 'bio', 'locale', 'theme', 'profile_public']) if (body[k] !== undefined) user[k] = body[k];
  return ok(res, userResource(user), 'Profile updated.');
}, { auth: true });
route('PATCH', '/api/v1/me/password', ({ res, user, body }) => {
  if (body.current_password !== user.password) return validation(res, { current_password: ['The password is incorrect.'] });
  user.password = body.password;
  return ok(res, null, 'Password updated. Other sessions have been signed out.');
}, { auth: true });
route('GET', '/api/v1/me/sessions', ({ res, ctx }) => ok(res, [{ id: createHash('sha256').update(ctx.sessionId).digest('hex'), ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/140', last_active_at: now(), current: true }], null, 200, { supported: true }), { auth: true });
route('GET', '/api/v1/me/tokens', ({ res }) => ok(res, []), { auth: true });
route('GET', '/api/v1/me/invitations', ({ res, user, query }) => {
  if (!user.email_verified_at) return ok(res, [], null, 200, { email_verified: false });
  const items = db.invitations.filter((i) => i.email === user.email && i.status === 'PENDING').map((i) => {
    const inviter = db.users.find((u) => u.id === i.inviter_id);
    return { id: i.id, invited_by: { name: inviter.name, username: inviter.username }, expires_at: i.expires_at, created_at: i.created_at };
  });
  const page = paginate(items, query);
  return ok(res, page.data, null, 200, page.meta);
}, { auth: true });

function acceptInvitation(res, user, inv, locale) {
  if (!inv || inv.email !== user.email) return fail(res, 404, 'INVITATION_NOT_FOUND', 'Invitation not found.');
  if (!user.email_verified_at) return fail(res, 403, 'EMAIL_NOT_VERIFIED', 'Please verify your e-mail address first.');
  if (inv.status !== 'PENDING') return fail(res, 409, 'INVITATION_NOT_PENDING', 'This invitation is no longer pending.');
  inv.status = 'ACCEPTED'; inv.accepted_at = now();
  db.grants.push({ id: randomUUID(), link_id: inv.link_id, grantee_id: user.id, grantor_id: inv.inviter_id, parent_grant_id: inv.parent_grant_id, depth: inv.parent_grant_id ? 2 : 1, status: 'ACTIVE', created_at: now(), revoked_at: null });
  const inviter = db.users.find((u) => u.id === inv.inviter_id);
  notify(inviter, 'sharing.invitation_accepted', { link_id: inv.link_id, accepted_by_name: user.name });
  const link = db.links.find((l) => l.public_id === inv.link_id);
  return ok(res, linkResource(link, 'viewer', locale, user), 'Invitation accepted.');
}
route('POST', '/api/v1/me/invitations/{id}/accept', ({ res, user, params, locale }) => acceptInvitation(res, user, db.invitations.find((i) => i.id === params.id), locale), { auth: true });
route('POST', '/api/v1/invitations/{token}/accept', ({ res, user, params, locale }) => acceptInvitation(res, user, db.invitations.find((i) => i.token === params.token), locale), { auth: true });

// Links
route('GET', '/api/v1/links', ({ res, user, query, locale }) => {
  let items = db.links.filter((l) => l.user_id === user.id);
  const trashed = query.get('trashed');
  items = trashed === 'only' ? items.filter((l) => l.deleted_at) : items.filter((l) => !l.deleted_at);
  if (query.get('favorite') === '1') items = items.filter((l) => l.is_favorite);
  if (query.get('visibility')) items = items.filter((l) => l.visibility === query.get('visibility'));
  if (query.get('security_status')) items = items.filter((l) => l.security === query.get('security_status'));
  if (query.get('tag')) items = items.filter((l) => l.tags.some((t) => t.slug === query.get('tag')));
  if (query.get('category')) items = items.filter((l) => l.custom_category === query.get('category'));
  if (query.get('collection')) { const c = db.collections.find((x) => x.public_id === query.get('collection')); items = items.filter((l) => c?.items.includes(l.public_id)); }
  items = items.filter((l) => matches(l, query.get('q')));
  const sort = query.get('sort') || 'latest';
  items = [...items].sort((a, b) => (sort === 'oldest' ? a.seq - b.seq : sort === 'title' ? (a.custom_title || a.title || '').localeCompare(b.custom_title || b.title || '') : b.seq - a.seq));
  const page = paginate(items, query);
  return ok(res, page.data.map((l) => linkResource(l, 'owner', locale)), null, 200, page.meta);
}, { auth: true });
route('POST', '/api/v1/links', ({ res, user, body, locale }) => {
  if (!body.url) return validation(res, { url: ['The url field is required.'] });
  const n = normalizeUrl(body.url);
  if (n.error === 'INVALID_URL') return validation(res, { url: ['The URL is not valid.'] }, 'INVALID_URL', 'The URL is not valid.');
  if (n.error) return validation(res, { url: ['This URL points to a destination that is not allowed.'] }, 'URL_NOT_ALLOWED', 'This URL points to a destination that is not allowed.');
  const existing = db.links.find((l) => l.user_id === user.id && l.url === n.url && !l.deleted_at);
  if (existing) return ok(res, linkResource(existing, 'owner', locale), 'You have already saved this link.', 200, { already_saved: true });
  const l = {
    seq: db.links.length + 1, public_id: randomUUID(), user_id: user.id, url: n.url, hostname: n.hostname, title: null, description: null,
    custom_title: body.custom_title || null, custom_description: body.custom_description || null, custom_image_url: null, custom_source_type: null,
    custom_category: body.category || null, notes: body.notes || null, tags: (body.tags || []).map((t) => ({ name: t, slug: slugify(t), source: 'USER' })),
    visibility: 'PRIVATE', allow_resharing: false, is_favorite: false, security: 'PENDING', extraction: 'PENDING', checked_at: null, published_at: null,
    created_at: now(), updated_at: now(), deleted_at: null,
  };
  db.links.push(l);
  for (const cid of body.collections || []) db.collections.find((c) => c.public_id === cid && c.user_id === user.id)?.items.push(l.public_id);
  return ok(res, linkResource(l, 'owner', locale), 'Link saved successfully.', 201);
}, { auth: true });

const ownedLink = (user, id, withTrashed = false) => db.links.find((l) => l.public_id === id && l.user_id === user.id && (withTrashed || !l.deleted_at));

route('GET', '/api/v1/links/{id}', ({ res, user, params, locale }) => {
  const l = db.links.find((x) => x.public_id === params.id);
  const role = roleFor(l, user);
  return role ? ok(res, linkResource(l, role, locale, user)) : notFound(res);
}, { auth: true });
route('PATCH', '/api/v1/links/{id}', ({ res, user, params, body, locale }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  const map = { custom_title: 'custom_title', custom_description: 'custom_description', custom_image_url: 'custom_image_url', custom_source_type: 'custom_source_type', notes: 'notes', category: 'custom_category' };
  for (const [k, f] of Object.entries(map)) if (k in body) l[f] = body[k];
  if (Array.isArray(body.tags)) l.tags = [...l.tags.filter((t) => t.source === 'AI'), ...body.tags.map((t) => ({ name: t, slug: slugify(t), source: 'USER' }))];
  l.updated_at = now();
  return ok(res, linkResource(l, 'owner', locale), 'Link updated.');
}, { auth: true });
route('DELETE', '/api/v1/links/{id}', ({ res, user, params, query }) => {
  const permanent = query.get('permanent') === '1';
  const l = ownedLink(user, params.id, permanent);
  if (!l) return notFound(res);
  if (permanent) db.links = db.links.filter((x) => x !== l); else l.deleted_at = now();
  return ok(res, null, 'Link deleted.');
}, { auth: true });
route('POST', '/api/v1/links/{id}/restore', ({ res, user, params, locale }) => {
  const l = ownedLink(user, params.id, true);
  if (!l) return notFound(res);
  if (!l.deleted_at) return fail(res, 409, 'NOT_DELETED', 'This link is not deleted.');
  l.deleted_at = null;
  return ok(res, linkResource(l, 'owner', locale), 'Link restored.');
}, { auth: true });
route('POST', '/api/v1/links/{id}/favorite', ({ res, user, params, body }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  l.is_favorite = typeof body.favorite === 'boolean' ? body.favorite : !l.is_favorite;
  return ok(res, { public_id: l.public_id, is_favorite: l.is_favorite }, 'Link updated.');
}, { auth: true });
route('PATCH', '/api/v1/links/{id}/visibility', ({ res, user, params, body, locale }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  if (body.visibility === 'PUBLIC') {
    if (!user.email_verified_at) return fail(res, 403, 'EMAIL_NOT_VERIFIED', 'Please verify your e-mail address first.');
    if (!canPublish(l)) return validation(res, { security_status: [l.security] }, 'LINK_NOT_PUBLISHABLE', 'This link cannot be published until it passes the security check.');
    l.published_at = l.published_at || now();
  }
  l.visibility = body.visibility;
  return ok(res, linkResource(l, 'owner', locale), 'Visibility updated.');
}, { auth: true });
route('PATCH', '/api/v1/links/{id}/sharing-settings', ({ res, user, params, body }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  l.allow_resharing = !!body.allow_resharing;
  return ok(res, { public_id: l.public_id, allow_resharing: l.allow_resharing }, 'Link updated.');
}, { auth: true });
route('POST', '/api/v1/links/{id}/tags', ({ res, user, params, body, locale }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  for (const t of body.tags || []) if (!l.tags.some((x) => x.slug === slugify(t))) l.tags.push({ name: t, slug: slugify(t), source: 'USER' });
  return ok(res, linkResource(l, 'owner', locale), 'Link updated.');
}, { auth: true });
route('DELETE', '/api/v1/links/{id}/tags/{slug}', ({ res, user, params, locale }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  l.tags = l.tags.filter((t) => t.slug !== decodeURIComponent(params.slug));
  return ok(res, linkResource(l, 'owner', locale), 'Link updated.');
}, { auth: true });
route('POST', '/api/v1/links/{id}/reanalyze', ({ res, user, params }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  l.extraction = 'PENDING';
  return ok(res, processing(l), 'Re-analysis has been queued.', 202);
}, { auth: true });
route('GET', '/api/v1/links/{id}/processing-status', ({ res, user, params }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  advance(l);
  return ok(res, processing(l));
}, { auth: true });
route('GET', '/api/v1/links/{id}/open', ({ res, user, params }) => {
  const l = db.links.find((x) => x.public_id === params.id);
  const role = roleFor(l, user);
  if (!role) return notFound(res);
  if (!canOpen(l, role === 'owner')) return fail(res, 403, 'LINK_SECURITY_BLOCKED', 'This link is blocked by the security policy.');
  return ok(res, { url: l.url, security_status: l.security, warning: l.security !== 'CLEAR' });
}, { auth: true });
route('GET', '/api/v1/links/{id}/security', ({ res, user, params }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  return ok(res, {
    status: l.security, stored_status: l.security, source: 'PROVIDER', checked_at: l.checked_at, expires_at: null,
    can_publish: canPublish(l), can_share: canPublish(l), can_open: canOpen(l, true), disclaimer: 'Security checks reduce risk but cannot guarantee that a website is safe.',
    history: l.checked_at ? [{ trigger: 'CREATED', status: 'COMPLETED', verdict: l.security, providers: [], error_code: null, created_at: l.created_at, completed_at: l.checked_at }] : [],
    appeals: db.appeals.filter((a) => a.link_id === l.public_id),
  });
}, { auth: true });
route('POST', '/api/v1/links/{id}/security/rescan', ({ res, user, params }) => {
  const l = ownedLink(user, params.id);
  if (!l) return notFound(res);
  return ok(res, { trigger: 'MANUAL', status: 'PENDING', verdict: null, providers: [], error_code: null, created_at: now(), completed_at: null }, 'A security re-scan has been queued.', 202);
}, { auth: true });

// Sharing
route('POST', '/api/v1/links/{id}/invitations', ({ res, user, params, body }) => {
  const l = db.links.find((x) => x.public_id === params.id);
  const role = roleFor(l, user);
  if (!role || role === 'public') return notFound(res);
  if (!user.email_verified_at) return fail(res, 403, 'EMAIL_NOT_VERIFIED', 'Please verify your e-mail address first.');
  if (role === 'viewer' && !l.allow_resharing) return fail(res, 403, 'FORBIDDEN', 'Resharing is disabled.');
  if (!canPublish(l)) return validation(res, { security_status: [l.security] }, 'LINK_NOT_SHAREABLE', 'This link cannot be shared until it passes the security check.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email || '')) return validation(res, { email: ['The email field must be a valid email address.'] });
  if (body.email === user.email) return validation(res, { email: ['You cannot share a link with yourself.'] }, 'CANNOT_SHARE_WITH_SELF', 'You cannot share a link with yourself.');
  const grantee = db.users.find((u) => u.email === body.email);
  if (grantee && db.grants.some((g) => g.link_id === l.public_id && g.grantee_id === grantee.id && g.status === 'ACTIVE')) return fail(res, 409, 'ALREADY_SHARED', 'This person already has access.');
  const parent = role === 'viewer' ? db.grants.find((g) => g.link_id === l.public_id && g.grantee_id === user.id && g.status === 'ACTIVE') : null;
  const inv = { id: randomUUID(), token: randomBytes(16).toString('hex'), link_id: l.public_id, email: body.email, inviter_id: user.id, parent_grant_id: parent?.id ?? null, status: 'PENDING', expires_at: new Date(Date.now() + 7 * 864e5).toISOString(), accepted_at: null, revoked_at: null, created_at: now() };
  db.invitations.push(inv);
  if (grantee) notify(grantee, 'sharing.invitation_received', { invitation_id: inv.id, inviter_name: user.name, expires_at: inv.expires_at });
  return ok(res, invitationResource(inv), 'Invitation sent.', 201);
}, { auth: true });
function invitationResource(i) {
  const inviter = db.users.find((u) => u.id === i.inviter_id);
  return { id: i.id, email: i.email, status: i.status, invited_by: { username: inviter.username, name: inviter.name }, via_reshare: !!i.parent_grant_id, expires_at: i.expires_at, accepted_at: i.accepted_at, revoked_at: i.revoked_at, created_at: i.created_at };
}
route('GET', '/api/v1/links/{id}/invitations', ({ res, user, params, query }) => {
  const l = db.links.find((x) => x.public_id === params.id);
  const role = roleFor(l, user);
  if (!role || role === 'public') return notFound(res);
  const items = db.invitations.filter((i) => i.link_id === l.public_id && (role === 'owner' || i.inviter_id === user.id)).reverse().map(invitationResource);
  const page = paginate(items, query);
  return ok(res, page.data, null, 200, page.meta);
}, { auth: true });
route('DELETE', '/api/v1/links/{id}/invitations/{inv}', ({ res, user, params }) => {
  const inv = db.invitations.find((i) => i.id === params.inv && i.link_id === params.id);
  const l = db.links.find((x) => x.public_id === params.id);
  if (!inv || !(l.user_id === user.id || inv.inviter_id === user.id)) return notFound(res);
  inv.status = 'REVOKED'; inv.revoked_at = now();
  return ok(res, null, 'Invitation revoked.');
}, { auth: true });
route('GET', '/api/v1/links/{id}/access', ({ res, user, params }) => {
  const l = db.links.find((x) => x.public_id === params.id);
  const role = roleFor(l, user);
  if (!role || role === 'public') return notFound(res);
  const all = db.grants.filter((g) => g.link_id === l.public_id);
  const visible = role === 'owner' ? all : all.filter((g) => g.grantor_id === user.id);
  const person = (id) => { const u = db.users.find((x) => x.id === id); return { username: u.username, name: u.name }; };
  return ok(res, visible.map((g) => ({ id: g.id, grantee: person(g.grantee_id), grantor: person(g.grantor_id), parent_grant_id: g.parent_grant_id, depth: g.depth, status: g.status, effective: g.status === 'ACTIVE', revoke_reason: null, created_at: g.created_at, revoked_at: g.revoked_at })), null, 200, { allow_resharing: l.allow_resharing, viewer_count: all.filter((g) => g.status === 'ACTIVE').length });
}, { auth: true });
route('DELETE', '/api/v1/links/{id}/access/{grant}', ({ res, user, params }) => {
  const g = db.grants.find((x) => x.id === params.grant && x.link_id === params.id);
  const l = db.links.find((x) => x.public_id === params.id);
  if (!g || !(l.user_id === user.id || g.grantor_id === user.id || g.grantee_id === user.id)) return notFound(res);
  const revoke = (grant) => { let n = 0; if (grant.status === 'ACTIVE') { grant.status = 'REVOKED'; grant.revoked_at = now(); n++; } for (const child of db.grants.filter((c) => c.parent_grant_id === grant.id)) n += revoke(child); return n; };
  return ok(res, { revoked_users: revoke(g) }, 'Access revoked.');
}, { auth: true });
route('GET', '/api/v1/shared-with-me', ({ res, user, query, locale }) => {
  const ids = new Set(db.grants.filter((g) => g.grantee_id === user.id && g.status === 'ACTIVE').map((g) => g.link_id));
  const items = db.links.filter((l) => ids.has(l.public_id) && !l.deleted_at && matches(l, query.get('q'))).map((l) => linkResource(l, 'viewer', locale, user));
  const page = paginate(items, query);
  return ok(res, page.data, null, 200, page.meta);
}, { auth: true });

// Collections
route('GET', '/api/v1/collections', ({ res, user, query, locale }) => {
  const page = paginate(db.collections.filter((c) => c.user_id === user.id).reverse(), query);
  return ok(res, page.data.map((c) => collectionResource(c, true, false, locale)), null, 200, page.meta);
}, { auth: true });
route('POST', '/api/v1/collections', ({ res, user, body, locale }) => {
  if (!body.name) return validation(res, { name: ['The name field is required.'] });
  if (body.visibility === 'PUBLIC' && !user.email_verified_at) return fail(res, 403, 'EMAIL_NOT_VERIFIED', 'Please verify your e-mail address first.');
  const c = { public_id: randomUUID(), user_id: user.id, name: body.name, description: body.description ?? null, visibility: body.visibility || 'PRIVATE', cover_image_url: body.cover_image_url ?? null, items: [], created_at: now(), updated_at: now() };
  db.collections.push(c);
  return ok(res, collectionResource(c, true, false, locale), 'Collection created.', 201);
}, { auth: true });
const ownedCollection = (user, id) => db.collections.find((c) => c.public_id === id && c.user_id === user.id);
route('GET', '/api/v1/collections/{id}', ({ res, user, params, locale }) => { const c = ownedCollection(user, params.id); return c ? ok(res, collectionResource(c, true, true, locale)) : notFound(res); }, { auth: true });
route('PATCH', '/api/v1/collections/{id}', ({ res, user, params, body, locale }) => {
  const c = ownedCollection(user, params.id);
  if (!c) return notFound(res);
  for (const k of ['name', 'description', 'visibility', 'cover_image_url']) if (k in body) c[k] = body[k];
  c.updated_at = now();
  return ok(res, collectionResource(c, true, false, locale), 'Collection updated.');
}, { auth: true });
route('DELETE', '/api/v1/collections/{id}', ({ res, user, params }) => {
  const c = ownedCollection(user, params.id);
  if (!c) return notFound(res);
  db.collections = db.collections.filter((x) => x !== c);
  return ok(res, null, 'Collection deleted.');
}, { auth: true });
route('POST', '/api/v1/collections/{id}/links', ({ res, user, params, body }) => {
  const c = ownedCollection(user, params.id);
  if (!c) return notFound(res);
  const valid = (body.links || []).filter((id) => ownedLink(user, id));
  if (valid.length !== (body.links || []).length) return validation(res, { links: ['Some links are not available.'] }, 'INVALID_LINKS', 'Some links are not available.');
  let added = 0;
  for (const id of valid) if (!c.items.includes(id)) { c.items.push(id); added++; }
  return ok(res, { added }, 'Links added.');
}, { auth: true });
route('DELETE', '/api/v1/collections/{id}/links/{link}', ({ res, user, params }) => {
  const c = ownedCollection(user, params.id);
  if (!c) return notFound(res);
  c.items = c.items.filter((x) => x !== params.link);
  return ok(res, null, 'Link removed.');
}, { auth: true });
route('PATCH', '/api/v1/collections/{id}/reorder', ({ res, user, params, body }) => {
  const c = ownedCollection(user, params.id);
  if (!c) return notFound(res);
  if ([...body.links].sort().join() !== [...c.items].sort().join()) return validation(res, { links: ['Invalid order.'] }, 'INVALID_ORDER', 'Invalid order.');
  c.items = body.links;
  return ok(res, null, 'Order saved.');
}, { auth: true });

// Taxonomy & search
const categoryResource = (c, locale, extra = {}) => ({ slug: c.slug, name: locale === 'ar' ? c.name_ar : c.name_en, name_ar: c.name_ar, name_en: c.name_en, description: null, description_ar: null, description_en: null, sort_order: c.sort_order, ...extra });
route('GET', '/api/v1/categories', ({ res, locale }) => ok(res, db.categories.map((c) => categoryResource(c, locale))), { auth: true });
route('GET', '/api/v1/tags', ({ res, user, query }) => {
  const counts = new Map();
  for (const l of db.links.filter((x) => x.user_id === user.id && !x.deleted_at)) for (const t of l.tags) counts.set(t.slug, { name: t.name, slug: t.slug, links_count: (counts.get(t.slug)?.links_count || 0) + 1 });
  const q = query.get('q') || '';
  return ok(res, [...counts.values()].filter((t) => t.slug.startsWith(slugify(q))));
}, { auth: true });
route('GET', '/api/v1/search', ({ res, user, query, locale }) => {
  const q = query.get('q') || '';
  if (q.length < 2) return validation(res, { q: ['The q field must be at least 2 characters.'] });
  if (query.get('type') === 'collections') {
    return ok(res, db.collections.filter((c) => c.user_id === user.id && c.name.toLowerCase().includes(q.toLowerCase())).map((c) => collectionResource(c, true, false, locale)));
  }
  const scope = query.get('scope') || 'own';
  const shared = new Set(db.grants.filter((g) => g.grantee_id === user.id && g.status === 'ACTIVE').map((g) => g.link_id));
  const items = db.links
    .filter((l) => !l.deleted_at && ((scope !== 'shared' && l.user_id === user.id) || (scope !== 'own' && shared.has(l.public_id))) && matches(l, q))
    .map((l) => linkResource(l, l.user_id === user.id ? 'owner' : 'viewer', locale, user));
  const page = paginate(items, query);
  return ok(res, page.data, null, 200, { ...page.meta, scope });
}, { auth: true });

// Notifications
route('GET', '/api/v1/notifications', ({ res, user, query }) => {
  let items = db.notifications.filter((n) => n.user_id === user.id);
  if (query.get('unread') === '1') items = items.filter((n) => !n.read_at);
  const page = paginate(items.map((n) => ({ id: n.id, kind: n.kind, data: n.data, read: !!n.read_at, read_at: n.read_at, created_at: n.created_at })), query);
  return ok(res, page.data, null, 200, page.meta);
}, { auth: true });
route('GET', '/api/v1/notifications/unread-count', ({ res, user }) => ok(res, { unread: db.notifications.filter((n) => n.user_id === user.id && !n.read_at).length }), { auth: true });
route('PATCH', '/api/v1/notifications/{id}/read', ({ res, user, params }) => {
  const n = db.notifications.find((x) => x.id === params.id && x.user_id === user.id);
  if (!n) return notFound(res);
  n.read_at = now();
  return ok(res, { id: n.id, kind: n.kind, data: n.data, read: true, read_at: n.read_at, created_at: n.created_at });
}, { auth: true });
route('POST', '/api/v1/notifications/read-all', ({ res, user }) => {
  let updated = 0;
  for (const n of db.notifications) if (n.user_id === user.id && !n.read_at) { n.read_at = now(); updated++; }
  return ok(res, { updated }, 'All notifications marked as read.');
}, { auth: true });

// Public
route('GET', '/api/v1/public/links', ({ res, query, locale }) => {
  const items = db.links.filter((l) => isPublicEligible(l) && matches(l, query.get('q'))).sort((a, b) => b.seq - a.seq).map((l) => linkResource(l, 'public', locale));
  const page = paginate(items, query);
  return ok(res, page.data, null, 200, page.meta);
}, { public: true });
route('GET', '/api/v1/public/search', ({ res, query, locale }) => {
  if ((query.get('q') || '').length < 2) return validation(res, { q: ['The q field is required.'] });
  const items = db.links.filter((l) => isPublicEligible(l) && matches(l, query.get('q'))).map((l) => linkResource(l, 'public', locale));
  const page = paginate(items, query);
  return ok(res, page.data, null, 200, page.meta);
}, { public: true });
route('GET', '/api/v1/public/links/{id}', ({ res, params, locale }) => { const l = db.links.find((x) => x.public_id === params.id); return l && isPublicEligible(l) ? ok(res, linkResource(l, 'public', locale)) : notFound(res); }, { public: true });
route('GET', '/api/v1/public/categories', ({ res, locale }) => ok(res, db.categories.map((c) => categoryResource(c, locale, { links_count: db.links.filter((l) => isPublicEligible(l) && l.custom_category === c.slug).length }))), { public: true });
route('GET', '/api/v1/public/tags', ({ res }) => ok(res, []), { public: true });
const publicUser = (username) => db.users.find((u) => u.username === username && u.profile_public);
route('GET', '/api/v1/public/users/{u}', ({ res, params }) => {
  const u = publicUser(params.u);
  if (!u) return notFound(res);
  return ok(res, { username: u.username, name: u.name, avatar_url: u.avatar_url, bio: u.bio, profile_url: `${FRONTEND}/u/${u.username}`, joined_at: u.created_at.slice(0, 10), stats: { public_links: db.links.filter((l) => l.user_id === u.id && isPublicEligible(l)).length, public_collections: db.collections.filter((c) => c.user_id === u.id && c.visibility === 'PUBLIC').length } });
}, { public: true });
route('GET', '/api/v1/public/users/{u}/links', ({ res, params, query, locale }) => {
  const u = publicUser(params.u);
  if (!u) return notFound(res);
  const page = paginate(db.links.filter((l) => l.user_id === u.id && isPublicEligible(l)).map((l) => linkResource(l, 'public', locale)), query);
  return ok(res, page.data, null, 200, page.meta);
}, { public: true });
route('GET', '/api/v1/public/users/{u}/collections', ({ res, params, query, locale }) => {
  const u = publicUser(params.u);
  if (!u) return notFound(res);
  const page = paginate(db.collections.filter((c) => c.user_id === u.id && c.visibility === 'PUBLIC').map((c) => ({ ...collectionResource(c, false, false, locale), items_count: c.items.filter((id) => isPublicEligible(db.links.find((l) => l.public_id === id) || {})).length })), query);
  return ok(res, page.data, null, 200, page.meta);
}, { public: true });
route('GET', '/api/v1/public/collections/{id}', ({ res, params, query, locale }) => {
  const c = db.collections.find((x) => x.public_id === params.id && x.visibility === 'PUBLIC');
  if (!c) return notFound(res);
  const items = c.items.map((id) => db.links.find((l) => l.public_id === id)).filter((l) => l && isPublicEligible(l)).map((l) => linkResource(l, 'public', locale));
  const page = paginate(items, query);
  return ok(res, page.data, null, 200, { ...page.meta, collection: { ...collectionResource(c, false, false, locale), items_count: items.length } });
}, { public: true });

// Test-only hooks (stand-in for e-mail delivery)
route('POST', '/__test/reset', ({ res }) => { reset(); ok(res, null); }, { public: true, test: true });
route('GET', '/__test/verification/{email}', ({ res, params }) => {
  const u = db.users.find((x) => x.email === decodeURIComponent(params.email));
  if (!u) return notFound(res);
  const v = { id: u.public_id, hash: createHash('sha1').update(u.email).digest('hex'), expires: String(Math.floor(Date.now() / 1000) + 3600), signature: randomBytes(16).toString('hex') };
  db.verifications.set(u.public_id, v);
  return ok(res, v);
}, { public: true, test: true });
route('GET', '/__test/invitation/{email}', ({ res, params }) => {
  const inv = [...db.invitations].reverse().find((i) => i.email === decodeURIComponent(params.email) && i.status === 'PENDING');
  return inv ? ok(res, { token: inv.token, id: inv.id }) : notFound(res);
}, { public: true, test: true });

// ───────────────────────────────────────── server
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const cors = origin === FRONTEND
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', Vary: 'Origin', 'Access-Control-Expose-Headers': 'Retry-After' }
    : {};
  const writeHead = res.writeHead.bind(res);
  res.writeHead = (status, headers = {}) => writeHead(status, { ...cors, ...headers });
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Accept, Accept-Language, Content-Type, X-Requested-With, X-XSRF-TOKEN', 'Access-Control-Max-Age': '600' });
    return res.end();
  }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const cookies = parseCookies(req);
  let sessionId = cookies.linklibrary_session && db.sessions.has(cookies.linklibrary_session) ? cookies.linklibrary_session : null;
  const setCookies = [];
  const ctx = {
    get sessionId() { return sessionId; },
    ensureSession() {
      if (!sessionId) { sessionId = randomBytes(20).toString('hex'); db.sessions.set(sessionId, { userId: null, xsrf: randomBytes(20).toString('base64') }); }
      const s = db.sessions.get(sessionId);
      setCookies.push(`linklibrary_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax`, `XSRF-TOKEN=${encodeURIComponent(s.xsrf)}; Path=/; SameSite=Lax`);
      return s;
    },
    cookieHeaders() { return setCookies.length ? { 'Set-Cookie': setCookies } : {}; },
    login(u) {
      if (sessionId) db.sessions.delete(sessionId);
      sessionId = null;
      const s = ctx.ensureSession(); // session regeneration
      s.userId = u.id;
    },
    logout() { if (sessionId) db.sessions.delete(sessionId); sessionId = null; ctx.ensureSession(); },
  };
  const origSend = res.end.bind(res);
  res.end = (...args) => { if (setCookies.length && !res.headersSent) res.setHeader('Set-Cookie', setCookies); return origSend(...args); };
  const writeHead2 = res.writeHead;
  res.writeHead = (status, headers = {}) => writeHead2(status, { ...(setCookies.length ? { 'Set-Cookie': setCookies } : {}), ...headers });

  const match = routes.map((r) => ({ r, m: r.method === req.method && url.pathname.match(r.re) })).find((x) => x.m);
  if (!match) return fail(res, 404, 'NOT_FOUND', 'The requested resource was not found.');
  const { r, m } = match;
  if (r.raw) return r.handler(ctx, res);

  // CSRF: stateful (browser) mutations must echo the XSRF cookie (Sanctum EnsureFrontendRequestsAreStateful).
  if (req.method !== 'GET' && !r.test && origin === FRONTEND) {
    const s = sessionId && db.sessions.get(sessionId);
    if (!s || req.headers['x-xsrf-token'] !== s.xsrf) return fail(res, 419, 'CSRF_TOKEN_MISMATCH', 'Your session has expired. Please refresh and try again.');
  }
  const session = sessionId ? db.sessions.get(sessionId) : null;
  const user = session?.userId ? db.users.find((u) => u.id === session.userId) : null;
  if (r.auth && !user) return fail(res, 401, 'UNAUTHENTICATED', 'Authentication is required.');
  const body = await readBody(req);
  const locale = url.searchParams.get('locale') || user?.locale || ((req.headers['accept-language'] || '').startsWith('ar') ? 'ar' : 'en');
  try {
    r.handler({ res, req, ctx, user, body, query: url.searchParams, params: m.groups || {}, locale });
  } catch (error) {
    console.error(error);
    fail(res, 500, 'SERVER_ERROR', 'An unexpected error occurred.');
  }
});

reset();
server.listen(PORT, () => console.log(`mock LinkLibrary API on http://localhost:${PORT} (frontend ${FRONTEND})`));
