import {googleQuery} from 'domain/misc';
import {Auth, google} from 'googleapis';
import {parseEnv} from 'utility-env';
import {GMAIL, MailDomainDependencyEnv, USER_ID} from './Types';
import {setDependency} from 'utility-iocdi';

export * from './api';

export async function setupMail() {
  const env = parseEnv(MailDomainDependencyEnv);

  // build gmail client
  const googleCredentials = await googleQuery();
  if (!googleCredentials) {
    throw new Error('Google Access not found');
  }

  const auth = new google.auth.OAuth2({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  });
  auth.setCredentials(googleCredentials.tokens as Auth.Credentials);

  setDependency(GMAIL, google.gmail({version: 'v1', auth}));

  // set user id
  setDependency(USER_ID, googleCredentials.email);
}
