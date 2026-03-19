import {createFileRoute, redirect} from '@tanstack/react-router';
import {useState} from 'react';
import {useAdminTags} from '@www/hooks/use-admin-tags';
import {Button} from '@www/components/ui/button';
import {Input} from '@www/components/ui/input';
import {TagRow} from '@www/components/admin/tag-row';
import {MergeDialog} from '@www/components/admin/merge-dialog';

export const Route = createFileRoute('/admin/tags')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/'});
    }
  },
  head: () => ({
    meta: [{title: 'Tags — schwankie'}],
  }),
  component: AdminTagsPage,
});

function AdminTagsPage() {
  const {data, isLoading, isError, rename, merge, remove} = useAdminTags();
  const items = data?.tags ?? [];
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [canonicalId, setCanonicalId] = useState<number | null>(null);

  const sorted = [...items].sort((a, b) => b.count - a.count);
  const filtered = filter
    ? sorted.filter((t) => t.text.toLowerCase().includes(filter.toLowerCase()))
    : sorted;

  const selectedTags = sorted.filter((t) => selected.has(t.id));

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleMergeClick() {
    // Default canonical to the tag with the highest count
    const highest = selectedTags.reduce((a, b) => (a.count >= b.count ? a : b));
    setCanonicalId(highest.id);
    setMergeDialogOpen(true);
  }

  function handleMergeConfirm() {
    if (!canonicalId) return;
    const aliases = selectedTags.filter((t) => t.id !== canonicalId);
    for (const alias of aliases) {
      merge({aliasId: alias.id, canonicalTagId: canonicalId});
    }
    setMergeDialogOpen(false);
    setSelected(new Set());
    setCanonicalId(null);
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Tags</h2>
        <span className="font-sans text-[0.8rem] text-text-faint">
          {filtered.length !== sorted.length
            ? `${filtered.length} / ${sorted.length}`
            : sorted.length}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Input
          placeholder="Filter tags…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        {selected.size >= 2 && (
          <Button size="sm" variant="outline" onClick={handleMergeClick}>
            Merge {selected.size} tags
          </Button>
        )}
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="font-sans text-[0.8rem] text-text-muted hover:text-text transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      {isLoading && (
        <div className="animate-pulse space-y-4">
          {Array.from({length: 3}, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-red-600">
          Failed to load tags.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="py-12 text-center font-sans text-[0.9rem] text-text-muted">No tags found.</p>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="w-8 py-2" />
                <th className="py-2 text-left font-sans text-[0.8rem] font-semibold text-text-muted">
                  Tag
                </th>
                <th className="py-2 px-4 text-center font-sans text-[0.8rem] font-semibold text-text-muted">
                  Links
                </th>
                <th className="py-2 px-4 text-right font-sans text-[0.8rem] font-semibold text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  isSelected={selected.has(tag.id)}
                  onToggleSelect={() => toggleSelect(tag.id)}
                  onRename={rename}
                  onDelete={remove}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MergeDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        tags={selectedTags}
        canonicalId={canonicalId}
        onCanonicalChange={setCanonicalId}
        onConfirm={handleMergeConfirm}
      />
    </div>
  );
}
