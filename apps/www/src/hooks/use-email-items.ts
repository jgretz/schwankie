import {useInfiniteQuery, useMutation, useQueryClient} from '@tanstack/react-query';
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

const PAGE_SIZE = 50;

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
