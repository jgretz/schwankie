import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {fetchFeedItems} from 'client';
import {initClient} from '@www/lib/init-client';
import {markRssItemReadAction, promoteRssItemAction} from '@www/lib/feed-actions';

initClient();

export function useRssItems(feedId: string, unread: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rss-items', feedId, {unread}],
    queryFn: () =>
      fetchFeedItems({
        feedId,
        read: unread ? false : undefined,
      }),
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
