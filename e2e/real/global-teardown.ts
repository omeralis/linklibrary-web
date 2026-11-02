import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Safety net: every test deletes its own disposable users, so this normally reports 0. A non-zero count
 * means a test aborted before its cleanup; the leftovers (…@e2e.example.com only) are removed here.
 */
export default async function globalTeardown() {
  const backend = resolve(process.env.E2E_BACKEND_DIR ?? '../LinkLibrary');
  const out = execFileSync(process.env.E2E_PHP ?? 'php', [resolve(__dirname, 'fixtures', 'cleanup-users.php'), backend], { encoding: 'utf8' });
  console.log(`[e2e teardown] ${out.trim()}`);
}
