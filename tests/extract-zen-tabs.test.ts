import {describe, expect, it} from 'bun:test';
import {join} from 'node:path';

import {parseArgs} from '../scripts/extract-zen-tabs.ts';

const SCRIPT = join(import.meta.dir, '..', 'scripts', 'extract-zen-tabs.ts');

describe('parseArgs', function () {
  it('should fall back to the active session and the To Do group when no flags are passed', function () {
    const args = parseArgs([]);

    expect(args.file).toEndWith('zen-sessions.jsonlz4');
    expect(args.group).toBe('To Do');
    expect(args.out).toBeUndefined();
  });

  it('should read every flag in the --flag value form', function () {
    const args = parseArgs(['--file', '/tmp/s.jsonlz4', '--group', 'Reading', '--out', 'l.json']);

    expect(args).toEqual({file: '/tmp/s.jsonlz4', group: 'Reading', out: 'l.json'});
  });

  it('should read every flag in the --flag=value form', function () {
    const args = parseArgs(['--file=/tmp/s.jsonlz4', '--group=Reading', '--out=l.json']);

    expect(args).toEqual({file: '/tmp/s.jsonlz4', group: 'Reading', out: 'l.json'});
  });

  // Without the guard this reported `No links found in group "To Do"` — an
  // error naming a group the caller never asked for.
  it('should throw rather than default the group when --group has no value', function () {
    expect(() => parseArgs(['--group'])).toThrow('--group requires a group name');
  });

  // Without the guard `file` became the literal string '--group', surfacing as
  // an ENOENT on a file named --group.
  it('should throw rather than eat the next flag when --file has no value', function () {
    expect(() => parseArgs(['--file', '--group', 'To Do'])).toThrow('--file requires a file path');
  });

  // Without the guard the output path was silently dropped and the links went
  // to stdout instead of the file the caller asked for.
  it('should throw rather than discard the output path when --out has no value', function () {
    expect(() => parseArgs(['--group', 'Reading', '--out'])).toThrow('--out requires a file path');
  });
});

describe('extract-zen-tabs CLI', function () {
  it('should exit non-zero and name the flag when --group is given without a value', async function () {
    const result = await Bun.$`bun run ${SCRIPT} --group`.nothrow().quiet();
    const stderr = result.stderr.toString();

    expect(result.exitCode).not.toBe(0);
    expect(stderr).toContain('--group requires a group name');
    expect(stderr).not.toContain('No links found');
  });
});
