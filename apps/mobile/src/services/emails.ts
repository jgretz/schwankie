import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  listEmailItems,
  markEmailItemRead,
  promoteEmailItem,
  triggerRefreshEmails,
} from 'client';

export function useListEmailItems() {
  return useQuery({
    queryKey: ['emails'],
    queryFn: () =>
      listEmailItems({
        limit: 100,
        offset: 0,
      }),
  });
}

export function useMarkEmailItemRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => markEmailItemRead(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}

export function usePromoteEmailItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => promoteEmailItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['links', 'queued'] });
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
        text1: 'Emails refreshed',
        text2: 'Email content is being updated',
      });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
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
