import {describe, expect, it} from 'bun:test';
import {join} from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');
const WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'checks.yml');

// Spawning `bunx prettier` is ~0.5s cold. The generous budget only matters when a
// path regresses; it buys a named assertion failure instead of an ambiguous timeout.
const SPAWN_TIMEOUT = 30_000;

type PackageJson = {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};

type Step = {uses?: string; run?: string; with?: Record<string, string>};
type Workflow = {jobs: Record<string, {steps: Step[]}>};

async function readPackageJson(): Promise<PackageJson> {
  return (await Bun.file(join(REPO_ROOT, 'package.json')).json()) as PackageJson;
}

// Parsed, not substring-matched: `checks.yml` names five jobs that share the same
// four steps, so `.includes('bun run format:check')` would still pass if the string
// were left behind in a comment, or if the `format` job were folded into `lint`.
async function readWorkflow(): Promise<Workflow> {
  return Bun.YAML.parse(await Bun.file(WORKFLOW).text()) as Workflow;
}

function runSteps(workflow: Workflow, job: string): string[] {
  return (workflow.jobs[job]?.steps ?? []).flatMap((step) => (step.run ? [step.run] : []));
}

// `--file-info` is Prettier's own answer to "would the gate look at this file?", so
// this exercises the real ignore resolution — including Prettier 3's default of
// reading `.gitignore` alongside `.prettierignore`, which the Node API does not apply
// unless handed an explicit `ignorePath`. Re-deriving that default here would test
// this file's idea of the CLI rather than the CLI.
async function isIgnoredByPrettier(path: string): Promise<boolean> {
  const result = await Bun.$`bunx prettier --file-info ${path}`.cwd(REPO_ROOT).nothrow().quiet();

  if (result.exitCode !== 0) {
    throw new Error(`prettier --file-info ${path} failed: ${result.stderr.toString()}`);
  }

  const {ignored} = JSON.parse(result.stdout.toString()) as {ignored: boolean};
  return ignored;
}

describe('format scripts', function () {
  it('should expose a format script that rewrites the tree', async function () {
    const {scripts} = await readPackageJson();

    expect(scripts.format).toBe('prettier --write .');
  });

  // If this ever became `--write`, the CI job would reformat its own checkout and
  // report green on a branch that never had to be formatted — a gate that passes
  // unconditionally is worse than no gate, because it reads as coverage.
  it('should expose a format:check script that only checks', async function () {
    const {scripts} = await readPackageJson();

    expect(scripts['format:check']).toBe('prettier --check .');
  });

  // Once `--check` is a merge gate, a caret range means a routine lockfile refresh
  // can pick up a minor bump, change a formatting default, and redden CI on a PR
  // that touched none of it. The repo pins @biomejs/biome and drizzle-orm for the
  // same reason.
  it('should pin prettier to an exact version', async function () {
    const {devDependencies} = await readPackageJson();

    expect(devDependencies.prettier).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('format CI job', function () {
  it('should run format:check in a job of its own', async function () {
    const workflow = await readWorkflow();

    expect(runSteps(workflow, 'format')).toContain('bun run format:check');
  });

  // Prettier is a devDependency, so the check resolves nothing without an install
  // first. Ordering is asserted rather than mere presence: a job that runs the
  // check before installing fails on a missing binary, not on real drift.
  it('should install dependencies before checking formatting', async function () {
    const steps = runSteps(await readWorkflow(), 'format');

    expect(steps.indexOf('bun install')).toBeGreaterThanOrEqual(0);
    expect(steps.indexOf('bun install')).toBeLessThan(steps.indexOf('bun run format:check'));
  });

  // Every other job reads the bun version from package.json rather than floating on
  // setup-bun's latest, so formatting is checked by the same bun the repo pins.
  it('should pin the bun version from package.json like every other job', async function () {
    const workflow = await readWorkflow();

    const setupBun = (workflow.jobs.format?.steps ?? []).find((step) =>
      step.uses?.startsWith('oven-sh/setup-bun@'),
    );

    expect(setupBun?.with?.['bun-version-file']).toBe('package.json');
  });
});

// One representative path per `.prettierignore` entry. Each is asserted to exist as
// well as to be ignored: ignoring is pattern-based and answers happily for a path
// that is no longer on disk, so a stale entry would otherwise pass forever while
// covering nothing.
const IGNORED_PATHS: [string, string][] = [
  ['drizzle-kit output', 'packages/database/drizzle/meta/_journal.json'],
  ['the generated route tree', 'apps/www/src/routeTree.gen.ts'],
  [
    'the Xcode asset catalog',
    'apps/mobile/targets/share/Assets.xcassets/AppIcon.appiconset/Contents.json',
  ],
  ['agent instruction files', '.claude/rules/lint.md'],
  ['agent config files', '.toryo/sequences/daily-summary.yaml'],
];

// The other direction, and the one that matters most: a red gate is cheapest to
// "fix" by widening `.prettierignore`, and a single `**` or `.` entry would turn
// `format:check` into a no-op that still reports green. These four cover the file
// types the sweep actually reformatted.
const CHECKED_PATHS: string[] = [
  'scripts/extract-zen-tabs.ts',
  'apps/www/src/routes/__root.tsx',
  'docs/link-metadata-extraction.md',
  'package.json',
];

describe('prettier ignore list', function () {
  it.each(IGNORED_PATHS)(
    'should exclude %s from the gate',
    async function (_label, path) {
      expect(await Bun.file(join(REPO_ROOT, path)).exists()).toBe(true);
      expect(await isIgnoredByPrettier(path)).toBe(true);
    },
    SPAWN_TIMEOUT,
  );

  it.each(CHECKED_PATHS)(
    'should still check %s',
    async function (path) {
      expect(await isIgnoredByPrettier(path)).toBe(false);
    },
    SPAWN_TIMEOUT,
  );
});
