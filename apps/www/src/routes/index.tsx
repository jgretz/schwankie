import {createFileRoute, useNavigate} from '@tanstack/react-router';
import {useCallback, useMemo} from 'react';
import {z} from 'zod';
import {FeedPage} from '@www/components/feed/feed-page';
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
  component: IndexPage,
});

function IndexPage() {
  const {auth} = Route.useRouteContext();
  const {tags, q} = Route.useSearch();
  const navigate = useNavigate({from: '/'});

  const selectedTagIds = useMemo(() => parseTagIds(tags), [tags]);

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

  return (
    <FeedPage
      status="saved"
      title="Compendium"
      tags={tags}
      q={q}
      isAuthenticated={auth.authenticated}
      onTagClick={handleTagClick}
      onRemoveTag={handleRemoveTag}
      onClearAll={handleClearAll}
    />
  );
}
