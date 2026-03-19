import {useState} from 'react';
import {Button} from '@www/components/ui/button';
import {Input} from '@www/components/ui/input';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@www/components/ui/dialog';

export type TagItem = {id: number; text: string; count: number};

export interface TagRowProps {
  tag: TagItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRename: (input: {id: number; text: string}) => void;
  onDelete: (id: number) => void;
}

export function TagRow({tag, isSelected, onToggleSelect, onRename, onDelete}: TagRowProps) {
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
        <td className="py-3 px-4 text-center font-sans text-[0.9rem] text-text-muted">
          {tag.count}
        </td>
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
