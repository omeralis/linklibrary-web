import { request } from '@playwright/test';
import { API } from './support';

/** Fails fast when the API is not reachable (the suite never starts or resets the backend itself). */
export default async function globalSetup() {
  const ctx = await request.newContext();
  const res = await ctx.get(`${API}/api/v1/public/categories`).catch(() => null);
  if (!res || res.status() !== 200) throw new Error(`Real API not reachable at ${API} (start it first — see docs/REAL_BACKEND_INTEGRATION_REPORT.md)`);
  await ctx.dispose();
}
