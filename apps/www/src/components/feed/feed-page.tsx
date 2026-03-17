import {useCallback, useEffect, useMemo, useRef} from 'react';
import type {LinkData, LinkStatus} from '@www/lib/api-client';
import {useLinkModal} from '@www/components/modal/link-modal-context';
import {FilterStrip} from './filter-strip';
import {LinkItem} from './link-item';
import {useInfiniteLinks} from '@www/hooks/use-infinite-links';
import {useTags} from '@www/hooks/use-tags';
import {parseTagIds} from '@www/lib/parse-tag-ids';

type FeedPageProps = {
  status: LinkStatus;
  title: string;
  tags?: string;
  q?: string;
  isAuthenticated: boolean;
  onTagClick: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  onClearAll: () => void;
};

export function FeedPage({
  status,
  title,
  tags: tagsParam,
  q,
  isAuthenticated,
  onTagClick,
  onRemoveTag,
  onClearAll,
}: FeedPageProps) {
  const {openEdit} = useLinkModal();
  const selectedTagIds = useMemo(() => parseTagIds(tagsParam), [tagsParam]);

  const {data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, isError} =
    useInfiniteLinks({
      status,
      tags: tagsParam,
      q,
    });

  const {data: allTags} = useTags(status);

  const items = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

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

  const memoizedOnTagClick = useCallback(onTagClick, [onTagClick]);
  const memoizedOnRemoveTag = useCallback(onRemoveTag, [onRemoveTag]);
  const memoizedOnClearAll = useCallback(onClearAll, [onClearAll]);

  const activeTags = useMemo(
    () =>
      selectedTagIds
        .map((id) => allTags?.find((t) => t.id === id))
        .filter((t): t is {id: number; text: string; count: number} => t != null),
    [selectedTagIds, allTags],
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

      <FilterStrip
        activeTags={activeTags}
        totalCount={total}
        onRemoveTag={memoizedOnRemoveTag}
        onClearAll={memoizedOnClearAll}
      />

      {items.length === 0 ? (
        <p className="py-12 text-center font-sans text-[0.9rem] text-text-muted">No links found.</p>
      ) : (
        <div>
          {items.map((item) => (
            <LinkItem
              key={item.id}
              id={item.id}
              url={item.url}
              title={item.title}
              description={item.description}
              date={item.createDate}
              tags={item.tags}
              activeTagIds={selectedTagIds}
              onTagClick={memoizedOnTagClick}
              showEditButton={isAuthenticated}
              onEditClick={() => openEdit(item as LinkData)}
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
    </div>
  );
}
