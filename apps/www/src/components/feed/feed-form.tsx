import {useState} from 'react';
import {toast} from 'sonner';
import {Button} from '@www/components/ui/button';
import {Input} from '@www/components/ui/input';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@www/components/ui/dialog';
import {createFeedAction, updateFeedAction} from '@www/lib/feed-actions';
import type {FeedData} from 'client';

type FeedFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feed?: FeedData;
  onSuccess?: () => void;
};

export function FeedForm({open, onOpenChange, feed, onSuccess}: FeedFormProps) {
  const [name, setName] = useState(feed?.name ?? '');
  const [sourceUrl, setSourceUrl] = useState(feed?.sourceUrl ?? '');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !sourceUrl.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsPending(true);
    try {
      if (feed) {
        await updateFeedAction({data: {id: feed.id, name: name.trim(), sourceUrl: sourceUrl.trim()}});
        toast.success('Feed updated successfully');
      } else {
        await createFeedAction({data: {name: name.trim(), sourceUrl: sourceUrl.trim()}});
        toast.success('Feed created successfully');
      }
      setName('');
      setSourceUrl('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to save feed');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setName(feed?.name ?? '');
      setSourceUrl(feed?.sourceUrl ?? '');
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{feed ? 'Edit Feed' : 'Add Feed'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="font-sans text-[0.9rem] text-text-muted block mb-2">Feed Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My favorite news"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="font-sans text-[0.9rem] text-text-muted block mb-2">Feed URL</label>
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              disabled={isPending}
              type="url"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
