import {memo, useEffect, useRef, useState} from 'react';
import {MoreVertical} from 'lucide-react';
import type {FeedData} from 'client';
import {Button} from '@www/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@www/components/ui/dropdown-menu';
import {formatFeedTimestamp} from '@www/lib/format-feed-timestamp';

export interface FeedRowProps {
  feed: FeedData;
  isEditing: boolean;
  /**
   * True while any update *or* delete is in flight. Deliberately one flag: it
   * disables every row action together rather than letting a delete fire
   * mid-rename, and it keeps a page-wide boolean from splitting into two props
   * that both invalidate the memo anyway.
   */
  isRowActionPending: boolean;
  isAnyRowEditing: boolean;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onRename: (id: string, name: string) => void;
  onToggleDisable: (id: string, currentDisabled: boolean) => void;
  onDelete: (id: string) => void;
}

/**
 * The rename draft lives here rather than in the page so a keystroke re-renders
 * one row instead of the whole table.
 */
export const FeedRow = memo(function FeedRow({
  feed,
  isEditing,
  isRowActionPending,
  isAnyRowEditing,
  onStartEdit,
  onCancelEdit,
  onRename,
  onToggleDisable,
  onDelete,
}: FeedRowProps) {
  const [editName, setEditName] = useState(feed.name);
  const [wasEditing, setWasEditing] = useState(isEditing);
  const editNameRef = useRef<HTMLInputElement>(null);

  // Focus on entering edit mode rather than `autoFocus` so the focus move is deliberate.
  useEffect(() => {
    if (isEditing) editNameRef.current?.focus();
  }, [isEditing]);

  // Reseed the draft on each entry into edit mode so an abandoned edit never
  // leaks into the next one. Done during render rather than in an effect so the
  // input never paints the stale value first.
  if (isEditing !== wasEditing) {
    setWasEditing(isEditing);
    if (isEditing) setEditName(feed.name);
  }

  return (
    <tr className="border-b border-border hover:bg-bg-subtle transition-colors">
      <td className="py-3 pr-4 font-sans text-[0.9rem] align-middle">
        {isEditing ? (
          <div className="flex gap-2">
            <input
              ref={editNameRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="min-w-0 flex-1 px-2 py-1 border border-border rounded font-sans text-[0.9rem]"
            />
            <Button
              size="sm"
              onClick={() => onRename(feed.id, editName)}
              disabled={isRowActionPending}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelEdit}
              disabled={isRowActionPending}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <span className="block truncate" title={feed.name}>
            {feed.name}
          </span>
        )}
      </td>
      <td className="py-3 px-4 font-sans text-[0.85rem] text-text-muted align-middle">
        <a
          href={feed.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate hover:text-accent transition-colors"
          title={feed.sourceUrl}
        >
          {feed.sourceUrl.replace(/^https?:\/\/(www\.)?/, '')}
        </a>
      </td>
      <td className="py-3 px-4 font-sans text-[0.85rem] text-text-muted align-middle truncate">
        {formatFeedTimestamp(feed.updatedAt)}
      </td>
      <td className="py-3 px-4 font-sans text-[0.85rem] align-middle">
        <span className={feed.disabled ? 'text-text-muted' : 'text-green-600 dark:text-green-400'}>
          {feed.disabled ? 'Disabled' : 'Active'}
        </span>
      </td>
      <td className="py-3 px-4 font-sans text-[0.85rem] align-middle">
        {feed.errorCount > 0 && (
          <span
            className="block truncate text-destructive"
            title={feed.lastError ?? `${feed.errorCount} error${feed.errorCount !== 1 ? 's' : ''}`}
          >
            {feed.errorCount} err{feed.errorCount !== 1 ? 's' : ''}
          </span>
        )}
      </td>
      <td className="py-3 pl-2 text-right align-middle">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Feed actions"
              disabled={isAnyRowEditing}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-subtle hover:text-text disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" focusable="false" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => onStartEdit(feed.id)}>Rename</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onToggleDisable(feed.id, feed.disabled ?? false)}
              disabled={isRowActionPending}
            >
              {feed.disabled ? 'Enable' : 'Disable'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(feed.id)}
              disabled={isRowActionPending}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
});
