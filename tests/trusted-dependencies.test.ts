import {describe, expect, it} from 'bun:test';
// `Bun.file(dir).exists()` is false for a directory, so the recursion below has to use
// node's existsSync to spot a nested node_modules at all.
import {existsSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');
const NODE_MODULES = join(REPO_ROOT, 'node_modules');

// Declaring `trustedDependencies` at all replaces bun's ~500-package default allow
// list, so this array is the *complete* set of packages permitted to run an install
// hook anywhere in the tree. Anything absent is blocked, silently, at install time.
const EXPECTED_TRUSTED = ['esbuild'];

// The other three packages that ship an install hook today. Each is already blocked on
// `main` (none is in bun's default list, or in the case of re2 it is deliberately not
// carried over), and each is inert without its hook.
const KNOWN_BLOCKED = [
  '@biomejs/biome', // 1.5.3 resolves its platform binary through optionalDependencies
  'es5-ext', // postinstall only prints a funding banner
  're2', // never loaded; see docs/link-metadata-extraction.md
];

const LIFECYCLE_HOOKS = ['preinstall', 'install', 'postinstall'] as const;

type PackageJson = {
  trustedDependencies?: string[];
  scripts?: Record<string, string>;
};

async function readPackageJson(path: string): Promise<PackageJson> {
  return (await Bun.file(path).json()) as PackageJson;
}

// bun.lock is JSONC (trailing commas), so `.json()` throws on it.
async function readLockfile(): Promise<{trustedDependencies?: string[]}> {
  const text = await Bun.file(join(REPO_ROOT, 'bun.lock')).text();
  return Bun.JSONC.parse(text) as {trustedDependencies?: string[]};
}

// Walks nested node_modules too: bun hoists most packages, but a version conflict
// (three esbuild majors here) leaves copies below the top level, and each copy runs
// its own hook.
async function installedPackagesWithHooks(dir: string, scope = ''): Promise<Set<string>> {
  const found = new Set<string>();

  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    if (entry.name === '.bin' || entry.name === '.cache') continue;

    if (entry.name.startsWith('@')) {
      const nested = await installedPackagesWithHooks(join(dir, entry.name), entry.name);
      nested.forEach((name) => found.add(name));
      continue;
    }

    const base = join(dir, entry.name);
    const name = scope ? `${scope}/${entry.name}` : entry.name;

    if (existsSync(join(base, 'package.json'))) {
      const {scripts = {}} = await readPackageJson(join(base, 'package.json'));
      if (LIFECYCLE_HOOKS.some((hook) => scripts[hook])) found.add(name);
    }

    if (existsSync(join(base, 'node_modules'))) {
      const nested = await installedPackagesWithHooks(join(base, 'node_modules'));
      nested.forEach((child) => found.add(child));
    }
  }

  return found;
}

describe('trustedDependencies', function () {
  it('should declare exactly the packages whose install hooks must run', async function () {
    const {trustedDependencies} = await readPackageJson(join(REPO_ROOT, 'package.json'));

    expect(trustedDependencies).toEqual(EXPECTED_TRUSTED);
  });

  // The EAS iOS build runs `bun install --frozen-lockfile` from the repo root on a
  // macOS image with Node 20, where re2's node-gyp 13 fallback dies inside its own
  // bundled undici. re2 is a transitive dep of @metascraper/helpers that nothing ever
  // loads, so the fix is to never build it. Trusting it again re-breaks the build.
  it('should never trust re2', async function () {
    const {trustedDependencies = []} = await readPackageJson(join(REPO_ROOT, 'package.json'));

    expect(trustedDependencies).not.toContain('re2');
  });

  // --frozen-lockfile is what EAS and the Fly Dockerfiles run, and bun mirrors the
  // field into the lockfile. A stale copy there is a lockfile that disagrees with the
  // manifest it was generated from.
  it('should mirror the manifest into bun.lock', async function () {
    const {trustedDependencies} = await readPackageJson(join(REPO_ROOT, 'package.json'));
    const lock = await readLockfile();

    expect(lock.trustedDependencies).toEqual(trustedDependencies);
  });

  // Without this, a newly added native dependency lands in an unbuilt state with no
  // signal: bun prints one "Blocked N postinstalls" line and exits 0, and the failure
  // surfaces as a runtime "cannot find module" somewhere else entirely.
  it('should account for every installed package that ships an install hook', async function () {
    const installed = await installedPackagesWithHooks(NODE_MODULES);

    const unaccounted = [...installed]
      .filter((name) => !EXPECTED_TRUSTED.includes(name) && !KNOWN_BLOCKED.includes(name))
      .sort();

    expect(unaccounted).toEqual([]);
  });
});
