import {QueryCache, QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {HeadContent, Outlet, Scripts, createRootRoute} from '@tanstack/react-router';
import {createServerFn} from '@tanstack/react-start';
import {lazy, Suspense, useState} from 'react';
import {toast} from 'sonner';
import {Toaster} from '@www/components/ui/toaster';
import {LinkModalProvider, useLinkModal} from '@www/components/modal/link-modal-context';
import {AppShell} from '@www/components/shell/app-shell';
import {useFeedFilters} from '@www/hooks/use-feed-filters';
import '../globals.css';
import {getAuthState} from '../lib/session-actions';

const LinkModal = lazy(() =>
  import('@www/components/modal/link-modal').then((m) => ({default: m.LinkModal})),
);

export const logout = createServerFn({method: 'POST'}).handler(async () => {
  const {destroySession} = await import('../lib/session.server');
  await destroySession();
  throw new Response(null, {status: 302, headers: {Location: '/'}});
});

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  beforeLoad: async () => {
    const auth = await getAuthState();
    return {auth};
  },
  head: () => ({
    meta: [{charSet: 'utf-8'}, {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
    links: [
      {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
      },
      {rel: 'icon', type: 'image/png', href: '/favicon.png'},
    ],
  }),
  component: RootComponent,
});

function NotFound() {
  return (
    <div className="mx-auto max-w-[1200px] px-8 py-16">
      <h1 className="font-serif text-4xl text-text">404</h1>
    </div>
  );
}

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            toast.error(error.message || 'Something went wrong');
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('schwankie-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')})()`,
          }}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <LinkModalProvider>
            <ShellWithData />
            <Suspense fallback={null}>
              <LinkModal />
            </Suspense>
          </LinkModalProvider>
        </QueryClientProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

function ShellWithData() {
  const {openAdd} = useLinkModal();
  const {auth} = Route.useRouteContext();
  const {tags, selectedTags, searchValue, onSearchChange, onTagToggle, currentSection} =
    useFeedFilters();

  return (
    <AppShell
      currentSection={currentSection}
      tags={tags}
      selectedTags={selectedTags}
      onTagToggle={onTagToggle}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      isAuthenticated={auth.authenticated}
      onAddClick={openAdd}
    >
      <Outlet />
    </AppShell>
  );
}
