import {createServerFn} from '@tanstack/react-start';
import {getCookie, setCookie} from '@tanstack/react-start/server';
import {env} from './env';

const SESSION_COOKIE = 'schwankie_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type SessionData = {
  email: string;
  authenticated: boolean;
};

type SessionPayload = {
  data: SessionData;
  expires: number;
  sig: string;
};

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SESSION_SECRET),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verify(value: string, signature: string): Promise<boolean> {
  const expected = await sign(value);
  return expected === signature;
}

export async function createSession(email: string): Promise<void> {
  const data: SessionData = {email, authenticated: true};
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = JSON.stringify({data, expires});
  const sig = await sign(payload);
  const cookie: SessionPayload = {data, expires, sig};

  setCookie(SESSION_COOKIE, btoa(JSON.stringify(cookie)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionData | null> {
  const raw = getCookie(SESSION_COOKIE);
  if (!raw) return null;

  try {
    const cookie: SessionPayload = JSON.parse(atob(raw));
    if (Date.now() > cookie.expires) return null;

    const payload = JSON.stringify({data: cookie.data, expires: cookie.expires});
    const valid = await verify(payload, cookie.sig);
    if (!valid) return null;

    return cookie.data;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  setCookie(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export const getAuthState = createServerFn({method: 'GET'}).handler(async () => {
  const session = await getSession();
  if (!session?.authenticated) {
    return {authenticated: false as const};
  }
  return {authenticated: true as const, email: session.email};
});
