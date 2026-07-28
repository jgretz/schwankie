// Root `bun test` preload — see docs/testing.md for the two root causes.
//
// A single-process root run cannot be made correct by configuration, only by
// `--isolate`, which re-runs this preload per test file. That flag is CLI-only and
// undetectable from here (bun rewrites `process.argv` to the test file path), hence
// the sentinel env var that `bun run test:isolated` sets.

if (!process.env.SCHWANKIE_TEST_ISOLATED) {
  console.error(`
A bare \`bun test\` at the repo root shares one module registry across every
package and silently fails ~200 tests. Use one of these instead:

  bun run test                                          # whole repo, per-package processes
  bun run test:isolated                                 # whole repo, one process, --isolate
  bun test --cwd packages/domain                        # one package
  bun test --cwd apps/api tests/routes/links.test.ts    # one file
`);
  process.exit(1);
}

await import('../packages/domain/tests/helpers/preload');
await import('../apps/api/tests/helpers/preload');
