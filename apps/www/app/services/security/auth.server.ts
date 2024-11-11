// app/services/auth.server.ts
import {Authenticator, AuthorizationError} from 'remix-auth';
import {GoogleStrategy} from 'remix-auth-google';
import type {User} from './Types';
import {sessionStorage} from './session.server';
import {serverEnv} from '@www/utils/env';

let googleStrategy = new GoogleStrategy(
  {
    clientID: serverEnv.GOOGLE_CLIENT_ID || '',
    clientSecret: serverEnv.GOOGLE_CLIENT_SECRET || '',
    callbackURL: `${serverEnv.GOOGLE_CLIENT_CALLBACK_ROOT}/admin/auth/callback`,
  },
  async ({profile}) => {
    const email = profile.emails[0].value;
    if (email === serverEnv.ALLOWED_EMAIL) {
      return {email} as User;
    }

    throw new AuthorizationError(`Email ${email} is not an admin`);
  },
);

export let authenticator = new Authenticator<User>(sessionStorage);
authenticator.use(googleStrategy);
