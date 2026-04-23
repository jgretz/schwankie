import {createFileRoute, redirect, useNavigate} from '@tanstack/react-router';
import {z} from 'zod';
import {FeedPage} from '@www/components/feed/feed-page';
import {useFeedNavigation} from '@www/hooks/use-feed-navigation';

const searchSchema = z.object({
  tags: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export type FeedSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute('/')({
  beforeLoad: ({context}) => {
    if (context.auth.authenticated) {
      throw redirect({to: '/queue'});
    }
  },
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

  const {handleTagClick, handleRemoveTag, handleClearAll, handleClearSearch} = useFeedNavigation({
    tags,
    q,
    navigate,
  });

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
      onClearSearch={handleClearSearch}
    />
  );
}
