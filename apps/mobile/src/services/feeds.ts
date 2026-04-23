import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  fetchFeeds,
  fetchFeedItems,
  markRssItemRead,
  promoteRssItem,
  triggerRefreshAllFeeds,
} from 'client';

export function useListFeeds() {
  return useQuery({
    queryKey: ['feeds'],
    queryFn: () => fetchFeeds(),
  });
}

export function useFeedItems(feedId: string) {
  return useQuery({
    queryKey: ['feeds', feedId, 'items'],
    queryFn: () =>
      fetchFeedItems({
        feedId,
        limit: 50,
        offset: 0,
      }),
    enabled: !!feedId,
  });
}

export function useMarkRssItemRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedId, itemId }: { feedId: string; itemId: string }) =>
      markRssItemRead(feedId, itemId),
    onSuccess: (_, { feedId }) => {
      queryClient.invalidateQueries({ queryKey: ['feeds', feedId, 'items'] });
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
    mutationFn: ({ feedId, itemId }: { feedId: string; itemId: string }) =>
      promoteRssItem(feedId, itemId),
    onSuccess: (_, { feedId }) => {
      queryClient.invalidateQueries({ queryKey: ['feeds', feedId, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['links', 'queued'] });
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

export function useTriggerRefreshAllFeeds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerRefreshAllFeeds(),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Feeds refreshed',
        text2: 'Feed content is being updated',
      });
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
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
