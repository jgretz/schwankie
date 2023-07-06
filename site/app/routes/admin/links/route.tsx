import type {LoaderArgs} from '@remix-run/node';
import {authenticator} from '~/services/auth.server';

export async function loader({request}: LoaderArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: '/admin/login',
  });

  return [];
}

export default function Links() {
  return <div>Links Form</div>;
}
