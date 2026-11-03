import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Workflow = {
  on: Record<string, unknown>;
  permissions: Record<string, string>;
  jobs: Record<string, { if?: string; environment?: string; needs?: string | string[]; 'runs-on'?: string; steps?: { uses?: string; if?: string; run?: string }[] }>;
};
const require = createRequire(import.meta.url);
const load = require('js-yaml').load as (text: string) => Workflow;
const workflow = (name: string) => load(readFileSync(resolve('.github/workflows', name), 'utf8'));

describe('production deployment security contracts', () => {
  it('requires manual authorization, exact SHA validation, and production environment', () => {
    const deploy = workflow('deploy.yml');
    expect(Object.keys(deploy.on)).toEqual(['workflow_dispatch']);
    expect(deploy.permissions).toEqual({ contents: 'read' });
    expect(deploy.jobs.authorize.if).toContain('inputs.authorization');
    expect(deploy.jobs.authorize.if).toContain('DEPLOY_ENABLED');
    expect(deploy.jobs.build.environment).toBeUndefined();
    expect(JSON.stringify(deploy.jobs.build)).not.toContain('secrets.');
    expect(deploy.jobs.deploy.needs).toContain('build');
    for (const step of deploy.jobs.deploy.steps ?? []) {
      expect(step.run ?? '').not.toMatch(/npm |composer |build-web/);
    }
    for (const name of ['deploy', 'rollback']) {
      expect(deploy.jobs[name].environment).toBe('production');
      expect([deploy.jobs[name].needs].flat()).toContain('authorize');
      expect(deploy.jobs[name].steps?.some((step) => step.if === 'always()' && step.run?.includes('cleanup-ssh.sh'))).toBe(true);
    }
  });

  it('builds independently on the Ubuntu 22.04 runtime baseline', () => {
    const ci = workflow('ci.yml');
    expect(ci.on).toHaveProperty('push');
    expect(ci.jobs.build.if).toBeUndefined();
    expect(ci.jobs.build['runs-on']).toBe('ubuntu-22.04');
    expect(ci.jobs.build.steps?.some((step) => step.run?.includes('build-web.sh'))).toBe(true);
  });

  it('pins all external actions to the verified upstream commits', () => {
    const pins = JSON.parse(readFileSync(resolve('deploy/ACTION_PINS.json'), 'utf8')).actions as Record<string, { sha: string }>;
    for (const name of ['ci.yml', '_test.yml', 'deploy.yml']) {
      for (const job of Object.values(workflow(name).jobs)) {
        for (const step of job.steps ?? []) {
          if (!step.uses) continue;
          const [action, sha] = step.uses.split('@');
          expect(sha).toMatch(/^[0-9a-f]{40}$/);
          expect(sha).toBe(pins[action].sha);
        }
      }
    }
  });
});
