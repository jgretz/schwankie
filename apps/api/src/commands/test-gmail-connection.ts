import {google} from 'googleapis';
import {parseEnv} from 'env';
import {z} from 'zod';
import {refreshGmailTokens} from './refresh-gmail-tokens';
import {GmailTokenRevokedError} from '../lib/gmail-oauth';

const env = parseEnv(z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
}));

export type TestGmailConnectionResult =
  | {ok: true; email: string; expiry: string}
  | {ok: false; reason: 'not_connected' | 'token_revoked' | 'api_error'; message: string};

export async function testGmailConnection(): Promise<TestGmailConnectionResult> {
  let tokens;
  try {
    tokens = await refreshGmailTokens();
  } catch (error) {
    if (error instanceof GmailTokenRevokedError) {
      return {
        ok: false,
        reason: 'token_revoked',
        message: 'Refresh token revoked — reconnect Gmail',
      };
    }
    const message = error instanceof Error ? error.message : 'Failed to refresh tokens';
    return {ok: false, reason: 'api_error', message};
  }

  if (!tokens) {
    return {ok: false, reason: 'not_connected', message: 'Gmail is not connected'};
  }

  const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  try {
    const gmail = google.gmail({version: 'v1', auth});
    const profile = await gmail.users.getProfile({userId: 'me'});
    const email = profile.data.emailAddress || '';

    return {ok: true, email, expiry: tokens.expiry.toISOString()};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {ok: false, reason: 'api_error', message};
  }
}
