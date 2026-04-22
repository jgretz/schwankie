import {setSetting} from './set-setting';
import {encryptToken, loadKey} from '../lib/crypto';

export async function setGmailTokens(input: {
  accessToken: string;
  refreshToken: string;
  expiry: Date;
}): Promise<void> {
  const key = loadKey();

  const encryptedAccessToken = encryptToken(input.accessToken, key);
  const encryptedRefreshToken = encryptToken(input.refreshToken, key);
  const expiryIso = input.expiry.toISOString();

  await Promise.all([
    setSetting('gmail_access_token', encryptedAccessToken),
    setSetting('gmail_refresh_token', encryptedRefreshToken),
    setSetting('gmail_token_expiry', expiryIso),
  ]);
}
