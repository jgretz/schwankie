import type {ActionArgs} from '@remix-run/node';
import {redirect} from '@remix-run/node';
import {ROUTES} from '~/constants';
import {authenticator} from '~/services/auth.server';

export function loader() {
  return redirect(ROUTES.LOGIN);
}

export let action = ({request}: ActionArgs) => {
  return authenticator.authenticate('google', request);
};
