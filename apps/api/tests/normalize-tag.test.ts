import {describe, expect, it} from 'bun:test';
import {normalizeTag} from '@domain';

describe('normalizeTag', function () {
  it('should trim whitespace', function () {
    expect(normalizeTag('  hello  ')).toBe('hello');
  });

  it('should lowercase', function () {
    expect(normalizeTag('JavaScript')).toBe('javascript');
  });

  it('should replace spaces with hyphens', function () {
    expect(normalizeTag('web dev tools')).toBe('web-dev-tools');
  });

  it('should collapse multiple spaces into single hyphen', function () {
    expect(normalizeTag('web   dev')).toBe('web-dev');
  });

  it('should strip non-alphanumeric chars except hyphens', function () {
    expect(normalizeTag('c++ & rust!')).toBe('c-rust');
  });

  it('should collapse consecutive hyphens', function () {
    expect(normalizeTag('foo---bar')).toBe('foo-bar');
  });

  it('should strip leading and trailing hyphens', function () {
    expect(normalizeTag('-hello-')).toBe('hello');
    expect(normalizeTag('---test---')).toBe('test');
  });

  it('should return null for empty string', function () {
    expect(normalizeTag('')).toBeNull();
  });

  it('should return null for whitespace only', function () {
    expect(normalizeTag('   ')).toBeNull();
  });

  it('should return null for only special chars', function () {
    expect(normalizeTag('!@#$%^&*()')).toBeNull();
  });

  it('should handle unicode by stripping non-ascii', function () {
    expect(normalizeTag('café')).toBe('caf');
  });

  it('should handle mixed case with spaces and special chars', function () {
    expect(normalizeTag('  React Native  &  Expo  ')).toBe('react-native-expo');
  });

  it('should be idempotent', function () {
    const inputs = ['JavaScript', 'web dev tools', '  React Native  ', 'foo---bar', 'c++'];
    for (const input of inputs) {
      const once = normalizeTag(input);
      if (once !== null) {
        expect(normalizeTag(once)).toBe(once);
      }
    }
  });

  it('should preserve numbers', function () {
    expect(normalizeTag('web3')).toBe('web3');
    expect(normalizeTag('ES2024')).toBe('es2024');
  });
});
