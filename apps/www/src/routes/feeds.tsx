import {createFileRoute, redirect, Outlet} from '@tanstack/react-router';

export const Route = createFileRoute('/feeds')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/auth/login', search: {error: undefined}});
    }
  },
  head: () => ({
    meta: [
      {title: 'Feeds — schwankie'},
      {name: 'description', content: 'Your RSS feeds.'},
    ],
  }),
  component: FeedsLayout,
});

function FeedsLayout() {
  return <Outlet />;
}
