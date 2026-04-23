import {createFileRoute, redirect} from '@tanstack/react-router';

export const Route = createFileRoute('/email/')({
  beforeLoad: () => {
    throw redirect({to: '/emails'});
  },
  component: () => null,
});
