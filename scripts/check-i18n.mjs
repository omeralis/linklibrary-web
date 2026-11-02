#!/usr/bin/env node
/**
 * i18n consistency check:
 *  1. ar.json and en.json have exactly the same keys;
 *  2. every statically-referenced translation key used in src/ exists in both files;
 *  3. dynamic keys (`t(\`status.${x}\`)`) must at least have their static prefix object.
 * Usage: node scripts/check-i18n.mjs [--list]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const messages = {
  ar: JSON.parse(readFileSync(join(root, 'src/messages/ar.json'), 'utf8')),
  en: JSON.parse(readFileSync(join(root, 'src/messages/en.json'), 'utf8')),
};

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.set(key, 'object');
      flatten(v, key, out);
    } else out.set(key, Array.isArray(v) ? 'array' : 'leaf');
  }
  return out;
}
const flat = { ar: flatten(messages.ar), en: flatten(messages.en) };

const problems = [];
for (const [a, b] of [['ar', 'en'], ['en', 'ar']]) {
  for (const key of flat[a].keys()) if (!flat[b].has(key)) problems.push(`key "${key}" exists in ${a}.json but not in ${b}.json`);
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?|mts)$/.test(name) && !/\.d\.ts$/.test(name) && !/\.test\./.test(name)) files.push(p);
  }
  return files;
}

const declRe = /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:'([^']*)'|\{[^}]*namespace:\s*'([^']*)'[^}]*\})?\s*\)/g;
const used = new Set();
for (const file of walk(join(root, 'src'))) {
  const src = readFileSync(file, 'utf8');
  const decls = [...src.matchAll(declRe)].map((m) => ({ name: m[1], ns: m[2] ?? m[3] ?? '', index: m.index }));
  if (decls.length === 0) continue;
  const names = [...new Set(decls.map((d) => d.name))];
  const callRe = new RegExp(`\\b(${names.join('|')})(?:\\.(?:rich|raw|markup|has))?\\(\\s*(['\`])([^'\`]*?)\\2`, 'g');
  for (const m of src.matchAll(callRe)) {
    const decl = decls.filter((d) => d.name === m[1] && d.index < m.index).pop();
    if (!decl) continue;
    const literal = m[3];
    const isTemplate = m[2] === '`' && literal.includes('${');
    const keyPart = isTemplate ? literal.slice(0, literal.indexOf('${')).replace(/\.$/, '') : literal;
    const full = [decl.ns, keyPart].filter(Boolean).join('.');
    const where = `${relative(root, file)}`;
    if (isTemplate) {
      if (!full) continue;
      for (const loc of ['ar', 'en']) if (flat[loc].get(full) !== 'object') problems.push(`[${loc}] dynamic prefix "${full}" missing (${where})`);
      used.add(`${full}.*`);
    } else {
      used.add(full);
      for (const loc of ['ar', 'en']) if (!flat[loc].has(full)) problems.push(`[${loc}] missing "${full}" (${where})`);
    }
  }
}

if (process.argv.includes('--list')) console.log([...used].sort().join('\n'));
if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  console.error(`\n✖ ${new Set(problems).size} i18n problem(s)`);
  process.exitCode = 1; // (not process.exit: it truncates piped output)
} else console.log(`✔ i18n OK — ${flat.en.size} keys per locale, ${used.size} static references checked`);
