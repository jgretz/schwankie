import type {Theme} from '@www/types';
import * as cookie from 'cookie';

const cookieName = 'en_theme';

export function getTheme(request: Request): Theme {
  const def = 'light';

  const cookieHeader = request.headers.get('cookie');
  const parsed = cookieHeader ? cookie.parse(cookieHeader)[cookieName] : def;

  return (parsed as Theme) || def;
}

export function setTheme(theme: Theme) {
  return cookie.serialize(cookieName, theme, {path: '/', maxAge: 31536000});
}
