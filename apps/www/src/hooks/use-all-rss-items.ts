import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  listAllRssItemsAction,
  markAllRssItemsReadAction,
  markRssItemReadAction,
  promoteRssItemAction,
} from '@www/lib/feed-actions';

type Options = {
  unread?: boolean;
  feedId?: string;
};

const PAGE_SIZE = 50;

export function useAllRssItems(options: Options = {}) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['all-rss-items', options],
    queryFn: ({pageParam = 0}) =>
      listAllRssItemsAction({
        data: {
          limit: PAGE_SIZE,
          offset: pageParam,
          read: options.unread !== undefined ? !options.unread : undefined,
          feedId: options.feedId,
        },
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
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
