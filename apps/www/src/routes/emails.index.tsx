import {createFileRoute, redirect} from '@tanstack/react-router';
import {useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@www/components/ui/button';

import {triggerRefreshEmailsAction} from '@www/lib/work-request-actions';

export const Route = createFileRoute('/emails/')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/'});
    }
  },
  head: () => ({
    meta: [
      {title: 'Emails — schwankie'},
      {name: 'description', content: 'Email messages — your second memory.'},
    ],
  }),
  component: EmailsPage,
});

function EmailsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerRefreshEmailsAction();
      toast.success('Emails refresh queued');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to queue refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-text">Emails</h1>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      <p className="text-text-muted">Email management coming soon</p>
    </div>
  );
}
