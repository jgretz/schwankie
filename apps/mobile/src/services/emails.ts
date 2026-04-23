import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  listEmailItems,
  markAllEmailItemsRead,
  markEmailItemRead,
  promoteEmailItem,
  triggerRefreshEmails,
} from 'client';

const PAGE_SIZE = 50;

type UseEmailItemsOptions = {
  unread?: boolean;
  from?: string;
};

export function useEmailItems(options: UseEmailItemsOptions = {}) {
  return useInfiniteQuery({
    queryKey: ['email-items', options],
    queryFn: ({pageParam = 0}) =>
      listEmailItems({
        limit: PAGE_SIZE,
        offset: pageParam,
        read: options.unread !== undefined ? !options.unread : undefined,
        from: options.from,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
  });
}

export function useMarkEmailItemRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => markEmailItemRead(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['email-items']});
    },
    onError: (error) => {
      console.error('[useMarkEmailItemRead] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to mark as read',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function usePromoteEmailItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => promoteEmailItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['email-items']});
      queryClient.invalidateQueries({queryKey: ['links', 'queued']});
    },
    onError: (error) => {
      console.error('[usePromoteEmailItem] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to promote',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useMarkAllEmailItemsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (from?: string) => markAllEmailItemsRead(from),
    onSuccess: (result) => {
      Toast.show({type: 'success', text1: `Marked ${result.count} as read`});
      queryClient.invalidateQueries({queryKey: ['email-items']});
    },
    onError: (error) => {
      console.error('[useMarkAllEmailItemsRead] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to mark all as read',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useTriggerRefreshEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerRefreshEmails(),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Emails refresh queued',
        text2: 'Email content is being updated',
      });
      queryClient.invalidateQueries({queryKey: ['email-items']});
    },
    onError: (error) => {
      console.error('[useTriggerRefreshEmails] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Refresh failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
