import {Outlet} from '@remix-run/react';
import {redirect, type LoaderArgs} from '@remix-run/node';

import {Navbar} from './_components/navbar';

import {authenticator} from '~/services/auth.server';
import {ROUTES} from '~/constants';

export async function loader({request}: LoaderArgs) {
  const user = await authenticator.authenticate('google', request);
  const url = new URL(request.url);

  if (!user && url.pathname !== ROUTES.LOGIN) {
    return redirect(ROUTES.LOGIN);
  }

  if (user && url.pathname !== ROUTES.LINKS) {
    return redirect(ROUTES.LINKS);
  }

  return user;
}

export default function AdminLayout() {
  return (
    <div className="pb-5">
      <Navbar />
      <Outlet />
    </div>
  );
}
