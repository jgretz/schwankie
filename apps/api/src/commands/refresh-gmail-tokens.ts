import {getGmailTokens, setGmailTokens, clearGmailTokens, type GmailTokens} from '@domain';
import {refreshGmailTokensWithGoogle, GmailTokenRevokedError} from '../lib/gmail-oauth';

const EXPIRY_SKEW_SECONDS = 60;

export async function refreshGmailTokens(): Promise<GmailTokens | null> {
  const tokens = await getGmailTokens();

  if (!tokens || !tokens.refreshToken) {
    return null;
  }

  const now = new Date();
  const expiryWithSkew = new Date(
    tokens.expiry.getTime() - EXPIRY_SKEW_SECONDS * 1000,
  );

  if (expiryWithSkew > now) {
    return tokens;
  }

  try {
    const refreshed = await refreshGmailTokensWithGoogle(tokens.refreshToken);
    await setGmailTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
      expiry: refreshed.expiryDate,
    });

    return {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
      expiry: refreshed.expiryDate,
    };
  } catch (error) {
    if (error instanceof GmailTokenRevokedError) {
      await clearGmailTokens();
      throw error;
    }
    throw error;
  }
}
