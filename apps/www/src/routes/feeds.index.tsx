import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@www/components/ui/button';
import {FeedForm} from '@www/components/feed/feed-form';
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {query, deleteMutation, updateMutation} = useFeeds();

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

  async function handleDelete(feedId: string) {
    if (!confirm('Delete this feed?')) return;

    try {
      await deleteMutation.mutateAsync(feedId);
      toast.success('Feed deleted');
    } catch (error) {
      console.error('Failed to delete feed:', error);
      toast.error('Failed to delete feed');
    }
  }

  async function handleToggleDisable(feedId: string, currentDisabled: boolean) {
    try {
      await updateMutation.mutateAsync({id: feedId, disabled: !currentDisabled});
      toast.success(currentDisabled ? 'Feed enabled' : 'Feed disabled');
    } catch (error) {
      console.error('Failed to update feed:', error);
      toast.error('Failed to update feed');
    }
  }

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
          <Button onClick={() => setIsFormOpen(true)}>Add Feed</Button>
        </div>
      </div>

      {feeds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted font-sans">No feeds yet. Add one to get started.</p>
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
                  {feed.errorCount > 0 && (
                    <p className="text-destructive font-sans text-[0.85rem] mt-1">
                      {feed.errorCount} recent error{feed.errorCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleDisable(feed.id, feed.disabled ?? false)}
                    className="text-[0.8rem]"
                  >
                    {feed.disabled ? 'Enable' : 'Disable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(feed.id)}
                    className="text-[0.8rem]"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FeedForm open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={() => query.refetch()} />
    </div>
  );
}
