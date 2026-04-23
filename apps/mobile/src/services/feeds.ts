import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  });
}

export function useTriggerRefreshAllFeeds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerRefreshAllFeeds(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
    },
  });
}
