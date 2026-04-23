import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {useCallback} from 'react';
import {z} from 'zod';
import {FeedPage} from '@www/components/feed/feed-page';
import {useFeedNavigation} from '@www/hooks/use-feed-navigation';

const searchSchema = z.object({
  tags: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  sort: z.enum(['date', 'score']).optional().catch(undefined),
});

export const Route = createFileRoute('/queue')({
  beforeLoad: ({context}) => {
    if (!context.auth.authenticated) {
      throw redirect({to: '/auth/login', search: {error: undefined}});
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

  const {handleTagClick, handleRemoveTag, handleClearAll, handleClearSearch} = useFeedNavigation({
    tags,
    q,
    extra: {sort},
    navigate,
  });

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
