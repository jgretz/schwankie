import {beforeAll, describe, expect, it, mock} from 'bun:test';

mock.module('../../src/lib/env.server', () => ({
  getEnv: () => ({
    ALLOWED_EMAIL: 'admin@example.com',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/callback',
    SESSION_SECRET: 'a'.repeat(32),
    API_KEY: 'test-api-key',
  }),
}));

let isAllowedEmail: (email: string) => boolean;

beforeAll(async function () {
  const mod = await import('../../src/lib/auth.server');
  isAllowedEmail = mod.isAllowedEmail;
});

describe('isAllowedEmail', function () {
  it('should return true for exact match', function () {
    expect(isAllowedEmail('admin@example.com')).toBe(true);
  });

  it('should return true for case-insensitive match', function () {
    expect(isAllowedEmail('Admin@Example.COM')).toBe(true);
  });

  it('should return false for non-matching email', function () {
    expect(isAllowedEmail('other@example.com')).toBe(false);
  });

  it('should return false for empty string', function () {
    expect(isAllowedEmail('')).toBe(false);
  });

  it('should return false for partial match', function () {
    expect(isAllowedEmail('admin@example.co')).toBe(false);
  });
});
