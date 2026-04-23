import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {listAllRssItems} from 'client';
import {initClient} from '@www/lib/init-client';
import {
  markAllRssItemsReadAction,
  markRssItemReadAction,
  promoteRssItemAction,
} from '@www/lib/feed-actions';

initClient();

type Options = {
  unread?: boolean;
  feedId?: string;
};

export function useAllRssItems(options: Options = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['all-rss-items', options],
    queryFn: () =>
      listAllRssItems({
        limit: 50,
        offset: 0,
        read: options.unread !== undefined ? !options.unread : undefined,
        feedId: options.feedId,
      }),
  });

  const markReadMutation = useMutation({
    mutationFn: ({feedId, itemId}: {feedId: string; itemId: string}) =>
      markRssItemReadAction({data: {feedId, itemId}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
    },
  });

  const promoteMutation = useMutation({
    mutationFn: ({feedId, itemId}: {feedId: string; itemId: string}) =>
      promoteRssItemAction({data: {feedId, itemId}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
      queryClient.invalidateQueries({queryKey: ['links']});
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: (feedId?: string) => markAllRssItemsReadAction({data: {feedId}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
    },
  });

  return {query, markReadMutation, promoteMutation, markAllReadMutation};
}
