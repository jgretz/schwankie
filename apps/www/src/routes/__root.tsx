import {HeadContent, Outlet, Scripts, createRootRoute} from '@tanstack/react-router';
import {AppShell} from '@www/components/shell/app-shell';
import '../globals.css';

export const Route = createRootRoute({
  notFoundComponent: NotFound,
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
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell
          tags={[]}
          selectedTagIds={[]}
          onTagToggle={() => {}}
          searchValue=""
          onSearchChange={() => {}}
          showAddButton={false}
          onAddClick={() => {}}
        >
          <Outlet />
        </AppShell>
        <Scripts />
      </body>
    </html>
  );
}
