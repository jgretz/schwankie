import {beforeEach, describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {getGmailTokens} from '../../src/queries/get-gmail-tokens';
import {setGmailTokens} from '../../src/commands/set-gmail-tokens';

describe('getGmailTokens', function () {
  setupDb();

  beforeEach(function () {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.from(
      new Uint8Array(32).fill(0),
    ).toString('base64');
  });

  it('should return null when tokens not set', async function () {
    const result = await getGmailTokens();
    expect(result).toBeNull();
  });

  it('should return tokens after setting', async function () {
    const expiry = new Date('2026-12-31T23:59:59Z');
    await setGmailTokens({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      expiry,
    });

    const result = await getGmailTokens();
    expect(result).not.toBeNull();
    expect(result!.accessToken).toBe('test-access');
    expect(result!.refreshToken).toBe('test-refresh');
  });

  it('should return null if any token is missing', async function () {
    const {getSetting} = await import('../../src/queries/get-setting');
    const {setSetting} = await import('../../src/commands/set-setting');

    await setSetting('gmail_access_token', 'partial-token');

    const result = await getGmailTokens();
    expect(result).toBeNull();
  });
});
