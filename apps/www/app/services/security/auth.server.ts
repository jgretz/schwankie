import {Authenticator, AuthorizationError} from 'remix-auth';
import {GoogleStrategy} from 'remix-auth-google';
import type {User} from './Types';
import {sessionStorage} from './session.server';
import {serverEnv} from '@www/utils/env';
import type {GOOGLE_STRATEGY} from '@www/constants/routes.constants';
import {updateGoogle} from '../misc/updateGoogle.post';

function verifyEmail(email: string) {
  if (email === serverEnv.ALLOWED_EMAIL) {
    return {email} as User;
  }

  throw new AuthorizationError(`Email ${email} is not an admin`);
}

const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify',
];

function generateGoogleStrategy(name: GOOGLE_STRATEGY) {
  return new GoogleStrategy(
    {
      clientID: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
      callbackURL: `${serverEnv.GOOGLE_CLIENT_CALLBACK_ROOT}/auth/callback?strategy=${name}`,
      scope: SCOPES,
      accessType: 'offline',
    },
    async ({profile, accessToken, refreshToken, extraParams}) => {
      const user = verifyEmail(profile.emails[0].value);
      const tokens = JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        ...extraParams,
      });

      await updateGoogle(user.email, tokens);

      return user;
    },
  );
}

export const authenticator = new Authenticator<User>(sessionStorage);
authenticator.use(generateGoogleStrategy('google-admin'), 'google-admin');
authenticator.use(generateGoogleStrategy('google-reader'), 'google-reader');
