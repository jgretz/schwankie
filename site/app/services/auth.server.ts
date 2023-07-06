// app/services/auth.server.ts
import {Authenticator, AuthorizationError} from 'remix-auth';
import {GoogleStrategy} from 'remix-auth-google';
import type {User} from '~/Types';
import {sessionStorage} from '~/services/session.server';

let googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: `${process.env.GOOGLE_CLIENT_CALLBACK_ROOT}/admin/auth/callback`,
  },
  async ({accessToken, refreshToken, extraParams, profile}) => {
    const email = profile.emails[0].value;

    if (email === process.env.ALLOWED_EMAIL) {
      return {email} as User;
    }

    throw new AuthorizationError(`Email ${email} is not an admin`);
  },
);

export let authenticator = new Authenticator<User>(sessionStorage);
authenticator.use(googleStrategy);
