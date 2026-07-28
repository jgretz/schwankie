#!/usr/bin/env bun
/**
 * Verifies every deploy image pins the same bun version as the root
 * package.json "packageManager" field — the single source of truth.
 *
 * Usage:
 *   bun run scripts/check-bun-version.ts
 *   bun run scripts/check-bun-version.ts --root /path/to/tree
 *
 * Exits 0 when every deploy/<app>/Dockerfile agrees, 1 on any mismatch,
 * missing pin, unreadable package.json, or an empty glob.
 */

import {join, resolve} from 'node:path';

import {readFlag} from './lib/flags';

const DOCKERFILE_GLOB = 'deploy/*/Dockerfile';
const PACKAGE_MANAGER_PREFIX = 'bun@';
const ARG_BUN_VERSION = /^ARG\s+BUN_VERSION=(\S+)/m;

export type BunPin = {path: string; version: string | null};
export type Mismatch = {path: string; expected: string; actual: string | null};

export function parsePackageManagerVersion(pkgJson: string): string {
  const {packageManager} = JSON.parse(pkgJson) as {packageManager?: unknown};

  if (typeof packageManager !== 'string')
    throw new Error(
      'package.json has no "packageManager" string — nothing to compare pins against',
    );

  if (!packageManager.startsWith(PACKAGE_MANAGER_PREFIX))
    throw new Error(
      `"packageManager" is ${JSON.stringify(packageManager)}, expected a "bun@<version>" value`,
    );

  const version = packageManager.slice(PACKAGE_MANAGER_PREFIX.length);
  if (!version) throw new Error('"packageManager" is "bun@" with no version');

  return version;
}

/** `null` means the file declares no pin — a reported condition, not a pass. */
export function parseDockerfileBunVersion(dockerfile: string): string | null {
  return ARG_BUN_VERSION.exec(dockerfile)?.[1] ?? null;
}

export function findMismatches(expected: string, pins: ReadonlyArray<BunPin>): Mismatch[] {
  return pins
    .filter((pin) => pin.version !== expected)
    .map((pin) => ({path: pin.path, expected, actual: pin.version}));
}

function formatMismatch(mismatch: Mismatch): string {
  const actual = mismatch.actual ?? 'no "ARG BUN_VERSION=" line';
  return `${mismatch.path}: expected bun ${mismatch.expected}, found ${actual}`;
}

async function main(root: string): Promise<number> {
  const pkgPath = join(root, 'package.json');

  let expected: string;
  try {
    expected = parsePackageManagerVersion(await Bun.file(pkgPath).text());
  } catch (error) {
    console.error(`Could not read the bun version from ${pkgPath}:`, error);
    return 1;
  }

  const paths = (await Array.fromAsync(new Bun.Glob(DOCKERFILE_GLOB).scan({cwd: root}))).sort();

  // An empty glob would leave the guard permanently green.
  if (paths.length === 0) {
    console.error(`No files matched ${DOCKERFILE_GLOB} under ${root}`);
    return 1;
  }

  const pins = await Promise.all(
    paths.map(async (path) => ({
      path,
      version: parseDockerfileBunVersion(await Bun.file(join(root, path)).text()),
    })),
  );

  const mismatches = findMismatches(expected, pins);

  if (mismatches.length === 0) {
    console.log(`bun ${expected} pinned consistently across ${paths.length} deploy image(s)`);
    return 0;
  }

  console.error(mismatches.map(formatMismatch).join('\n'));
  console.error(`Update the pin(s) to match "packageManager" in ${pkgPath}.`);
  return 1;
}

/** Throws on a valueless `--root` rather than silently auditing the cwd instead. */
function readRootFlag(argv: ReadonlyArray<string>): string {
  return resolve(readFlag(argv, 'root', {default: process.cwd(), valueName: 'directory path'}));
}

if (import.meta.main) {
  let root: string;

  // Only the flag parse is guarded. A usage mistake deserves a one-line message,
  // but a genuine failure inside main() — an unreadable Dockerfile, say — must
  // keep its stack trace to stay diagnosable.
  try {
    root = readRootFlag(Bun.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? `Error: ${error.message}` : error);
    process.exit(2);
  }

  process.exit(await main(root));
}
