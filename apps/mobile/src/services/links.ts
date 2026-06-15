import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type {InfiniteData, QueryClient, UseMutationOptions} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {createLink, deleteLink, fetchLinks, fetchTags, updateLink} from 'client';
import type {CreateLinkInput, LinkData, LinksResponse, LinkStatus, UpdateLinkInput} from 'client';
import {removeLinkFromInfiniteData} from './links-cache';

type LinksSnapshot = Array<[readonly unknown[], InfiniteData<LinksResponse> | undefined]>;

type MutationContext = {previous: LinksSnapshot} | undefined;

function restoreLinksSnapshot(queryClient: QueryClient, previous: LinksSnapshot | undefined): void {
  if (!previous) return;
  for (const [key, value] of previous) {
    queryClient.setQueryData(key, value);
  }
}

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

type UpdateLinkVariables = {id: number; data: UpdateLinkInput};

/**
 * Builds the optimistic-update mutation options. Extracted from the hook so the
 * `onMutate`/`onError` cache logic is unit-testable against a real QueryClient
 * without rendering React.
 */
export function updateLinkMutationOptions(
  queryClient: QueryClient,
): UseMutationOptions<LinkData, Error, UpdateLinkVariables, MutationContext> {
  return {
    mutationFn: ({id, data}) => updateLink(id, data),
    onMutate: async ({id, data}) => {
      // Only status changes remove the row from the queued list; other updates
      // fall back to the existing (non-optimistic) behavior.
      if (!data.status) return undefined;

      await queryClient.cancelQueries({queryKey: ['links', 'queued']});
      const previous = queryClient.getQueriesData<InfiniteData<LinksResponse>>({
        queryKey: ['links', 'queued'],
      });
      queryClient.setQueriesData<InfiniteData<LinksResponse>>(
        {queryKey: ['links', 'queued']},
        (old) => removeLinkFromInfiniteData(old, id),
      );
      return {previous};
    },
    onSuccess: (_res, {data}) => {
      // Invalidate the destination list + tag counts only — never the visible
      // queued query, which is already correct via the optimistic edit.
      queryClient.invalidateQueries({queryKey: ['links', data.status ?? 'saved']});
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error, _vars, context) => {
      restoreLinksSnapshot(queryClient, context?.previous);
      console.error('[useUpdateLink] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update link',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  };
}

export function useUpdateLink() {
  const queryClient = useQueryClient();
  return useMutation(updateLinkMutationOptions(queryClient));
}

/**
 * Builds the optimistic-delete mutation options. Extracted from the hook for the
 * same testability reason as {@link updateLinkMutationOptions}.
 */
export function deleteLinkMutationOptions(
  queryClient: QueryClient,
): UseMutationOptions<{deleted: boolean}, Error, number, MutationContext> {
  return {
    mutationFn: (id) => deleteLink(id),
    onMutate: async (id) => {
      // We don't know which list holds the item — snapshot/edit every status.
      await queryClient.cancelQueries({queryKey: ['links']});
      const previous = queryClient.getQueriesData<InfiniteData<LinksResponse>>({
        queryKey: ['links'],
      });
      queryClient.setQueriesData<InfiniteData<LinksResponse>>({queryKey: ['links']}, (old) =>
        removeLinkFromInfiniteData(old, id),
      );
      return {previous};
    },
    onSuccess: () => {
      // The row is already removed optimistically; only refresh tag counts.
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error, _id, context) => {
      restoreLinksSnapshot(queryClient, context?.previous);
      console.error('[useDeleteLink] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete link',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  };
}

export function useDeleteLink() {
  const queryClient = useQueryClient();
  return useMutation(deleteLinkMutationOptions(queryClient));
}
