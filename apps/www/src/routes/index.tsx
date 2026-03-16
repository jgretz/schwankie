import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {useCallback, useEffect, useMemo, useRef} from 'react';
import {z} from 'zod';
import {FilterStrip} from '@www/components/feed/filter-strip';
import {LinkItem} from '@www/components/feed/link-item';
import {useLinkModal} from '@www/components/modal/link-modal-context';
import {useInfiniteLinks} from '@www/hooks/use-infinite-links';
import {useTags} from '@www/hooks/use-tags';
import {parseTagIds} from '@www/lib/parse-tag-ids';

const searchSchema = z.object({
  tags: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export type FeedSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/')({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {title: 'schwankie'},
      {name: 'description', content: 'Your second memory — a well-indexed collection of links.'},
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const {tags: tagsParam, q} = Route.useSearch();
  const navigate = useNavigate({from: '/'});
  const {auth} = Route.useRouteContext();
  const isAuthenticated = auth.authenticated;
  const {openEdit} = useLinkModal();

  const selectedTagIds = useMemo(() => parseTagIds(tagsParam), [tagsParam]);

  const {data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, isError} =
    useInfiniteLinks({
      status: 'saved',
      tags: tagsParam,
      q,
    });

  const {data: allTags} = useTags('saved');

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

  const handleTagClick = useCallback(
    (tagId: number) => {
      if (selectedTagIds.includes(tagId)) return;
      const next = [...selectedTagIds, tagId];
      navigate({search: {tags: next.join(','), q}});
    },
    [selectedTagIds, navigate, q],
  );

  const handleRemoveTag = useCallback(
    (tagId: number) => {
      const next = selectedTagIds.filter((id) => id !== tagId);
      navigate({search: {tags: next.length > 0 ? next.join(',') : undefined, q}});
    },
    [selectedTagIds, navigate, q],
  );

  const handleClearAll = useCallback(() => {
    navigate({search: {q}});
  }, [navigate, q]);

  const activeTags = useMemo(
    () =>
      selectedTagIds
        .map((id) => allTags?.find((t) => t.id === id))
        .filter((t): t is {id: number; text: string; count: number} => t != null),
    [selectedTagIds, allTags],
  );

  const handleEditClick = useCallback(
    (linkId: number) => {
      const link = items.find((item) => item.id === linkId);
      if (link) openEdit(link);
    },
    [items, openEdit],
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
        <h2 className="font-serif text-[1.35rem] font-semibold text-text">Recent links</h2>
        <span className="font-sans text-[0.8rem] text-text-faint">{total}</span>
      </div>

      <FilterStrip
        activeTags={activeTags}
        totalCount={total}
        onRemoveTag={handleRemoveTag}
        onClearAll={handleClearAll}
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
              onTagClick={handleTagClick}
              showEditButton={isAuthenticated}
              onEditClick={handleEditClick}
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
