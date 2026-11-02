import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isApiError } from '@/lib/api/errors';

/**
 * Applies a 422 response onto react-hook-form fields. Returns true when at least one field error
 * was mapped (so the caller can skip a generic toast). Unknown fields are ignored.
 */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly string[]): boolean {
  if (!isApiError(error) || error.status !== 422) return false;
  let mapped = false;
  for (const [key, messages] of Object.entries(error.errors)) {
    const field = key.split('.')[0];
    if (fields.includes(field) && messages[0]) {
      setError(field as Path<T>, { type: 'server', message: messages[0] }, { shouldFocus: !mapped });
      mapped = true;
    }
  }
  return mapped;
}
