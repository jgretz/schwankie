import {describe, expect, it} from 'bun:test';

import {readFlag} from '../../scripts/lib/flags.ts';

describe('readFlag', function () {
  it('should return the default when the flag is absent', function () {
    expect(readFlag(['--other', 'x'], 'root', {default: '/fallback'})).toBe('/fallback');
  });

  it('should return undefined when the flag is absent and no default is given', function () {
    expect(readFlag(['--other', 'x'], 'root')).toBeUndefined();
  });

  it('should return the next argument in the --flag value form', function () {
    expect(readFlag(['--root', '/tmp/x'], 'root')).toBe('/tmp/x');
  });

  it('should return the inline value in the --flag=value form', function () {
    expect(readFlag(['--root=/tmp/x'], 'root')).toBe('/tmp/x');
  });

  it('should throw when the flag is the last argument', function () {
    expect(() => readFlag(['--root'], 'root', {default: '/fallback'})).toThrow(
      '--root requires a value',
    );
  });

  it('should name the value in the message when valueName is given', function () {
    expect(() => readFlag(['--root'], 'root', {valueName: 'directory path'})).toThrow(
      '--root requires a directory path',
    );
  });

  it('should throw rather than eat the next flag as a value', function () {
    expect(() => readFlag(['--root', '--other'], 'root', {default: '/fallback'})).toThrow(
      '--root requires a value',
    );
  });

  it('should hint at the equals form when the value would start with a double dash', function () {
    expect(() => readFlag(['--root', '--other'], 'root')).toThrow('--root=<value>');
  });

  it('should throw when the equals form carries an empty value', function () {
    expect(() => readFlag(['--root='], 'root')).toThrow('--root requires a value');
  });

  it('should throw when the separate value is an empty string', function () {
    expect(() => readFlag(['--root', ''], 'root')).toThrow('--root requires a value');
  });

  it('should use the first occurrence when the flag is repeated', function () {
    expect(readFlag(['--root', '/first', '--root', '/second'], 'root')).toBe('/first');
  });

  it('should not match a flag whose name merely shares a prefix', function () {
    expect(readFlag(['--rooted', '/tmp/x'], 'root', {default: '/fallback'})).toBe('/fallback');
  });
});
