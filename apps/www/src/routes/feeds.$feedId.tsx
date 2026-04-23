import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useState, useCallback, useEffect, useMemo, useRef} from 'react';
import {z} from 'zod';
import {Button} from '@www/components/ui/button';
import {RssItemRow} from '@www/components/feed/rss-item-row';
import {FeedForm} from '@www/components/feed/feed-form';
import {useRssItems} from '@www/hooks/use-rss-items';
import {useFeeds} from '@www/hooks/use-feeds';

const searchSchema = z.object({
  unread: z.enum(['true', 'false']).optional().catch('true').transform((v) => v === 'true'),
});

export const Route = createFileRoute('/feeds/$feedId')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/auth/login', search: {error: undefined}});
    }
  },
  validateSearch: searchSchema,
  head: ({params}) => ({
    meta: [
      {title: `Feed ${params.feedId} — schwankie`},
      {name: 'description', content: 'RSS feed items.'},
    ],
  }),
  component: FeedDetailPage,
});

function FeedDetailPage() {
  const {feedId} = Route.useParams();
  const {unread} = Route.useSearch();
  const navigate = useNavigate({from: Route.fullPath});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  const {query: feedsQuery} = useFeeds();
  const {query: itemsQuery, markReadMutation, promoteMutation} = useRssItems(feedId, unread);

  const feed = feedsQuery.data?.find((f) => f.id === feedId);

  const items = useMemo(
    () => itemsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [itemsQuery.data],
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && itemsQuery.hasNextPage && !itemsQuery.isFetchingNextPage) {
          itemsQuery.fetchNextPage();
        }
      },
      {rootMargin: '200px', threshold: 0},
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [itemsQuery.hasNextPage, itemsQuery.isFetchingNextPage, itemsQuery.fetchNextPage]);

  const handleToggleUnread = useCallback(() => {
    navigate({search: {unread: (!unread).toString()}});
  }, [navigate, unread]);

  const handleMarkRead = useCallback(
    (itemId: string) => async () => {
      await markReadMutation.mutateAsync(itemId);
      setHiddenItems((prev) => new Set([...prev, itemId]));
    },
    [markReadMutation],
  );

  const handlePromote = useCallback(
    (itemId: string) => async () => {
      await promoteMutation.mutateAsync(itemId);
      setHiddenItems((prev) => new Set([...prev, itemId]));
    },
    [promoteMutation],
  );

  const handleRemoveItem = useCallback((itemId: string) => {
    setHiddenItems((prev) => new Set([...prev, itemId]));
  }, []);

  if (feedsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-muted">Loading feed...</p>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-text-muted">Feed not found</p>
        <Button onClick={() => navigate({to: '/feeds'})}>Back to feeds</Button>
      </div>
    );
  }

  const visibleItems = items.filter((item) => !hiddenItems.has(item.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="font-serif text-3xl text-text mb-1">{feed.name}</h1>
          <p className="text-text-muted font-sans text-[0.9rem]">{feed.sourceUrl}</p>
        </div>
        <Button variant="outline" onClick={() => setIsFormOpen(true)}>
          Edit
        </Button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleToggleUnread}
          className={`px-3 py-1 rounded-full font-sans text-[0.85rem] transition-colors ${
            unread
              ? 'bg-accent text-accent-foreground'
              : 'bg-bg-subtle text-text-muted hover:bg-border'
          }`}
        >
          {unread ? 'Unread' : 'All'}
        </button>
      </div>

      {itemsQuery.isLoading ? (
        <div className="text-center py-12">
          <p className="text-text-muted">Loading items...</p>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted font-sans">
            {unread ? 'No unread items.' : 'No items.'}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {visibleItems.map((item) => (
            <RssItemRow
              key={item.id}
              item={item}
              onMarkRead={handleMarkRead(item.id)}
              onPromote={handlePromote(item.id)}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {itemsQuery.isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      )}

      <FeedForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        feed={feed}
        onSuccess={() => feedsQuery.refetch()}
      />
    </div>
  );
}
