/**
 * Validation messages are produced by Zod schemas as translation keys prefixed with "v:"
 * (e.g. "v:required", or "v:min|8" with an interpolated value). Messages coming from the backend
 * are already localized and are displayed verbatim.
 */
type Translate = (key: string, values?: Record<string, string | number>) => string;

export const V_PREFIX = 'v:';

export function vmsg(key: string, value?: string | number): string {
  return value === undefined ? `${V_PREFIX}${key}` : `${V_PREFIX}${key}|${value}`;
}

export function translateValidationMessage(t: Translate, message: string): string {
  if (!message.startsWith(V_PREFIX)) return message;
  const [key, value] = message.slice(V_PREFIX.length).split('|');
  return t(`validation.${key}`, value !== undefined ? { value } : undefined);
}
