import type {LoaderFunctionArgs} from '@remix-run/node';
import {authenticator} from '@www/services/security/auth.server';
import {ADMIN_ROUTES} from '../constants';

export function loader({request}: LoaderFunctionArgs) {
  return authenticator.authenticate('google', request, {
    successRedirect: ADMIN_ROUTES.LINKS,
    failureRedirect: ADMIN_ROUTES.LOGIN,
  });
}
