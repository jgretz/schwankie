import {google} from 'googleapis';
import {parseEnv} from 'env';
import {z} from 'zod';

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
});

const env = parseEnv(envSchema);

export class GmailTokenRevokedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailTokenRevokedError';
  }
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

export function buildGmailAuthUrl(): string {
  const auth = getOAuth2Client();
  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/gmail.modify',
    prompt: 'consent',
  });
}

export interface ExchangeCodeResult {
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  email: string;
}

export async function exchangeGmailCodeWithGoogle(
  code: string,
): Promise<ExchangeCodeResult> {
  const auth = getOAuth2Client();

  try {
    const {tokens} = await auth.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token returned from Google');
    }

    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    auth.setCredentials(tokens);

    const gmail = google.gmail({version: 'v1', auth});
    const profile = await gmail.users.getProfile({userId: 'me'});
    const email = profile.data.emailAddress || '';

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiryDate,
      email,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      throw new GmailTokenRevokedError('Token exchange failed: invalid_grant');
    }
    throw error;
  }
}

export interface RefreshTokenResult {
  accessToken: string;
  expiryDate: Date;
  refreshToken?: string;
}

export async function refreshGmailTokensWithGoogle(
  refreshToken: string,
): Promise<RefreshTokenResult> {
  const auth = getOAuth2Client();
  auth.setCredentials({refresh_token: refreshToken});

  try {
    const {credentials} = await auth.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('No access token returned from refresh');
    }

    const expiryDate = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    return {
      accessToken: credentials.access_token,
      expiryDate,
      refreshToken: credentials.refresh_token || undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      throw new GmailTokenRevokedError('Token refresh failed: invalid_grant');
    }
    throw error;
  }
}
