import type {LoaderArgs} from '@remix-run/node';
import {authenticator} from '~/services/auth.server';
import {ROUTES} from '~/constants/routes';

export function loader({request}: LoaderArgs) {
  return authenticator.authenticate('google', request, {
    successRedirect: ROUTES.LINKS,
    failureRedirect: ROUTES.LOGIN,
  });
}
