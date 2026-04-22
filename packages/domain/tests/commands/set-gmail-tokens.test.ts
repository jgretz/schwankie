import {beforeEach, describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {setGmailTokens} from '../../src/commands/set-gmail-tokens';
import {getGmailTokens} from '../../src/queries/get-gmail-tokens';

describe('setGmailTokens', function () {
  setupDb();

  beforeEach(function () {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.from(
      new Uint8Array(32).fill(0),
    ).toString('base64');
  });

  it('should set and retrieve gmail tokens', async function () {
    const expiry = new Date('2026-12-31T23:59:59Z');
    await setGmailTokens({
      accessToken: 'access123',
      refreshToken: 'refresh123',
      expiry,
    });

    const tokens = await getGmailTokens();
    expect(tokens).not.toBeNull();
    expect(tokens!.accessToken).toBe('access123');
    expect(tokens!.refreshToken).toBe('refresh123');
    expect(tokens!.expiry.toISOString()).toBe(expiry.toISOString());
  });

  it('should overwrite existing tokens', async function () {
    const expiry1 = new Date('2026-12-31T23:59:59Z');
    await setGmailTokens({
      accessToken: 'access1',
      refreshToken: 'refresh1',
      expiry: expiry1,
    });

    const expiry2 = new Date('2027-12-31T23:59:59Z');
    await setGmailTokens({
      accessToken: 'access2',
      refreshToken: 'refresh2',
      expiry: expiry2,
    });

    const tokens = await getGmailTokens();
    expect(tokens!.accessToken).toBe('access2');
    expect(tokens!.refreshToken).toBe('refresh2');
    expect(tokens!.expiry.toISOString()).toBe(expiry2.toISOString());
  });

  it('should throw when TOKEN_ENCRYPTION_KEY is missing', async function () {
    delete process.env.TOKEN_ENCRYPTION_KEY;

    expect(async () => {
      await setGmailTokens({
        accessToken: 'access',
        refreshToken: 'refresh',
        expiry: new Date(),
      });
    }).toThrow();
  });
});
