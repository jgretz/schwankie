import {createFileRoute, redirect} from '@tanstack/react-router';
import {useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@www/components/ui/button';
import {Input} from '@www/components/ui/input';
import {useFeeds} from '@www/hooks/use-feeds';

export const Route = createFileRoute('/admin/feeds')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/'});
    }
  },
  head: () => ({
    meta: [{title: 'Feeds — schwankie'}],
  }),
  component: AdminFeedsPage,
});

function AdminFeedsPage() {
  const {query, createMutation, updateMutation, deleteMutation} = useFeeds();
  const feeds = query.data ?? [];
  const [filter, setFilter] = useState('');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedName, setNewFeedName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const sorted = [...feeds].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const filtered = filter
    ? sorted.filter((f) => f.name.toLowerCase().includes(filter.toLowerCase()) || f.sourceUrl.toLowerCase().includes(filter.toLowerCase()))
    : sorted;

  async function handleAddFeed() {
    if (!newFeedUrl.trim() || !newFeedName.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        sourceUrl: newFeedUrl,
        name: newFeedName,
      });
      toast.success('Feed added');
      setNewFeedUrl('');
      setNewFeedName('');
    } catch (error) {
      console.error('Failed to add feed:', error);
      toast.error('Failed to add feed');
    }
  }

  async function handleRenameFeed(feedId: string, newName: string) {
    if (!newName.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      await updateMutation.mutateAsync({id: feedId, name: newName});
      toast.success('Feed renamed');
      setEditingId(null);
    } catch (error) {
      console.error('Failed to rename feed:', error);
      toast.error('Failed to rename feed');
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

  async function handleDeleteFeed(feedId: string) {
    if (!confirm('Delete this feed?')) return;

    try {
      await deleteMutation.mutateAsync(feedId);
      toast.success('Feed deleted');
    } catch (error) {
      console.error('Failed to delete feed:', error);
      toast.error('Failed to delete feed');
    }
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Feeds</h2>
        <span className="font-sans text-[0.8rem] text-text-faint">
          {filtered.length !== sorted.length ? `${filtered.length} / ${sorted.length}` : sorted.length}
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
        <p className="py-12 text-center font-sans text-[0.9rem] text-red-600">Failed to load feeds.</p>
      )}

      {!query.isLoading && !query.isError && feeds.length === 0 && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-text-muted">No feeds yet. Add one above to get started.</p>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-sans text-[0.8rem] font-semibold text-text-muted">Name</th>
                <th className="py-2 px-4 text-left font-sans text-[0.8rem] font-semibold text-text-muted">URL</th>
                <th className="py-2 px-4 text-left font-sans text-[0.8rem] font-semibold text-text-muted">Last Fetched</th>
                <th className="py-2 px-4 text-left font-sans text-[0.8rem] font-semibold text-text-muted">Status</th>
                <th className="py-2 px-4 text-left font-sans text-[0.8rem] font-semibold text-text-muted">Error</th>
                <th className="py-2 px-4 text-right font-sans text-[0.8rem] font-semibold text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((feed) => (
                <tr key={feed.id} className="border-b border-border hover:bg-bg-subtle transition-colors">
                  <td className="py-3 font-sans text-[0.9rem]">
                    {editingId === feed.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-border rounded font-sans text-[0.9rem]"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRenameFeed(feed.id, editName)}
                          disabled={updateMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          disabled={updateMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span>{feed.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans text-[0.85rem] text-text-muted truncate">{feed.sourceUrl}</td>
                  <td className="py-3 px-4 font-sans text-[0.85rem] text-text-muted">
                    {feed.updatedAt ? new Date(feed.updatedAt).toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-4 font-sans text-[0.85rem]">
                    <span className={feed.disabled ? 'text-text-muted' : 'text-green-600 dark:text-green-400'}>
                      {feed.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans text-[0.85rem]">
                    {feed.errorCount > 0 && <span className="text-destructive">{feed.errorCount} error{feed.errorCount !== 1 ? 's' : ''}</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(feed.id);
                          setEditName(feed.name);
                        }}
                        disabled={editingId !== null || updateMutation.isPending}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleDisable(feed.id, feed.disabled ?? false)}
                        disabled={editingId !== null || updateMutation.isPending}
                      >
                        {feed.disabled ? 'Enable' : 'Disable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteFeed(feed.id)}
                        disabled={editingId !== null || deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
