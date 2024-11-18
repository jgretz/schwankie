import type {ActionFunctionArgs} from '@remix-run/node';
import {redirect} from '@remix-run/node';
import {ROUTES} from '@www/constants/routes.constants';
import {authenticator} from '@www/services/security/auth.server';

export function loader() {
  return redirect(ROUTES.LOGIN);
}

export let action = ({request}: ActionFunctionArgs) => {
  return authenticator.authenticate('google-admin', request);
};
