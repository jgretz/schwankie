import {afterEach, describe, expect, it} from 'bun:test';
import {mkdtemp, mkdir, rm, symlink, unlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {
  findMismatches,
  parseDockerfileBunVersion,
  parsePackageManagerVersion,
} from '../scripts/check-bun-version.ts';

const SCRIPT = join(import.meta.dir, '..', 'scripts', 'check-bun-version.ts');

describe('parsePackageManagerVersion', function () {
  it('should return the version when packageManager names bun', function () {
    expect(parsePackageManagerVersion('{"packageManager":"bun@1.3.14"}')).toBe('1.3.14');
  });

  it('should throw when the packageManager field is absent', function () {
    expect(() => parsePackageManagerVersion('{"private":true}')).toThrow(/no "packageManager"/);
  });

  it('should throw when packageManager names a different package manager', function () {
    expect(() => parsePackageManagerVersion('{"packageManager":"pnpm@9.0.0"}')).toThrow(
      /expected a "bun@<version>" value/,
    );
  });

  it('should throw when packageManager has no version', function () {
    expect(() => parsePackageManagerVersion('{"packageManager":"bun@"}')).toThrow(/no version/);
  });
});

describe('parseDockerfileBunVersion', function () {
  it('should return the pinned version when an ARG BUN_VERSION line is present', function () {
    const dockerfile = `ARG BUN_VERSION=1.3.14\nFROM oven/bun:\${BUN_VERSION}-slim AS base\n`;

    expect(parseDockerfileBunVersion(dockerfile)).toBe('1.3.14');
  });

  it('should return null when no ARG BUN_VERSION line is present', function () {
    expect(parseDockerfileBunVersion('FROM oven/bun:latest\n')).toBeNull();
  });
});

describe('findMismatches', function () {
  it('should return nothing when every pin matches', function () {
    const pins = [
      {path: 'deploy/api/Dockerfile', version: '1.3.14'},
      {path: 'deploy/www/Dockerfile', version: '1.3.14'},
    ];

    expect(findMismatches('1.3.14', pins)).toEqual([]);
  });

  it('should report a pin that disagrees with the expected version', function () {
    const pins = [
      {path: 'deploy/api/Dockerfile', version: '1.3.14'},
      {path: 'deploy/www/Dockerfile', version: '1.3.10'},
    ];

    expect(findMismatches('1.3.14', pins)).toEqual([
      {path: 'deploy/www/Dockerfile', expected: '1.3.14', actual: '1.3.10'},
    ]);
  });

  it('should report a missing pin rather than treating it as a pass', function () {
    const pins = [{path: 'deploy/api/Dockerfile', version: null}];

    expect(findMismatches('1.3.14', pins)).toEqual([
      {path: 'deploy/api/Dockerfile', expected: '1.3.14', actual: null},
    ]);
  });
});

describe('check-bun-version CLI', function () {
  let root: string | null = null;

  async function fixture(pins: Record<string, string>): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'check-bun-version-'));
    root = dir;

    await writeFile(join(dir, 'package.json'), '{"packageManager":"bun@1.3.14"}\n');

    await Promise.all(
      Object.entries(pins).map(async function ([app, version]) {
        await mkdir(join(dir, 'deploy', app), {recursive: true});
        await writeFile(
          join(dir, 'deploy', app, 'Dockerfile'),
          `ARG BUN_VERSION=${version}\nFROM oven/bun:\${BUN_VERSION}-slim\n`,
        );
      }),
    );

    return dir;
  }

  afterEach(async function () {
    if (root) await rm(root, {recursive: true, force: true});
    root = null;
  });

  it('should exit 0 when every deploy image agrees with packageManager', async function () {
    const dir = await fixture({'app-a': '1.3.14', 'app-b': '1.3.14'});

    const result = await Bun.$`bun run ${SCRIPT} --root ${dir}`.nothrow().quiet();

    expect(result.exitCode).toBe(0);
  });

  it('should exit 0 when the root is given in the --root=<path> form', async function () {
    const dir = await fixture({'app-a': '1.3.14'});

    const result = await Bun.$`bun run ${SCRIPT} --root=${dir}`.nothrow().quiet();

    expect(result.exitCode).toBe(0);
  });

  it('should exit non-zero and name the file and both versions when a pin drifts', async function () {
    const dir = await fixture({'app-a': '1.3.14', 'app-b': '1.3.10'});

    const result = await Bun.$`bun run ${SCRIPT} --root ${dir}`.nothrow().quiet();
    const stderr = result.stderr.toString();

    expect(result.exitCode).not.toBe(0);
    expect(stderr).toContain('deploy/app-b/Dockerfile');
    expect(stderr).toContain('1.3.14');
    expect(stderr).toContain('1.3.10');
  });

  it('should exit non-zero when a Dockerfile declares no pin', async function () {
    const dir = await fixture({'app-a': '1.3.14'});
    await writeFile(join(dir, 'deploy', 'app-a', 'Dockerfile'), 'FROM oven/bun:slim\n');

    const result = await Bun.$`bun run ${SCRIPT} --root ${dir}`.nothrow().quiet();

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain('no "ARG BUN_VERSION=" line');
  });

  // Without the guard this silently audits the cwd — which passes — hiding the typo.
  it('should exit non-zero when --root is given without a path', async function () {
    const result = await Bun.$`bun run ${SCRIPT} --root`.nothrow().quiet();

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain('--root requires a directory path');
  });

  it('should report a usage mistake as a bare message rather than a stack trace', async function () {
    const result = await Bun.$`bun run ${SCRIPT} --root`.nothrow().quiet();

    expect(result.exitCode).toBe(2);
    expect(result.stderr.toString()).not.toMatch(/^\s+at /m);
  });

  // The usage guard must stay narrow. Widening it over main() would reduce an
  // unexpected I/O fault to the same bare one-liner and the same exit 2 as a
  // typo'd flag — losing both the syscall detail and the ability to tell a bug
  // apart from a usage mistake. A self-referential symlink is the cheapest way
  // to raise a fault main() does not itself handle.
  //
  // Asserted on the *shape* of the dumped error, not on a specific errno: this
  // suite runs on macOS locally and ubuntu in CI, and pinning the code a
  // self-symlink produces would couple the guard to the platform rather than to
  // the behavior under test.
  it('should keep the syscall detail when the failure is not a usage mistake', async function () {
    const dir = await fixture({'app-a': '1.3.14'});
    const dockerfile = join(dir, 'deploy', 'app-a', 'Dockerfile');
    await unlink(dockerfile);
    await symlink('Dockerfile', dockerfile);

    const result = await Bun.$`bun run ${SCRIPT} --root ${dir}`.nothrow().quiet();
    const stderr = result.stderr.toString();

    expect(result.exitCode).not.toBe(2);
    expect(stderr).toContain('syscall');
    expect(stderr).toMatch(/code: "E[A-Z]+"/);
  });

  it('should exit non-zero when no deploy Dockerfiles are found', async function () {
    const dir = await fixture({});

    const result = await Bun.$`bun run ${SCRIPT} --root ${dir}`.nothrow().quiet();

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain('deploy/*/Dockerfile');
  });
});
