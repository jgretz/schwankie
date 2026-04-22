import {createFileRoute, redirect} from '@tanstack/react-router';
import {useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@www/components/ui/button';
import {FeedForm} from '@www/components/feed/feed-form';
import {useFeeds} from '@www/hooks/use-feeds';

export const Route = createFileRoute('/feeds')({
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const {query, deleteMutation} = useFeeds();

  async function handleDelete(feedId: string) {
    if (!confirm('Delete this feed?')) return;

    try {
      await deleteMutation.mutateAsync(feedId);
      toast.success('Feed deleted');
    } catch (error) {
      toast.error('Failed to delete feed');
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
        <Button onClick={() => setIsFormOpen(true)}>Add Feed</Button>
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
                  <a
                    href={`/feeds/${feed.id}`}
                    className="font-serif text-lg text-accent hover:text-accent-hover transition-colors block"
                  >
                    {feed.name}
                  </a>
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
