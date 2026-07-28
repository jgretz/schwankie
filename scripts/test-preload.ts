// Root `bun test` preload. Loaded by `bun run test:isolated` via --preload, and by a
// bare root `bun test` once it is registered under `[test] preload` in the root
// bunfig.toml. bun reads bunfig.toml only from the cwd, so that registration affects
// repo-root invocations only — every `bun test --cwd <pkg>` is untouched.
//
// A single-process root run is not correctable by configuration: the per-package
// preloads are skipped (bunfig does not inherit) and `mock.module` registers
// process-globally, so the partial `@domain` stubs in apps/api/tests leak into
// packages/domain's own tests. `--isolate` re-runs this preload per test file,
// which fixes both — but it is CLI-only and undetectable from here, hence the
// sentinel env var set by `bun run test:isolated`.

if (!process.env.SCHWANKIE_TEST_ISOLATED) {
  console.error(`
A bare \`bun test\` at the repo root shares one module registry across every
package and silently fails ~200 tests. Use one of these instead:

  bun run test                                    # whole repo, per-package processes
  bun run test:isolated                           # whole repo, one process, --isolate
  bun test --cwd packages/domain                  # one package
  bun test --cwd apps/api tests/routes/links.test.ts   # one file
`);
  process.exit(1);
}

await import('../packages/domain/tests/helpers/preload');
await import('../apps/api/tests/helpers/preload');
