import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {fetchFeedItems} from 'client';
import {initClient} from '@www/lib/init-client';
import {markRssItemReadAction, promoteRssItemAction} from '@www/lib/feed-actions';

initClient();

const PAGE_SIZE = 50;

export function useRssItems(feedId: string, unread: boolean = true) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['rss-items', feedId, {unread}],
    queryFn: ({pageParam = 0}) =>
      fetchFeedItems({
        feedId,
        limit: PAGE_SIZE,
        offset: pageParam,
        read: unread ? false : undefined,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
  });

  const markReadMutation = useMutation({
    mutationFn: (itemId: string) =>
      markRssItemReadAction({data: {feedId, itemId}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['rss-items', feedId]});
    },
    onError: (error) => {
      console.error('Failed to mark item as read:', error);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: (itemId: string) =>
      promoteRssItemAction({data: {feedId, itemId}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['rss-items', feedId]});
    },
    onError: (error) => {
      console.error('Failed to promote item:', error);
    },
  });

  return {
    query,
    markReadMutation,
    promoteMutation,
  };
}
