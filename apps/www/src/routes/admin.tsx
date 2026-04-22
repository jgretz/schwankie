import {createFileRoute, redirect, Outlet, Link} from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/'});
    }
  },
  head: () => ({
    meta: [{title: 'Admin — schwankie'}],
  }),
  component: AdminLayout,
});

const navItems = [
  {to: '/admin', label: 'General', exact: true},
  {to: '/admin/dead-links', label: 'Dead Links', exact: true},
  {to: '/admin/tags', label: 'Tags', exact: true},
  {to: '/admin/gmail', label: 'Gmail', exact: true},
] as const;

function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[180px] shrink-0 border-r border-border p-4 md:block">
        <nav className="space-y-1">
          {navItems.map(({to, label, exact}) => (
            <Link
              key={to}
              to={to}
              activeOptions={{exact}}
              className="block rounded-md px-3 py-2 font-sans text-[0.85rem] text-text-muted transition-colors hover:bg-bg-subtle hover:text-text"
              activeProps={{className: '!bg-bg-subtle !text-accent font-medium'}}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
