# Script Flags — a Valueless Flag Throws, It Never Falls Back

## The Bug Class

A hand-rolled parser reads a flag's value as "the next argv element" and falls
back to a default when it isn't there. `bun run scripts/check-bun-version.ts
--root` (path dropped) audited `process.cwd()` and reported a **pass** — a CI
guard whose only job is to fail returned a silent false green. Same bug, three
surfaces: a masked default, `--file --group x` swallowing `'--group'` as the
file path, and a valueless `--out` silently discarding the output file.

## The Rule

Repo CLI scripts read value-taking flags through `readFlag` from
`scripts/lib/flags.ts`. A flag that is **present but valueless** throws; the
caller's default is returned **only when the flag is absent entirely**.

```ts
// WRONG — a valueless --group silently becomes the default
const i = args.indexOf('--group');
const group = i === -1 ? 'To Do' : (args[i + 1] ?? 'To Do');

// CORRECT — absent → default; present-but-valueless → throws
import {readFlag} from './lib/flags';
const group = readFlag(argv, 'group', {default: 'To Do', valueName: 'group name'});
```

`readFlag` accepts both `--group value` and `--group=value`, and rejects an
empty value or one that looks like another flag (pass `--group=--x` to mean it).

Boolean flags are structurally immune — `argv.includes('--dry-run')` is fine and
needs no helper.

## Enforcement

`tests/script-flag-parsing.test.ts` sweeps every `.ts` under `scripts/` and
`apps/tasks/src/scripts/`, failing on `.indexOf('--…')` and on an
adjacent-index read off an `args`/`argv` identifier. `scripts/lib/flags.ts` is
the sole allowlisted file, and the sweep asserts that exemption is still earned.

It is a **grep heuristic**, not a type-level guarantee — a differently-named
array (`rest[i + 1]`) slips past it. A green sweep means "the known regression
is absent", not "the bug is impossible".

## Relation to `~/.claude/rules/cli.md`

Its declarative `FlagSpec[]` + `parseFlags` starts paying off above ~3 flags on
one command or the same shape in ≥3 commands, and neither threshold is met here
(two scripts, ≤3 flags each, no subcommands) — revisit when a third
value-taking CLI appears.
