#!/usr/bin/env node
/**
 * Generates src/lib/api/schema.d.ts from the backend OpenAPI contract.
 *
 * Usage: npm run api:types [-- path/to/openapi.yaml]
 * Default source: ../LinkLibrary/docs/openapi.yaml (sibling backend checkout), falling back to the
 * vendored copy in openapi/openapi.yaml.
 *
 * The former `Envelope.data: []` defect is fixed at the source (backend scripts/build-openapi.php,
 * 2026-11-02); the generator now refuses a spec that still contains it instead of patching it.
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
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

const raw = readFileSync(vendored, 'utf8');
if (/^\s+data: \[\]$/m.test(raw)) {
  console.error('openapi.yaml still emits `data: []` (invalid schema). Regenerate it with the fixed backend (php scripts/build-openapi.php).');
  process.exit(1);
}
const ast = await openapiTS(raw, { alphabetize: false, exportType: true, emptyObjectsUnknown: true });
const banner = `/* eslint-disable */\n// AUTO-GENERATED from openapi/openapi.yaml by scripts/generate-api-types.mjs. Do not edit.\n\n`;
writeFileSync(resolve(root, 'src/lib/api/schema.d.ts'), banner + astToString(ast));
execFileSync(process.execPath, [resolve(root, 'node_modules/prettier/bin/prettier.cjs'), '--ignore-path', '', '--write', resolve(root, 'src/lib/api/schema.d.ts')], { stdio: 'ignore' });
console.log('✔ src/lib/api/schema.d.ts generated from', source);
