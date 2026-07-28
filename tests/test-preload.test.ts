import {describe, expect, it} from 'bun:test';
import {join} from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');
const SCRIPT = join(REPO_ROOT, 'scripts', 'test-preload.ts');

// Set on the child of the bunfig-wiring test below. Spawning `bun test` at the repo
// root is only safe while the guard exits before any test runs; if the bunfig entry
// regresses, the child would reach this file and spawn a grandchild, and so on. The
// marker makes that fork bomb impossible — a child skips the spawning test outright.
const PROBE = 'SCHWANKIE_TEST_GUARD_PROBE';

// `bun run test:isolated` sets the sentinel for the whole run, so the refusal cases
// have to clear it explicitly ('' is falsy to the guard); inheriting the ambient
// environment would silently exercise the pass-through branch instead.
function runGuard(sentinel: string) {
  return Bun.$`bun run ${SCRIPT}`
    .env({...process.env, SCHWANKIE_TEST_ISOLATED: sentinel})
    .nothrow()
    .quiet();
}

describe('test-preload guard', function () {
  it('should exit non-zero when the isolation sentinel is unset', async function () {
    const result = await runGuard('');

    expect(result.exitCode).not.toBe(0);
  });

  it('should explain why a bare root run is refused', async function () {
    const result = await runGuard('');

    expect(result.stderr.toString()).toContain('shares one module registry');
  });

  // The whole point of failing fast is handing over commands that work; a message
  // that only says "no" costs the reader the same session it was meant to save.
  it('should name the whole-repo, isolated and per-package commands', async function () {
    const stderr = (await runGuard('')).stderr.toString();

    expect(stderr).toContain('bun run test');
    expect(stderr).toContain('bun run test:isolated');
    expect(stderr).toContain('bun test --cwd');
  });

  // Exit 0 also proves both package preloads resolved — a bad specifier would throw.
  it('should pass through to the package preloads when the sentinel is set', async function () {
    const result = await runGuard('1');

    expect(result.exitCode).toBe(0);
  });

  // The guard is only worth anything if the root bunfig.toml actually invokes it.
  // It shipped once without that entry, which made the script unreachable and left a
  // bare root run reporting ~200 phantom failures; this is the regression test.
  it.skipIf(Boolean(process.env[PROBE]))(
    'should refuse a bare repo-root `bun test` before running any test',
    async function () {
      const result = await Bun.$`bun test`
        .cwd(REPO_ROOT)
        .env({...process.env, SCHWANKIE_TEST_ISOLATED: '', [PROBE]: '1'})
        .nothrow()
        .quiet();

      const stderr = result.stderr.toString();
      // Collapsed to a boolean deliberately: a regressed child runs the whole repo,
      // and asserting on `stderr` itself would bury the result under ~200KB of its
      // output. Reproduce by hand with a bare `bun test` at the repo root.
      const refusedBeforeRunningAnything =
        stderr.includes('shares one module registry') && !/Ran \d+ tests/.test(stderr);

      expect(result.exitCode).toBe(1);
      expect(refusedBeforeRunningAnything).toBe(true);
    },
    // Armed, the child exits in well under a second. The generous budget only comes
    // into play if the guard regresses, and buys a named assertion failure — the
    // child running all 766 tests — instead of an ambiguous timeout.
    120_000,
  );
});
