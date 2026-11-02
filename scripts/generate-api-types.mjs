#!/usr/bin/env node
/**
 * Generates src/lib/api/schema.d.ts from the backend OpenAPI contract.
 *
 * Usage: npm run api:types [-- path/to/openapi.yaml]
 * Default source: ../LinkLibrary/docs/openapi.yaml (sibling backend checkout), falling back to the
 * vendored copy in openapi/openapi.yaml.
 *
 * Known backend spec defect patched here (documented in docs/FRONTEND_API_INTEGRATION.md):
 * `components.schemas.Envelope.properties.data` is emitted as `[]` (an empty PHP array) instead of
 * an empty schema `{}`; openapi-typescript rejects arrays as schema objects.
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendored = resolve(root, 'openapi/openapi.yaml');
const candidates = [process.argv[2], resolve(root, '../LinkLibrary/docs/openapi.yaml'), vendored].filter(Boolean);
const source = candidates.find((p) => existsSync(p));
if (!source) {
  console.error('openapi.yaml not found. Pass the path explicitly.');
  process.exit(1);
}
if (source !== vendored) copyFileSync(source, vendored);

const raw = readFileSync(vendored, 'utf8').replace(/^(\s+data): \[\]$/m, '$1: {}');
const ast = await openapiTS(raw, { alphabetize: false, exportType: true, emptyObjectsUnknown: true });
const banner = `// AUTO-GENERATED from ${source === vendored ? 'openapi/openapi.yaml' : source} by scripts/generate-api-types.mjs. Do not edit.\n\n`;
writeFileSync(resolve(root, 'src/lib/api/schema.d.ts'), banner + astToString(ast));
console.log('✔ src/lib/api/schema.d.ts generated from', source);
