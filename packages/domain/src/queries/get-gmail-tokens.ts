import {getSetting} from './get-setting';
import {decryptToken, loadKey} from '../lib/crypto';
import type {GmailTokens} from '../types';

export async function getGmailTokens(): Promise<GmailTokens | null> {
  const accessTokenEncrypted = await getSetting('gmail_access_token');
  const refreshTokenEncrypted = await getSetting('gmail_refresh_token');
  const expiryIso = await getSetting('gmail_token_expiry');

  if (!accessTokenEncrypted || !refreshTokenEncrypted || !expiryIso) {
    return null;
  }

  const key = loadKey();
  const accessToken = decryptToken(accessTokenEncrypted, key);
  const refreshToken = decryptToken(refreshTokenEncrypted, key);

  return {
    accessToken,
    refreshToken,
    expiry: new Date(expiryIso),
  };
}
