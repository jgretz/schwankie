import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { createLink } from 'client';
import type { CreateLinkInput } from 'client';

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLinkInput) => createLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', 'queued'] });
    },
    onError: (error) => {
      console.error('[useCreateLink] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add link',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
