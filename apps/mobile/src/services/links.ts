import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {createLink, deleteLink, fetchLinks, fetchTags, updateLink} from 'client';
import type {CreateLinkInput, LinkStatus, UpdateLinkInput} from 'client';

const PAGE_SIZE = 25;

type UseLinksOptions = {
  q?: string;
  tags?: string;
};

export function useLinks(status: LinkStatus, options: UseLinksOptions = {}) {
  return useInfiniteQuery({
    queryKey: ['links', status, options],
    queryFn: ({pageParam = 0}) =>
      fetchLinks({
        status,
        limit: PAGE_SIZE,
        offset: pageParam,
        q: options.q,
        tags: options.tags,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
  });
}

export function useLinkTags(status: LinkStatus) {
  return useQuery({
    queryKey: ['tags', status],
    queryFn: () => fetchTags({status}),
    select: (data) => data.tags,
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLinkInput) => createLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['links']});
      queryClient.invalidateQueries({queryKey: ['tags']});
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

export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, data}: {id: number; data: UpdateLinkInput}) => updateLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['links']});
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error) => {
      console.error('[useUpdateLink] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update link',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['links']});
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error) => {
      console.error('[useDeleteLink] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete link',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
