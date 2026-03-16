import {getEnv} from './env';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const SCOPES = 'openid email profile';

type GoogleTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
};

type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

export function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: getEnv().GOOGLE_CLIENT_ID,
    redirect_uri: getEnv().GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      code,
      client_id: getEnv().GOOGLE_CLIENT_ID,
      client_secret: getEnv().GOOGLE_CLIENT_SECRET,
      redirect_uri: getEnv().GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token exchange failed (${String(response.status)}): ${body}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {Authorization: `Bearer ${accessToken}`},
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google userinfo fetch failed (${String(response.status)}): ${body}`);
  }

  return response.json() as Promise<GoogleUserInfo>;
}

export function isAllowedEmail(email: string): boolean {
  return email.toLowerCase() === getEnv().ALLOWED_EMAIL.toLowerCase();
}
