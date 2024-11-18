export type GOOGLE_STRATEGY = 'google-admin' | 'google-reader';

export const ROUTES = {
  AUTH: '/auth/google',
  LOGIN: '/auth/login',
  LINKS: '/',
  ADMIN: '/admin/',
  READER: '/reader/',
};

export const ROUTE_FOR_STRATEGY: Record<GOOGLE_STRATEGY, string> = {
  ['google-admin']: ROUTES.ADMIN,
  ['google-reader']: ROUTES.READER,
};
