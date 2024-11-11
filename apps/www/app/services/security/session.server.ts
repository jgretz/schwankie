import {createCookieSessionStorage} from '@remix-run/node';
import {serverEnv} from '@www/utils/env';

// export the whole sessionStorage object
export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '_schwankie', // use any name you want here
    sameSite: 'lax', // this helps with CSRF
    path: '/', // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    secrets: [serverEnv.COOKIE_SECRET || ''], // replace this with an actual secret
    secure: serverEnv.NODE_ENV === 'production', // enable this in prod only
  },
});

// you can also export the methods individually for your own usage
export let {getSession, commitSession, destroySession} = sessionStorage;
