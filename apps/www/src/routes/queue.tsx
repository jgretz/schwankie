import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {useCallback, useMemo} from 'react';
import {z} from 'zod';
import {FeedPage} from '@www/components/feed/feed-page';
import {parseTagSlugs} from '@www/lib/parse-tag-slugs';

const searchSchema = z.object({
  tags: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/queue')({
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
  const {tags, q} = Route.useSearch();
  const navigate = useNavigate({from: '/queue'});

  const selectedTags = useMemo(() => parseTagSlugs(tags), [tags]);

  const handleTagClick = useCallback(
    (tagText: string) => {
      if (selectedTags.includes(tagText)) return;
      const next = [...selectedTags, tagText];
      navigate({search: {tags: next.join(','), q}});
    },
    [selectedTags, navigate, q],
  );

  const handleRemoveTag = useCallback(
    (tagText: string) => {
      const next = selectedTags.filter((t) => t !== tagText);
      navigate({search: {tags: next.length > 0 ? next.join(',') : undefined, q}});
    },
    [selectedTags, navigate, q],
  );

  const handleClearAll = useCallback(() => {
    navigate({search: {q}});
  }, [navigate, q]);

  return (
    <FeedPage
      status="queued"
      title="Queue"
      tags={tags}
      q={q}
      isAuthenticated={auth.authenticated}
      onTagClick={handleTagClick}
      onRemoveTag={handleRemoveTag}
      onClearAll={handleClearAll}
    />
  );
}
