import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  fetchFeeds,
  listAllRssItems,
  markAllRssItemsRead,
  markRssItemRead,
  promoteRssItem,
  triggerRefreshAllFeeds,
} from 'client';

const PAGE_SIZE = 50;

export function useListFeeds() {
  return useQuery({
    queryKey: ['feeds'],
    queryFn: () => fetchFeeds(),
  });
}

type UseAllRssItemsOptions = {
  unread?: boolean;
  feedId?: string;
};

export function useAllRssItems(options: UseAllRssItemsOptions = {}) {
  return useInfiniteQuery({
    queryKey: ['all-rss-items', options],
    queryFn: ({pageParam = 0}) =>
      listAllRssItems({
        limit: PAGE_SIZE,
        offset: pageParam,
        read: options.unread !== undefined ? !options.unread : undefined,
        feedId: options.feedId,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
  });
}

export function useMarkRssItemRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({feedId, itemId}: {feedId: string; itemId: string}) =>
      markRssItemRead(feedId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
    },
    onError: (error) => {
      console.error('[useMarkRssItemRead] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to mark as read',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function usePromoteRssItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({feedId, itemId}: {feedId: string; itemId: string}) =>
      promoteRssItem(feedId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
      queryClient.invalidateQueries({queryKey: ['links', 'queued']});
    },
    onError: (error) => {
      console.error('[usePromoteRssItem] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to promote',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useMarkAllRssItemsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedId?: string) => markAllRssItemsRead(feedId),
    onSuccess: (result) => {
      Toast.show({
        type: 'success',
        text1: `Marked ${result.count} as read`,
      });
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
    },
    onError: (error) => {
      console.error('[useMarkAllRssItemsRead] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to mark all as read',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useTriggerRefreshAllFeeds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerRefreshAllFeeds(),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Feeds refresh queued',
        text2: 'Feed content is being updated',
      });
      queryClient.invalidateQueries({queryKey: ['all-rss-items']});
    },
    onError: (error) => {
      console.error('[useTriggerRefreshAllFeeds] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Refresh failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
