import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useMemo, useState, useCallback} from 'react';
import {z} from 'zod';
import {toast} from 'sonner';
import type {RssItemWithFeedData} from 'client';
import {Button} from '@www/components/ui/button';
import {RssItemRow} from '@www/components/feed/rss-item-row';
import {useAllRssItems} from '@www/hooks/use-all-rss-items';
import {useFeeds} from '@www/hooks/use-feeds';
import {triggerRefreshAllFeedsAction} from '@www/lib/work-request-actions';

const searchSchema = z.object({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .catch('true')
    .transform((v) => v !== 'false'),
  feedId: z.string().optional(),
  group: z
    .enum(['true', 'false'])
    .optional()
    .catch('false')
    .transform((v) => v === 'true'),
});

type RssSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/feeds/')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/auth/login', search: {error: undefined}});
    }
  },
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {title: 'RSS — schwankie'},
      {name: 'description', content: 'Your RSS items.'},
    ],
  }),
  component: RssPage,
});

function RssPage() {
  const search = Route.useSearch() as RssSearch;
  const navigate = useNavigate({from: '/feeds/'});
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {query: feedsQuery} = useFeeds();
  const {query, markReadMutation, promoteMutation, markAllReadMutation} = useAllRssItems({
    unread: search.unread,
    feedId: search.feedId,
  });

  const items = query.data?.items ?? [];
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenItems.has(item.id)),
    [items, hiddenItems],
  );

  const grouped = useMemo(() => {
    const groups: Record<string, {feedName: string; items: RssItemWithFeedData[]}> = {};
    for (const item of visibleItems) {
      if (!groups[item.feedId]) {
        groups[item.feedId] = {feedName: item.feedName, items: []};
      }
      groups[item.feedId]!.items.push(item);
    }
    return Object.entries(groups).sort((a, b) => a[1].feedName.localeCompare(b[1].feedName));
  }, [visibleItems]);

  const feedOptions = useMemo(() => {
    const feeds = feedsQuery.data ?? [];
    return [...feeds]
      .filter((f) => !f.disabled)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [feedsQuery.data]);

  const toSearch = useCallback(
    (next: Partial<{unread: boolean; feedId: string | undefined; group: boolean}>) => ({
      unread: (next.unread ?? search.unread) ? 'true' : 'false',
      feedId: next.feedId !== undefined ? next.feedId : search.feedId,
      group: (next.group ?? search.group) ? 'true' : 'false',
    }),
    [search.unread, search.feedId, search.group],
  );

  const handleToggleUnread = useCallback(() => {
    navigate({search: toSearch({unread: !search.unread})});
  }, [navigate, toSearch, search.unread]);

  const handleToggleGroup = useCallback(() => {
    navigate({search: toSearch({group: !search.group})});
  }, [navigate, toSearch, search.group]);

  const handleFeedFilter = useCallback(
    (feedId: string) => {
      navigate({search: toSearch({feedId: feedId || undefined})});
    },
    [navigate, toSearch],
  );

  const handleMarkRead = useCallback(
    (feedId: string, itemId: string) => async () => {
      await markReadMutation.mutateAsync({feedId, itemId});
      setHiddenItems((prev) => new Set([...prev, itemId]));
    },
    [markReadMutation],
  );

  const handlePromote = useCallback(
    (feedId: string, itemId: string) => async () => {
      await promoteMutation.mutateAsync({feedId, itemId});
      setHiddenItems((prev) => new Set([...prev, itemId]));
    },
    [promoteMutation],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      const result = await markAllReadMutation.mutateAsync(search.feedId);
      toast.success(`Marked ${result.count} as read`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark all read');
    }
  }, [markAllReadMutation, search.feedId]);

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

  const showGrouped = search.group && !search.feedId;

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-text mb-1">RSS</h1>
          <p className="text-text-muted font-sans text-[0.9rem]">
            {visibleItems.length} {search.unread ? 'unread' : ''} item
            {visibleItems.length !== 1 ? 's' : ''}
            {feedOptions.length > 0 && ` across ${feedOptions.length} feeds`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllReadMutation.isPending}>
            {markAllReadMutation.isPending ? 'Marking…' : 'Mark all read'}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggleUnread}
          className={`px-3 py-1 rounded-full font-sans text-[0.85rem] transition-colors ${
            search.unread
              ? 'bg-accent text-accent-foreground'
              : 'bg-bg-subtle text-text hover:bg-border'
          }`}
        >
          {search.unread ? 'Unread' : 'All'}
        </button>

        <button
          type="button"
          onClick={handleToggleGroup}
          disabled={Boolean(search.feedId)}
          className={`px-3 py-1 rounded-full font-sans text-[0.85rem] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            search.group && !search.feedId
              ? 'bg-accent text-accent-foreground'
              : 'bg-bg-subtle text-text hover:bg-border'
          }`}
        >
          Group by source
        </button>

        {feedOptions.length > 1 && (
          <select
            value={search.feedId ?? ''}
            onChange={(e) => handleFeedFilter(e.target.value)}
            className="rounded-md border border-border bg-bg px-3 py-1 font-sans text-[0.85rem] text-text"
          >
            <option value="">All sources</option>
            {feedOptions.map((feed) => (
              <option key={feed.id} value={feed.id}>
                {feed.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {query.isLoading ? (
        <div className="text-center py-12 text-text-muted">Loading items…</div>
      ) : query.isError ? (
        <div className="text-center py-12 text-destructive">Failed to load items.</div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted font-sans">
            {search.unread ? 'No unread items.' : 'No items.'}
          </p>
        </div>
      ) : showGrouped ? (
        <div className="space-y-6">
          {grouped.map(([feedId, {feedName, items: groupItems}]) => (
            <section key={feedId}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="font-serif text-lg text-text">{feedName}</h2>
                <span className="font-sans text-[0.8rem] text-text-faint">
                  {groupItems.length} item{groupItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                {groupItems.map((item) => (
                  <RssItemRow
                    key={item.id}
                    item={item}
                    onMarkRead={handleMarkRead(item.feedId, item.id)}
                    onPromote={handlePromote(item.feedId, item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {visibleItems.map((item) => (
            <RssItemRow
              key={item.id}
              item={item}
              sourceLabel={item.feedName}
              onMarkRead={handleMarkRead(item.feedId, item.id)}
              onPromote={handlePromote(item.feedId, item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
