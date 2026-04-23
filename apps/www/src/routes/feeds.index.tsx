import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@www/components/ui/button';
import {useFeeds} from '@www/hooks/use-feeds';

import {triggerRefreshAllFeedsAction} from '@www/lib/work-request-actions';

export const Route = createFileRoute('/feeds/')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/'});
    }
  },
  head: () => ({
    meta: [
      {title: 'Feeds — schwankie'},
      {name: 'description', content: 'Your RSS feeds.'},
    ],
  }),
  component: FeedsPage,
});

function FeedsPage() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {query} = useFeeds();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerRefreshAllFeedsAction();
      toast.success('Feeds refresh queued');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to queue refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading feeds...</p>
      </div>
    );
  }

  const feeds = query.data ?? [];
  const sortedFeeds = [...feeds].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-text mb-1">Feeds</h1>
          <p className="text-text-muted font-sans text-[0.9rem]">{feeds.length} feed{feeds.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => navigate({to: '/admin/feeds'})}>Manage feeds →</Button>
        </div>
      </div>

      {feeds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted font-sans mb-4">No feeds yet.</p>
          <Button onClick={() => navigate({to: '/admin/feeds'})}>Add a feed</Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {sortedFeeds.map((feed) => (
            <div key={feed.id} className="border-b border-border last:border-b-0 p-4 hover:bg-bg-subtle transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate({to: '/feeds/$feedId', params: {feedId: feed.id}})}
                    className="font-serif text-lg text-accent hover:text-accent-hover transition-colors block text-left bg-transparent border-none cursor-pointer p-0"
                  >
                    {feed.name}
                  </button>
                  <p className="text-text-muted font-sans text-[0.85rem] mt-1 truncate">{feed.sourceUrl}</p>
                  {feed.disabled && <p className="text-text-muted font-sans text-[0.85rem] mt-1">Disabled</p>}
                  {feed.errorCount > 0 && (
                    <p className="text-destructive font-sans text-[0.85rem] mt-1">
                      {feed.errorCount} recent error{feed.errorCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
