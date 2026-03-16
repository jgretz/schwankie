import {createFileRoute, redirect} from '@tanstack/react-router';
import {exchangeCodeForTokens, fetchGoogleUserInfo, isAllowedEmail} from '../../lib/auth';
import {createSession} from '../../lib/session';

async function processOAuthCode(code: string): Promise<{error: string | null}> {
  'use server';

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await fetchGoogleUserInfo(tokens.access_token);

    if (!isAllowedEmail(userInfo.email)) {
      return {error: 'unauthorized_email'};
    }

    await createSession(userInfo.email);
    return {error: null};
  } catch (err) {
    console.error('OAuth callback error:', err);
    return {error: 'auth_failed'};
  }
}

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

    const result = await processOAuthCode(deps.code);

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
