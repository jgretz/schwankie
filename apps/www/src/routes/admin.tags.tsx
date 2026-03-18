import {createFileRoute, redirect} from '@tanstack/react-router';
import {useState} from 'react';
import {useAdminTags} from '@www/hooks/use-admin-tags';
import {Button} from '@www/components/ui/button';
import {Input} from '@www/components/ui/input';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@www/components/ui/dialog';

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

type TagItem = {id: number; text: string; count: number};

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
          {filtered.length !== sorted.length ? `${filtered.length} / ${sorted.length}` : sorted.length}
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
        <p className="py-12 text-center font-sans text-[0.9rem] text-red-600">Failed to load tags.</p>
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

interface TagRowProps {
  tag: TagItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRename: (input: {id: number; text: string}) => void;
  onDelete: (id: number) => void;
}

function TagRow({tag, isSelected, onToggleSelect, onRename, onDelete}: TagRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newText, setNewText] = useState(tag.text);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function handleRenameSubmit() {
    if (newText.trim() && newText !== tag.text) {
      onRename({id: tag.id, text: newText});
      setIsRenaming(false);
    } else {
      setNewText(tag.text);
      setIsRenaming(false);
    }
  }

  return (
    <>
      <tr className="border-b border-border hover:bg-bg-subtle transition-colors">
        <td className="w-8 py-3 pl-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
          />
        </td>
        <td className="py-3 pr-4 font-sans text-[0.95rem] text-text">
          {isRenaming ? (
            <div className="flex gap-2">
              <Input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="h-7 max-w-xs"
                autoFocus
              />
              <Button size="sm" variant="default" onClick={handleRenameSubmit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewText(tag.text);
                  setIsRenaming(false);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <span
              onClick={() => setIsRenaming(true)}
              className="cursor-pointer hover:text-accent transition-colors"
            >
              {tag.text}
            </span>
          )}
        </td>
        <td className="py-3 px-4 text-center font-sans text-[0.9rem] text-text-muted">{tag.count}</td>
        <td className="py-3 px-4 text-right">
          <Button size="sm" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            Delete
          </Button>
        </td>
      </tr>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tag: {tag.text}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="font-sans text-[0.9rem] text-text-muted">
              This will remove this tag from {tag.count} links. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(tag.id);
                  setIsDeleteDialogOpen(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TagItem[];
  canonicalId: number | null;
  onCanonicalChange: (id: number) => void;
  onConfirm: () => void;
}

function MergeDialog({open, onOpenChange, tags, canonicalId, onCanonicalChange, onConfirm}: MergeDialogProps) {
  const canonical = tags.find((t) => t.id === canonicalId);
  const aliases = tags.filter((t) => t.id !== canonicalId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge {tags.length} tags</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="font-sans text-[0.9rem] text-text-muted">
            Select the canonical tag to keep. All others will be merged into it.
          </p>

          <div className="space-y-1">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-bg-subtle"
              >
                <input
                  type="radio"
                  name="canonical"
                  checked={canonicalId === tag.id}
                  onChange={() => onCanonicalChange(tag.id)}
                  className="accent-accent"
                />
                <span className="font-sans text-[0.9rem] text-text">{tag.text}</span>
                <span className="font-sans text-[0.8rem] text-text-faint">({tag.count} links)</span>
              </label>
            ))}
          </div>

          {canonical && aliases.length > 0 && (
            <p className="rounded-md bg-bg-subtle px-3 py-2 font-sans text-[0.8rem] text-text-muted">
              {aliases.map((a) => a.text).join(', ')} will be merged into{' '}
              <strong className="text-text">{canonical.text}</strong>
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={!canonicalId}>
              Merge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
