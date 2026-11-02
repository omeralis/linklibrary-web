import { z } from 'zod';
import { vmsg } from './messages';

/**
 * Client-side validation mirrors the backend rules (see app/Http/Requests/*.php). The server stays
 * authoritative: 422 responses are mapped back onto the same fields.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
export const PASSWORD_MIN = 10;

const email = () => z.string().trim().min(1, vmsg('required')).max(254, vmsg('max', 254)).email(vmsg('email'));
const requiredString = (max: number) => z.string().trim().min(1, vmsg('required')).max(max, vmsg('max', max));
const optionalString = (max: number) => z.string().max(max, vmsg('max', max));

/** Mirrors Password::defaults() in local/dev: min 10, letters and numbers (production adds mixed case). */
const newPassword = () =>
  z
    .string()
    .min(PASSWORD_MIN, vmsg('passwordMin', PASSWORD_MIN))
    .max(1024, vmsg('max', 1024))
    .regex(/\p{L}/u, vmsg('passwordLetters'))
    .regex(/\d/, vmsg('passwordNumbers'));

export const loginSchema = z.object({
  email: email(),
  password: z.string().min(1, vmsg('required')).max(1024),
  remember: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: requiredString(100),
    username: z.string().trim().toLowerCase().min(1, vmsg('required')).regex(USERNAME_PATTERN, vmsg('username')),
    email: email(),
    password: newPassword(),
    password_confirmation: z.string().min(1, vmsg('required')),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: vmsg('passwordMatch') });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: email() });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: email(),
    password: newPassword(),
    password_confirmation: z.string().min(1, vmsg('required')),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: vmsg('passwordMatch') });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/** Accepts what a person types (with or without a scheme). The backend performs the real normalization + SSRF checks. */
export function normalizeUrlInput(raw: string): string {
  const value = raw.trim();
  if (value === '') return value;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^:]+:\d+/.test(value)) return value; // e.g. "javascript:" → rejected below
  return `https://${value}`;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.') && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const urlField = () =>
  z.string().trim().min(1, vmsg('required')).max(2048, vmsg('max', 2048)).transform(normalizeUrlInput).refine(isHttpUrl, vmsg('url'));

export const SOURCE_TYPES = ['WEBSITE', 'ARTICLE', 'VIDEO', 'PLAYLIST', 'PDF', 'REPOSITORY', 'IMAGE', 'AUDIO', 'DOCUMENT', 'OTHER'] as const;

export const addLinkSchema = z.object({
  url: urlField(),
  custom_title: optionalString(300),
  notes: optionalString(10000),
  category: z.string(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20, vmsg('maxItems', 20)),
  collections: z.array(z.string()).max(20),
});
export type AddLinkInput = z.input<typeof addLinkSchema>;
export type AddLinkValues = z.output<typeof addLinkSchema>;

export const editLinkSchema = z.object({
  custom_title: optionalString(300),
  custom_description: optionalString(5000),
  custom_image_url: z
    .string()
    .trim()
    .max(2048, vmsg('max', 2048))
    .refine((v) => v === '' || isHttpUrl(v), vmsg('url')),
  custom_source_type: z.string(),
  notes: optionalString(10000),
  category: z.string(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20, vmsg('maxItems', 20)),
});
export type EditLinkValues = z.infer<typeof editLinkSchema>;

export const collectionSchema = z.object({
  name: requiredString(120),
  description: optionalString(1000),
  visibility: z.enum(['PRIVATE', 'PUBLIC']),
  cover_image_url: z
    .string()
    .trim()
    .max(2048, vmsg('max', 2048))
    .refine((v) => v === '' || isHttpUrl(v), vmsg('url')),
});
export type CollectionValues = z.infer<typeof collectionSchema>;

export const inviteSchema = z.object({ email: email() });
export type InviteValues = z.infer<typeof inviteSchema>;

export const appealSchema = z.object({
  reason: z.string().trim().min(10, vmsg('min', 10)).max(2000, vmsg('max', 2000)),
});
export type AppealValues = z.infer<typeof appealSchema>;

export const profileSchema = z.object({
  name: requiredString(100),
  username: z.string().trim().toLowerCase().regex(USERNAME_PATTERN, vmsg('username')),
  bio: optionalString(500),
  profile_public: z.boolean(),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const emailChangeSchema = z.object({
  email: email(),
  current_password: z.string().min(1, vmsg('required')),
});
export type EmailChangeValues = z.infer<typeof emailChangeSchema>;

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, vmsg('required')),
    password: newPassword(),
    password_confirmation: z.string().min(1, vmsg('required')),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: vmsg('passwordMatch') })
  .refine((v) => v.password !== v.current_password, { path: ['password'], message: vmsg('passwordDifferent') });
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, vmsg('required')),
  confirmation: z.literal('DELETE', { message: vmsg('typeDelete') }),
});
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;

export const searchQuerySchema = z.string().trim().min(2).max(200);
