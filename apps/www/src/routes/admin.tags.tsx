import {createFileRoute, redirect} from '@tanstack/react-router';
import {useState} from 'react';
import {useAdminTags} from '@www/hooks/use-admin-tags';
import {Button} from '@www/components/ui/button';
import {Input} from '@www/components/ui/input';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@www/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@www/components/ui/select';

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

  // Sort by count descending
  const sorted = [...items].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Tags</h2>
        <span className="font-sans text-[0.8rem] text-text-faint">{sorted.length}</span>
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

      {sorted.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
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
              {sorted.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  allTags={sorted}
                  onRename={rename}
                  onMerge={merge}
                  onDelete={remove}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface TagRowProps {
  tag: {id: number; text: string; count?: number};
  allTags: Array<{id: number; text: string; count?: number}>;
  onRename: (input: {id: number; text: string}) => void;
  onMerge: (input: {aliasId: number; canonicalTagId: number}) => void;
  onDelete: (id: number) => void;
}

function TagRow({tag, allTags, onRename, onMerge, onDelete}: TagRowProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newText, setNewText] = useState(tag.text);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCanonicalId, setSelectedCanonicalId] = useState<string>('');

  const handleRenameSubmit = () => {
    if (newText.trim() && newText !== tag.text) {
      onRename({id: tag.id, text: newText});
      setIsRenaming(false);
    } else {
      setNewText(tag.text);
      setIsRenaming(false);
    }
  };

  const handleMergeClick = () => {
    setIsMergeDialogOpen(true);
  };

  const handleMergeSubmit = () => {
    if (selectedCanonicalId) {
      onMerge({aliasId: tag.id, canonicalTagId: Number(selectedCanonicalId)});
      setIsMergeDialogOpen(false);
      setSelectedCanonicalId('');
    }
  };

  return (
    <>
      <tr className="border-b border-border hover:bg-bg-subtle transition-colors">
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
        <td className="py-3 px-4 text-center font-sans text-[0.9rem] text-text-muted">
          {tag.count ?? 0}
        </td>
        <td className="py-3 px-4 text-right">
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={handleMergeClick}>
              Merge
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              Delete
            </Button>
          </div>
        </td>
      </tr>

      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge tag: {tag.text}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="font-sans text-[0.9rem] text-text-muted">
              Select the canonical tag to merge this tag into:
            </p>
            <Select value={selectedCanonicalId} onValueChange={setSelectedCanonicalId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a tag..." />
              </SelectTrigger>
              <SelectContent>
                {allTags
                  .filter((t) => t.id !== tag.id)
                  .map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.text}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsMergeDialogOpen(false);
                  setSelectedCanonicalId('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleMergeSubmit} disabled={!selectedCanonicalId}>
                Merge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tag: {tag.text}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="font-sans text-[0.9rem] text-text-muted">
              This will remove this tag from {tag.count ?? 0} links. This action cannot be undone.
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
