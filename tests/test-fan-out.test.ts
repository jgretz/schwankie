import {describe, expect, it} from 'bun:test';
import {join} from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');

// `"test"` names its nine jobs explicitly instead of globbing `bun:test:*`, because
// the glob would also fan out `test:isolated` — a whole second repo run inside the
// fan-out. The cost of spelling them out is that a new `test:<pkg>` script is only
// one edit away from never running: `bun run test` would still report nine green
// jobs with the new package simply absent, and CI runs no tests at all to catch it.
const NOT_FANNED_OUT = ['test:isolated'];

async function readScripts(): Promise<Record<string, string>> {
  const pkg = await Bun.file(join(REPO_ROOT, 'package.json')).json();
  return pkg.scripts;
}

describe('root test fan-out', function () {
  it('should fan out every test script except the isolated whole-repo run', async function () {
    const scripts = await readScripts();
    // Tokenised, not substring-matched: `bun:test:tasks` contains `bun:test:task`, so
    // a new `test:task` script would read as already fanned out and never run — the
    // one drift this test exists to catch.
    const fannedOut = new Set(scripts.test!.split(/\s+/));

    const missing = Object.keys(scripts)
      .filter((name) => name.startsWith('test:') && !NOT_FANNED_OUT.includes(name))
      .filter((name) => !fannedOut.has(`bun:${name}`));

    expect(missing).toEqual([]);
  });

  // The exclusion above is only safe while `test:isolated` stays out of the list —
  // in it, `bun run test` would recursively run the whole repo a second time.
  it('should not fan out the isolated whole-repo run', async function () {
    const scripts = await readScripts();

    expect(scripts.test).not.toContain('bun:test:isolated');
  });
});
