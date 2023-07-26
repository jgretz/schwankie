import {authenticator} from '../auth.server';

export async function requireUser(request: Request) {
  return await authenticator.authenticate('google', request);
}
