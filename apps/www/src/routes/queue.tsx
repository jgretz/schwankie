import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useCallback, useMemo} from 'react';
import {z} from 'zod';
import {FeedPage} from '@www/components/feed/feed-page';
import {parseTagSlugs} from '@www/lib/parse-tag-slugs';

const searchSchema = z.object({
  tags: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  sort: z.enum(['date', 'score']).optional().catch(undefined),
});

export const Route = createFileRoute('/queue')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/'});
    }
  },
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      {title: 'Queue — schwankie'},
      {name: 'description', content: 'Queued links — your second memory.'},
    ],
  }),
  component: QueuePage,
});

function QueuePage() {
  const {auth} = Route.useRouteContext();
  const {tags, q, sort} = Route.useSearch();
  const navigate = useNavigate({from: '/queue'});

  const selectedTags = useMemo(() => parseTagSlugs(tags), [tags]);

  const handleTagClick = useCallback(
    (tagText: string) => {
      if (selectedTags.includes(tagText)) return;
      const next = [...selectedTags, tagText];
      navigate({search: {tags: next.join(','), q, sort}});
    },
    [selectedTags, navigate, q, sort],
  );

  const handleRemoveTag = useCallback(
    (tagText: string) => {
      const next = selectedTags.filter((t) => t !== tagText);
      navigate({search: {tags: next.length > 0 ? next.join(',') : undefined, q, sort}});
    },
    [selectedTags, navigate, q, sort],
  );

  const handleClearAll = useCallback(() => {
    navigate({search: {q, sort}});
  }, [navigate, q, sort]);

  const handleClearSearch = useCallback(() => {
    navigate({search: {tags, q: undefined, sort}});
  }, [navigate, tags, sort]);

  const handleSortChange = useCallback(
    (newSort: 'date' | 'score') => {
      navigate({search: {tags, q, sort: newSort === 'date' ? undefined : newSort}});
    },
    [navigate, tags, q],
  );

  return (
    <FeedPage
      status="queued"
      title="Queue"
      tags={tags}
      q={q}
      sort={sort}
      isAuthenticated={auth.authenticated}
      onTagClick={handleTagClick}
      onRemoveTag={handleRemoveTag}
      onClearAll={handleClearAll}
      onClearSearch={handleClearSearch}
      onSortChange={handleSortChange}
    />
  );
}
