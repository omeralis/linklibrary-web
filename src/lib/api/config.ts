/** Public API origin (browser). No trailing slash. */
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
export const API_PREFIX = '/api/v1';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const REQUEST_TIMEOUT_MS = 20_000;
export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 50;
/** Poll interval while a saved link is PENDING/PROCESSING (handoff §4.1: 2–5 s). */
export const PROCESSING_POLL_MS = 3_000;
/** Poll interval for the notifications badge (no WebSocket support in the backend). */
export const NOTIFICATIONS_POLL_MS = 45_000;
