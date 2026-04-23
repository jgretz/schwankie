import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLink } from 'client';
import type { CreateLinkInput } from 'client';

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLinkInput) => createLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', 'queued'] });
    },
  });
}
