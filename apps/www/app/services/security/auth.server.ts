import {Authenticator, AuthorizationError} from 'remix-auth';
import {GoogleStrategy} from 'remix-auth-google';
import type {User} from './Types';
import {sessionStorage} from './session.server';
import {serverEnv} from '@www/utils/env';
import type {GOOGLE_STRATEGY} from '@www/constants/routes.constants';

function verifyEmail(email: string) {
  if (email === serverEnv.ALLOWED_EMAIL) {
    return {email} as User;
  }

  throw new AuthorizationError(`Email ${email} is not an admin`);
}

function generateGoogleStrategy(name: GOOGLE_STRATEGY) {
  return new GoogleStrategy(
    {
      clientID: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
      callbackURL: `${serverEnv.GOOGLE_CLIENT_CALLBACK_ROOT}/auth/callback?strategy=${name}`,
    },
    async ({profile}) => {
      return verifyEmail(profile.emails[0].value);
    },
  );
}

export const authenticator = new Authenticator<User>(sessionStorage);
authenticator.use(generateGoogleStrategy('google-admin'), 'google-admin');
authenticator.use(generateGoogleStrategy('google-reader'), 'google-reader');
