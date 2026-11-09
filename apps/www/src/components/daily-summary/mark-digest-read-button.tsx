import {Button} from '@www/components/ui/button';

export function MarkDigestReadButton({
  isPending,
  onClick,
}: {
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" onClick={onClick} disabled={isPending}>
      {isPending ? 'Marking…' : 'Mark as read'}
    </Button>
  );
}
