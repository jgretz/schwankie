import {describe, expect, it} from 'bun:test';
import {join} from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');
const SCAN_ROOTS = ['scripts', 'apps/tasks/src/scripts'];

// The sanctioned implementation — it is the one file that legitimately reads
// `argv[index + 1]`, because it is what every other script defers to.
const ALLOWED = new Set(['scripts/lib/flags.ts']);

// A grep heuristic, not a type-level guarantee: it catches the shapes the bug
// actually shipped in, not every way it could be written.
//
// The adjacent-read patterns are scoped to an `args`/`argv` identifier rather
// than matching a bare `[i + 1]`. The unscoped form also hits legitimate
// byte-decoding — `compressed[src + 1]` in the mozlz4 reader in
// extract-zen-tabs.ts — so it would have to be suppressed there, which is worse
// than under-matching: a suppression on a whole file blinds the sweep to a real
// offender added to it later. Widening within that scope is free, so each way
// of reaching the next element off an argv-shaped name gets its own pattern.
//
// `sample` pins the pattern to the shape it is meant to reject. A regex that
// silently stops matching leaves the sweep permanently green — the same
// false-green failure mode the guard itself exists to prevent — and only the
// one pattern `flags.ts` happens to trip is covered by the allowlist check
// below. Samples live in this file, which no scan root covers, so they cannot
// trip the sweep they document.
const BAD_PATTERNS = [
  {
    name: 'a hand-rolled flag lookup',
    pattern: /\.indexOf\(\s*['"`]--/,
    sample: "const i = args.indexOf('--group');",
  },
  {
    name: 'an adjacent-index read off argv',
    pattern: /(?:args|argv)\w*\s*(?:\?\.)?\[\s*\w+\s*\+\s*1\s*\]/i,
    sample: 'const value = rawArgs?.[index + 1];',
  },
  {
    name: 'an adjacent .at() read off argv',
    pattern: /(?:args|argv)\w*\s*\.at\(\s*\w+\s*\+\s*1\s*\)/i,
    sample: 'const value = argv.at(index + 1);',
  },
];

const scriptFiles = (
  await Promise.all(
    SCAN_ROOTS.map(async function (root) {
      const paths = await Array.fromAsync(
        new Bun.Glob('**/*.ts').scan({cwd: join(REPO_ROOT, root)}),
      );
      return paths.map((path) => `${root}/${path}`);
    }),
  )
)
  .flat()
  .sort();

describe('repo CLI script flag parsing', function () {
  // A broken enumeration would leave this sweep permanently green.
  it('should find script files to sweep', function () {
    expect(scriptFiles.length).toBeGreaterThanOrEqual(3);
  });

  // A narrowed glob can still clear the count above while covering nothing in
  // one of the roots — a missing root throws ENOENT during the scan instead.
  it('should find script files under every scan root', function () {
    const empty = SCAN_ROOTS.filter(
      (root) => !scriptFiles.some((file) => file.startsWith(`${root}/`)),
    );

    expect(empty).toEqual([]);
  });

  it('should still match the shape each pattern is meant to reject', function () {
    const blind = BAD_PATTERNS.filter(({pattern, sample}) => !pattern.test(sample)).map(
      ({name}) => `${name} no longer matches its own sample`,
    );

    expect(blind).toEqual([]);
  });

  // An exemption that outlives its reason is the fourth way this sweep could go
  // quietly green: rename or rewrite flags.ts and the entry keeps waiving a file
  // that no longer needs waiving — or no longer exists.
  it('should not keep an allowlist entry that is no longer earned', async function () {
    const stale = await Promise.all(
      [...ALLOWED].map(async function (file) {
        if (!scriptFiles.includes(file)) return `${file} is allowlisted but was not found`;

        const source = await Bun.file(join(REPO_ROOT, file)).text();
        const trips = BAD_PATTERNS.some(({pattern}) => pattern.test(source));
        return trips ? null : `${file} is allowlisted but no longer trips a pattern`;
      }),
    );

    expect(stale.filter(Boolean)).toEqual([]);
  });

  it('should not hand-roll flag parsing in any script', async function () {
    const offenders = (
      await Promise.all(
        scriptFiles
          .filter((file) => !ALLOWED.has(file))
          .map(async function (file) {
            const source = await Bun.file(join(REPO_ROOT, file)).text();
            return BAD_PATTERNS.filter(({pattern}) => pattern.test(source)).map(
              ({name}) =>
                `${file} contains ${name} — read value-taking flags through readFlag from scripts/lib/flags.ts`,
            );
          }),
      )
    ).flat();

    expect(offenders).toEqual([]);
  });
});
