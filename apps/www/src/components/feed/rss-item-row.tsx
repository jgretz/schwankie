import {useState} from 'react';
import {toast} from 'sonner';
import type {RssItemData} from 'client';
import {Button} from '@www/components/ui/button';

type RssItemRowProps = {
  item: RssItemData;
  onMarkRead?: () => void | Promise<void>;
  onPromote?: () => void | Promise<void>;
  onRemove?: (itemId: string) => void;
};

export function RssItemRow({item, onMarkRead, onPromote, onRemove}: RssItemRowProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleMarkRead() {
    setIsLoading(true);
    try {
      await onMarkRead?.();
      setIsHidden(true);
      onRemove?.(item.id);
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePromote() {
    setIsLoading(true);
    try {
      await onPromote?.();
      setIsHidden(true);
      onRemove?.(item.id);
      toast.success('Added to queue');
    } catch (error) {
      toast.error('Failed to add to queue');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isHidden) {
    return null;
  }

  const publishDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: '2-digit'})
    : new Date(item.createdAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: '2-digit'});

  return (
    <div className="flex items-center justify-between border-b border-border py-3 px-4 hover:bg-bg-subtle transition-colors group">
      <div className="flex-1 min-w-0">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text hover:text-accent transition-colors font-sans text-[0.95rem] block truncate"
        >
          {item.title}
        </a>
        {item.summary && (
          <p className="text-text-muted font-sans text-[0.85rem] line-clamp-2 mt-1">{item.summary}</p>
        )}
        <span className="text-text-faint font-sans text-[0.8rem] mt-1 block">{publishDate}</span>
      </div>
      <div className="flex gap-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkRead}
          disabled={isLoading}
          className="text-[0.8rem]"
        >
          Mark read
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={handlePromote}
          disabled={isLoading}
          className="text-[0.8rem]"
        >
          Promote
        </Button>
      </div>
    </div>
  );
}
