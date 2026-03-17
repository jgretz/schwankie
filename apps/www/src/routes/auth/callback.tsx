import {createFileRoute, redirect} from '@tanstack/react-router';
import {createServerFn} from '@tanstack/react-start';

const processOAuthCode = createServerFn({method: 'POST'})
  .inputValidator((code: string) => code)
  .handler(async ({data: code}) => {
    try {
      const {exchangeCodeForTokens, fetchGoogleUserInfo, isAllowedEmail} = await import(
        '../../lib/auth.server'
      );
      const {createSession} = await import('../../lib/session.server');

      const tokens = await exchangeCodeForTokens(code);
      const userInfo = await fetchGoogleUserInfo(tokens.access_token);

      if (!isAllowedEmail(userInfo.email)) {
        return {error: 'unauthorized_email'};
      }

      await createSession(userInfo.email);
      return {error: null};
    } catch {
      return {error: 'auth_failed'};
    }
  });

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: search.code as string | undefined,
    error: search.error as string | undefined,
  }),
  loaderDeps: ({search}) => ({code: search.code, error: search.error}),
  loader: async ({deps}) => {
    if (deps.error) {
      throw redirect({to: '/auth/login', search: {error: 'access_denied'}});
    }

    if (!deps.code) {
      throw redirect({to: '/auth/login', search: {error: 'missing_code'}});
    }

    const result = await processOAuthCode({data: deps.code});

    if (result.error) {
      throw redirect({to: '/auth/login', search: {error: result.error}});
    }

    throw redirect({to: '/'});
  },
  component: CallbackPage,
});

function CallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-text-muted">Authenticating...</p>
    </div>
  );
}
