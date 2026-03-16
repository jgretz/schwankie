import {createFileRoute} from '@tanstack/react-router';
import {createServerFn} from '@tanstack/react-start';
import {buildGoogleAuthUrl} from '../../lib/auth';

const getGoogleAuthUrl = createServerFn({method: 'GET'}).handler(async () => {
  return buildGoogleAuthUrl();
});

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error as string | undefined,
  }),
  head: () => ({
    meta: [{title: 'Sign in — schwankie'}],
  }),
  loader: async () => {
    const authUrl = await getGoogleAuthUrl();
    return {authUrl};
  },
  component: LoginPage,
});

function LoginPage() {
  const {authUrl} = Route.useLoaderData();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="font-serif text-3xl text-text">schwankie</h1>
        <p className="text-text-muted">Sign in to manage your links.</p>
        <a
          href={authUrl}
          className="inline-block rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
