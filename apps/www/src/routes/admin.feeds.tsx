import {createFileRoute, redirect} from '@tanstack/react-router';
import {useCallback, useMemo, useState} from 'react';
import {toast} from 'sonner';
import type {FeedData} from 'client';
import {Button} from '@www/components/ui/button';
import {FeedRow} from '@www/components/admin/feed-row';
import {Input} from '@www/components/ui/input';
import {filterFeeds} from '@www/lib/filter-feeds';
import {sortFeedsByUpdatedAt} from '@www/lib/sort-feeds';
import {useFeeds} from '@www/hooks/use-feeds';

export const Route = createFileRoute('/admin/feeds')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/auth/login', search: {error: undefined}});
    }
  },
  head: () => ({
    meta: [{title: 'Feeds — schwankie'}],
  }),
  component: AdminFeedsPage,
});

// Stable identity for the empty case — `query.data ?? []` would allocate a fresh
// array on every render and invalidate the memos below.
const NO_FEEDS: FeedData[] = [];

function AdminFeedsPage() {
  const {query, createMutation, updateMutation, deleteMutation} = useFeeds();
  const feeds = query.data ?? NO_FEEDS;
  const [filter, setFilter] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedName, setNewFeedName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const sorted = useMemo(() => sortFeedsByUpdatedAt(feeds), [feeds]);
  const filtered = useMemo(() => filterFeeds(sorted, filter), [sorted, filter]);

  const createFeed = createMutation.mutateAsync;
  const updateFeed = updateMutation.mutateAsync;
  const deleteFeed = deleteMutation.mutateAsync;

  const handleAddFeed = useCallback(async () => {
    if (!newFeedUrl.trim() || !newFeedName.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    try {
      await createFeed({sourceUrl: newFeedUrl, name: newFeedName});
      toast.success('Feed added');
      setNewFeedUrl('');
      setNewFeedName('');
    } catch (error) {
      console.error('Failed to add feed:', error);
      toast.error('Failed to add feed');
    }
  }, [createFeed, newFeedUrl, newFeedName]);

  const handleRenameFeed = useCallback(
    async (feedId: string, newName: string) => {
      if (!newName.trim()) {
        toast.error('Name is required');
        return;
      }

      try {
        await updateFeed({id: feedId, name: newName});
        toast.success('Feed renamed');
        setEditingId(null);
      } catch (error) {
        console.error('Failed to rename feed:', error);
        toast.error('Failed to rename feed');
      }
    },
    [updateFeed],
  );

  const handleToggleDisable = useCallback(
    async (feedId: string, currentDisabled: boolean) => {
      try {
        await updateFeed({id: feedId, disabled: !currentDisabled});
        toast.success(currentDisabled ? 'Feed enabled' : 'Feed disabled');
      } catch (error) {
        console.error('Failed to update feed:', error);
        toast.error('Failed to update feed');
      }
    },
    [updateFeed],
  );

  const handleDeleteFeed = useCallback(
    async (feedId: string) => {
      if (!confirm('Delete this feed?')) return;

      try {
        await deleteFeed(feedId);
        toast.success('Feed deleted');
      } catch (error) {
        console.error('Failed to delete feed:', error);
        toast.error('Failed to delete feed');
      }
    },
    [deleteFeed],
  );

  const handleStartEdit = useCallback((feedId: string) => setEditingId(feedId), []);
  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  const isRowActionPending = updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Feeds</h2>
        <span className="font-sans text-[0.8rem] text-text-faint">
          {filtered.length !== sorted.length
            ? `${filtered.length} / ${sorted.length}`
            : sorted.length}
        </span>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          <Input
            placeholder="Feed name"
            value={newFeedName}
            onChange={(e) => setNewFeedName(e.target.value)}
            className="max-w-xs"
            disabled={createMutation.isPending}
          />
          <Input
            placeholder="Feed URL"
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            className="max-w-sm"
            disabled={createMutation.isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddFeed();
              }
            }}
          />
          <Button onClick={handleAddFeed} disabled={createMutation.isPending} variant="default">
            {createMutation.isPending ? 'Adding...' : 'Add Feed'}
          </Button>
        </div>

        <Input
          placeholder="Filter feeds…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {query.isLoading && (
        <div className="animate-pulse space-y-4">
          {Array.from({length: 3}, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          ))}
        </div>
      )}

      {query.isError && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-red-600">
          Failed to load feeds.
        </p>
      )}

      {!query.isLoading && !query.isError && feeds.length === 0 && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-text-muted">
          No feeds yet. Add one above to get started.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="w-full">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[34%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[4%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-sans text-[0.8rem] font-semibold text-text-muted">
                  Name
                </th>
                <th className="py-2 px-4 text-left font-sans text-[0.8rem] font-semibold text-text-muted">
                  URL
                </th>
                <th className="py-2 px-4 text-left font-sans text-[0.8rem] font-semibold text-text-muted">
                  Last Fetched
                </th>
                <th className="py-2 px-4 text-left font-sans text-[0.8rem] font-semibold text-text-muted">
                  Status
                </th>
                <th className="py-2 px-4 text-left font-sans text-[0.8rem] font-semibold text-text-muted">
                  Error
                </th>
                <th className="py-2 px-4 text-right font-sans text-[0.8rem] font-semibold text-text-muted sr-only">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((feed) => (
                <FeedRow
                  key={feed.id}
                  feed={feed}
                  isEditing={editingId === feed.id}
                  isRowActionPending={isRowActionPending}
                  isAnyRowEditing={editingId !== null}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onRename={handleRenameFeed}
                  onToggleDisable={handleToggleDisable}
                  onDelete={handleDeleteFeed}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
