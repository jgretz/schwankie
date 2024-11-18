import {type GOOGLE_STRATEGY} from '@www/constants/routes.constants';
import {authenticator} from './auth.server';

export async function requireUser(request: Request, strategy: GOOGLE_STRATEGY) {
  return await authenticator.authenticate(strategy, request);
}
