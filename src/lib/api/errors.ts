import type { ApiErrorBody } from './types';

/** Client-side codes that never come from the backend. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'ABORTED' | 'INVALID_RESPONSE';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errors: Record<string, string[]>;
  /** Seconds to wait (from the Retry-After header on 429). */
  readonly retryAfter: number | null;

  constructor(status: number, code: string, message: string, errors: Record<string, string[]> = {}, retryAfter: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.retryAfter = retryAfter;
  }

  static fromBody(status: number, body: Partial<ApiErrorBody> | null, retryAfter: number | null = null): ApiError {
    const code = body?.code ?? defaultCodeForStatus(status);
    return new ApiError(status, code, body?.message ?? '', normaliseErrors(body?.errors), retryAfter);
  }

  get isUnauthenticated() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isValidation() {
    return this.status === 422;
  }
  get isRateLimited() {
    return this.status === 429;
  }
  get isNetwork() {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT';
  }
  get isServer() {
    return this.status >= 500;
  }

  /** First message for a given field (422), if any. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function normaliseErrors(errors: unknown): Record<string, string[]> {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return {};
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(value)) out[key] = value.map(String);
    else if (typeof value === 'string') out[key] = [value];
  }
  return out;
}

export function defaultCodeForStatus(status: number): string {
  switch (status) {
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 405:
      return 'METHOD_NOT_ALLOWED';
    case 409:
      return 'CONFLICT';
    case 410:
      return 'GONE';
    case 419:
      return 'CSRF_TOKEN_MISMATCH';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMITED';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'HTTP_ERROR';
  }
}

/**
 * Error codes that have a dedicated, localized explanation in messages/{locale}.json → "errors.codes".
 * For anything else the (already localized) backend message is shown, falling back to a generic text.
 */
export const KNOWN_ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'EMAIL_NOT_VERIFIED',
  'ACCOUNT_SUSPENDED',
  'LINK_SECURITY_BLOCKED',
  'INVALID_SIGNATURE',
  'INVALID_VERIFICATION_LINK',
  'NOT_FOUND',
  'INVITATION_NOT_FOUND',
  'ALREADY_SHARED',
  'ALREADY_OWNER',
  'GRANT_CYCLE',
  'INVITATION_NOT_PENDING',
  'TOO_MANY_PENDING_INVITATIONS',
  'APPEAL_ALREADY_PENDING',
  'NOT_DELETED',
  'CONFLICT',
  'INVITATION_EXPIRED',
  'CSRF_TOKEN_MISMATCH',
  'VALIDATION_ERROR',
  'INVALID_URL',
  'URL_NOT_ALLOWED',
  'LINK_NOT_PUBLISHABLE',
  'LINK_NOT_SHAREABLE',
  'CANNOT_SHARE_WITH_SELF',
  'INVALID_LINKS',
  'INVALID_ORDER',
  'COLLECTION_FULL',
  'INVALID_IMAGE',
  'APPEAL_NOT_APPLICABLE',
  'LINK_BLOCKED',
  'INVALID_RESET_TOKEN',
  'RATE_LIMITED',
  'SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
  'NETWORK_ERROR',
  'TIMEOUT',
] as const;

export type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

export function isKnownErrorCode(code: string): code is KnownErrorCode {
  return (KNOWN_ERROR_CODES as readonly string[]).includes(code);
}
