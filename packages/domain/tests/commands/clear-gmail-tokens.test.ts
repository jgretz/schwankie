import {beforeEach, describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {setGmailTokens} from '../../src/commands/set-gmail-tokens';
import {getGmailTokens} from '../../src/queries/get-gmail-tokens';
import {clearGmailTokens} from '../../src/commands/clear-gmail-tokens';

describe('clearGmailTokens', function () {
  setupDb();

  beforeEach(function () {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.from(
      new Uint8Array(32).fill(0),
    ).toString('base64');
  });

  it('should clear all gmail tokens', async function () {
    const expiry = new Date('2026-12-31T23:59:59Z');
    await setGmailTokens({
      accessToken: 'access123',
      refreshToken: 'refresh123',
      expiry,
    });

    let tokens = await getGmailTokens();
    expect(tokens).not.toBeNull();

    await clearGmailTokens();

    tokens = await getGmailTokens();
    expect(tokens).toBeNull();
  });

  it('should be idempotent when no tokens exist', async function () {
    let tokens = await getGmailTokens();
    expect(tokens).toBeNull();

    await clearGmailTokens();

    tokens = await getGmailTokens();
    expect(tokens).toBeNull();
  });
});
