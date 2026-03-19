import {Button} from '@www/components/ui/button';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@www/components/ui/dialog';
import type {TagItem} from './tag-row';

export interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TagItem[];
  canonicalId: number | null;
  onCanonicalChange: (id: number) => void;
  onConfirm: () => void;
}

export function MergeDialog({
  open,
  onOpenChange,
  tags,
  canonicalId,
  onCanonicalChange,
  onConfirm,
}: MergeDialogProps) {
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
