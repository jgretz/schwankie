# Testing — How to Run the Suite

See `.claude/rules/test-coverage.md` for _what_ to test. This file covers _how the
runner behaves_.

## Entry Points

```bash
bun run test                                          # whole repo, per-package processes
bun run test:isolated                                 # whole repo, one process, --isolate
bun test --cwd packages/domain                        # one package
bun test --cwd apps/api tests/routes/links.test.ts    # one file
```

`bun run test` is the default: `concurrently` fans out to nine `bun test --cwd <pkg>`
jobs, so each package gets its own process and failures are attributed per package.
`bun run test:isolated` is the escape hatch for whole-repo flags the fan-out cannot
serve (`--coverage`, `-t <pattern>`, `--changed`).

**Never a bare `bun test` from the repo root.** It discovers the same 762 tests but
reports ~200 failures that do not exist.

## Why the Bare Root Run Is Broken

Two independent causes:

1. **`bunfig.toml` is read from the cwd only — it never inherits from ancestors.**
   `packages/domain/bunfig.toml` and `apps/api/bunfig.toml` each declare a
   `[test] preload`. Run from the root, neither loads: `packages/domain`'s
   `mock.module('../../src/db', ...)` never registers (tests reach for the real
   database) and `apps/api`'s `process.env.API_KEY = 'test-key'` is never set.
   `bun test --cwd <pkg>` works precisely because it makes that package's
   `bunfig.toml` the one bun reads.

2. **The `mock.module` registry is process-global.** Nine files under
   `apps/api/tests/` call `mock.module('@domain', () => ({...}))` with a _partial_
   stub of the domain barrel. In a single-process run that stub replaces
   `packages/domain/src/index.ts` for every file loaded afterwards, so
   `packages/domain`'s own tests get `null` back from domain functions or fail
   outright with `SyntaxError: Export named '...' not found in module`.

`--isolate` re-runs the preload once per test file, which fixes both — but it is
CLI-only (`bunfig.toml [test]` has no `isolate` key) and invisible to a preload
(bun rewrites `process.argv` to just the test file path). So a bare root
`bun test` cannot be made correct by configuration; the only achievable outcome is
to fail fast and name the right commands.

## `scripts/test-preload.ts`

It does two things:

- refuses to run and exits 1 when `SCHWANKIE_TEST_ISOLATED` is unset, printing the
  four commands above;
- otherwise imports both package preloads, making a root `--isolate` run correct.

The sentinel is set by `test:isolated` and by nothing else, which loads the preload
via `--preload` on the command line.

Adding `preload = ["./scripts/test-preload.ts"]` under `[test]` in the **root**
`bunfig.toml` arms the guard for a bare root `bun test` as well. Because bun reads
`bunfig.toml` from the cwd only, that entry affects repo-root invocations and
nothing else — every `bun test --cwd <pkg>` is untouched. **That entry is not
present yet**; until it is added, a bare root `bun test` still reports ~200 phantom
failures rather than failing fast.

## Adding a Package That Needs a Preload

Do both, or the new preload is silently skipped in one of the two run modes:

1. declare it in that package's own `bunfig.toml` (`bun test --cwd <pkg>` and the
   `bun run test` fan-out), **and**
2. import it from `scripts/test-preload.ts` (`bun run test:isolated`).

Also add the matching `test:<pkg>` script to the root `package.json` **and** to the
explicit job list in `"test"`. That list is spelled out rather than globbed as
`bun:test:*` because the glob would otherwise also fan out `test:isolated`.
