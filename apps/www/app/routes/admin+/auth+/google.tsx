import type {ActionFunctionArgs} from '@remix-run/node';
import {redirect} from '@remix-run/node';
import {authenticator} from '@www/services/security/auth.server';
import {ADMIN_ROUTES} from '../constants';

export function loader() {
  return redirect(ADMIN_ROUTES.LOGIN);
}

export let action = ({request}: ActionFunctionArgs) => {
  return authenticator.authenticate('google', request);
};
