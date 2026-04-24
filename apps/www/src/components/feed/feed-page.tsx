import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import type {LinkData, LinkStatus} from 'client';
import {useLinkModal} from '@www/components/modal/link-modal-context';
import {deleteLinksAction} from '@www/lib/link-actions';
import {FilterStrip} from './filter-strip';
import {LinkItem} from './link-item';
import {SelectionToolbar} from './selection-toolbar';
import {BulkDeleteDialog} from './bulk-delete-dialog';
import {useInfiniteLinks} from '@www/hooks/use-infinite-links';
import {useTags} from '@www/hooks/use-tags';
import {parseTagSlugs} from '@www/lib/parse-tag-slugs';

type FeedPageProps = {
  status: LinkStatus;
  title: string;
  tags?: string;
  q?: string;
  sort?: 'date' | 'score';
  isAuthenticated: boolean;
  onTagClick: (tagText: string) => void;
  onRemoveTag: (tagText: string) => void;
  onClearAll: () => void;
  onClearSearch?: () => void;
  onSortChange?: (sort: 'date' | 'score') => void;
};

function buildEmptyMessage(q: string | undefined, tags: string[]): string {
  const tagNames = tags.join(' + ');
  if (q && tags.length > 0) {
    return `No results for "${q}" in ${tagNames}. Try clearing the search or removing a tag.`;
  }
  if (q) {
    return `No results for "${q}". Try a different search term.`;
  }
  if (tags.length > 0) {
    return `No links tagged ${tagNames}.`;
  }
  return 'No links found.';
}

export function FeedPage({
  status,
  title,
  tags: tagsParam,
  q,
  sort,
  isAuthenticated,
  onTagClick,
  onRemoveTag,
  onClearAll,
  onClearSearch,
  onSortChange,
}: FeedPageProps) {
  const {openEdit} = useLinkModal();
  const queryClient = useQueryClient();
  const selectedTags = useMemo(() => parseTagSlugs(tagsParam), [tagsParam]);

  const {data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, isError} =
    useInfiniteLinks({
      status,
      tags: tagsParam,
      q,
      sort,
    });

  const {data: allTags} = useTags(status);

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  const bulkEnabled = status === 'queued' && isAuthenticated;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset selection when the visible set changes (filter, sort, search, status)
  useEffect(() => {
    setSelected(new Set());
  }, [status, tagsParam, q, sort]);

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectAll = useCallback(() => {
    setSelected(new Set(items.map((item) => item.id)));
  }, [items]);

  const handleOpenSelected = useCallback(() => {
    const urls = items.filter((item) => selected.has(item.id)).map((item) => item.url);
    // Synchronous loop inside the click handler so popup blockers allow the batch.
    for (const url of urls) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [items, selected]);

  const handleConfirmDelete = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setIsDeleting(true);
    try {
      const result = await deleteLinksAction({data: {ids}});
      queryClient.invalidateQueries({queryKey: ['links']});
      queryClient.invalidateQueries({queryKey: ['tags']});
      toast.success(`Deleted ${result.deleted} link${result.deleted === 1 ? '' : 's'}`);
      setSelected(new Set());
      setDeleteDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete links';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [selected, queryClient]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {rootMargin: '200px', threshold: 0},
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const activeTags = useMemo(
    () =>
      selectedTags
        .map((text) => allTags?.find((t) => t.text === text))
        .filter((t): t is {id: number; text: string; count: number} => t != null),
    [selectedTags, allTags],
  );

  if (isError) {
    return (
      <div className="px-6 py-10">
        <p className="py-12 text-center font-sans text-[0.9rem] text-red-600">
          Failed to load links. Please try again later.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-6 py-10">
        <div className="animate-pulse space-y-4">
          {Array.from({length: 5}, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-3/4 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">{title}</h2>
        <span className="font-sans text-[0.8rem] text-text-faint">{total}</span>
      </div>

      {status === 'queued' && onSortChange && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => onSortChange('date')}
            className={`px-3 py-[2px] rounded-[3px] font-sans text-[0.72rem] transition-colors ${
              sort !== 'score'
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text hover:bg-bg-subtle'
            }`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => onSortChange('score')}
            className={`px-3 py-[2px] rounded-[3px] font-sans text-[0.72rem] transition-colors ${
              sort === 'score'
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text hover:bg-bg-subtle'
            }`}
          >
            Best
          </button>
        </div>
      )}

      <FilterStrip
        activeTags={activeTags}
        totalCount={total}
        onRemoveTag={onRemoveTag}
        onClearAll={onClearAll}
        searchQuery={q}
        onClearSearch={onClearSearch}
      />

      {bulkEnabled && selected.size > 0 && (
        <SelectionToolbar
          selectedCount={selected.size}
          visibleCount={items.length}
          onSelectAll={selectAll}
          onOpen={handleOpenSelected}
          onDelete={() => setDeleteDialogOpen(true)}
          onClear={clearSelection}
        />
      )}

      {items.length === 0 ? (
        <div className="py-12 text-center font-sans text-[0.9rem] text-text-muted">
          <p>{buildEmptyMessage(q, selectedTags)}</p>
          {(q || selectedTags.length > 0) && (
            <button
              type="button"
              onClick={() => {
                onClearAll();
                onClearSearch?.();
              }}
              className="mt-3 cursor-pointer text-[0.82rem] text-accent underline transition-colors hover:text-accent-hover"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div>
          {items.map((item) => (
            <LinkItem
              key={item.id}
              url={item.url}
              title={item.title}
              description={item.description}
              date={item.createDate}
              tags={item.tags}
              activeTags={selectedTags}
              onTagClick={onTagClick}
              searchQuery={q}
              showEditButton={isAuthenticated}
              onEditClick={openEdit}
              linkData={item as LinkData}
              score={item.score}
              showScore={status === 'queued'}
              isSelectable={bulkEnabled}
              isSelected={selected.has(item.id)}
              onToggleSelect={bulkEnabled ? () => toggleSelect(item.id) : undefined}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      )}

      {bulkEnabled && (
        <BulkDeleteDialog
          open={deleteDialogOpen}
          count={selected.size}
          isDeleting={isDeleting}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
