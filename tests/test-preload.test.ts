import {describe, expect, it} from 'bun:test';
import {join} from 'node:path';

const SCRIPT = join(import.meta.dir, '..', 'scripts', 'test-preload.ts');

// The guard reads the sentinel from the environment, and `bun run test:isolated`
// sets it for the whole run — so it must be cleared explicitly, or these cases
// would silently exercise the pass-through branch under `bun run test:isolated`.
function runGuard(isolated: string) {
  return Bun.$`bun run ${SCRIPT}`
    .env({...process.env, SCHWANKIE_TEST_ISOLATED: isolated})
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
});
