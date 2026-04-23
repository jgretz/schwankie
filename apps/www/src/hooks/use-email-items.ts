import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {listEmailItems} from 'client';
import {
  markAllEmailItemsReadAction,
  markEmailItemReadAction,
  promoteEmailItemAction,
} from '../lib/email-actions';

interface UseEmailItemsOptions {
  unread?: boolean;
  from?: string;
}

export function useEmailItems(options: UseEmailItemsOptions = {}) {
  return useQuery({
    queryKey: ['email-items', options],
    queryFn: () =>
      listEmailItems({
        limit: 50,
        offset: 0,
        read: options.unread !== undefined ? !options.unread : undefined,
        from: options.from,
      }),
  });
}

export function useMarkEmailItemRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markEmailItemReadAction({data: {id}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['email-items']});
    },
  });
}

export function usePromoteEmailItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promoteEmailItemAction({data: {id}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['email-items']});
      queryClient.invalidateQueries({queryKey: ['links']});
    },
  });
}

export function useMarkAllEmailItemsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (from?: string) => markAllEmailItemsReadAction({data: {from}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['email-items']});
    },
  });
}
