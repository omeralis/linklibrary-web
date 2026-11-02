type Primitive = string | number | boolean | null | undefined;
export type QueryParams = Record<string, Primitive | Primitive[]>;

/**
 * Serialises query params the way Laravel expects: arrays as `key[]=a&key[]=b`, booleans as 1/0,
 * empty strings / null / undefined omitted.
 */
export function toQueryString(params?: QueryParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) appendValue(search, `${key}[]`, item);
    } else {
      appendValue(search, key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function appendValue(search: URLSearchParams, key: string, value: Primitive) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value === 'boolean') search.append(key, value ? '1' : '0');
  else search.append(key, String(value));
}
