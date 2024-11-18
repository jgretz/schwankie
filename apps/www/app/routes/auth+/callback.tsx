import type {LoaderFunctionArgs} from '@remix-run/node';
import {ROUTE_FOR_STRATEGY, ROUTES, type GOOGLE_STRATEGY} from '@www/constants/routes.constants';
import {authenticator} from '@www/services/security/auth.server';

export function loader({request}: LoaderFunctionArgs) {
  const {searchParams} = new URL(request.url);
  const strategy = searchParams.get('strategy') as GOOGLE_STRATEGY;
  const successRedirect = ROUTE_FOR_STRATEGY[strategy] ?? ROUTES.LINKS;

  return authenticator.authenticate(strategy, request, {
    successRedirect: successRedirect,
    failureRedirect: ROUTES.LOGIN,
  });
}
