import {Button} from '@www/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@www/components/ui/dialog';

type BulkDeleteDialogProps = {
  open: boolean;
  count: number;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function BulkDeleteDialog({
  open,
  count,
  isDeleting,
  onOpenChange,
  onConfirm,
}: BulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Delete {count} link{count === 1 ? '' : 's'}?</DialogTitle>
          <DialogDescription>
            This permanently removes {count === 1 ? 'this link' : 'these links'} from your queue.
            This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : `Delete ${count}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
