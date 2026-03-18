import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {fetchTags} from 'client';
import {initClient} from '@www/lib/init-client';
import {renameTagAction, mergeTagAction, deleteTagAction} from '@www/lib/tag-actions';

initClient();

export function useAdminTags() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-tags'],
    queryFn: () => fetchTags({}),
  });

  const renameMutation = useMutation({
    mutationFn: ({id, text}: {id: number; text: string}) =>
      renameTagAction({data: {id, text}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-tags']});
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error) => {
      console.error('Failed to rename tag:', error);
    },
  });

  const mergeMutation = useMutation({
    mutationFn: ({aliasId, canonicalTagId}: {aliasId: number; canonicalTagId: number}) =>
      mergeTagAction({data: {aliasId, canonicalTagId}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-tags']});
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error) => {
      console.error('Failed to merge tag:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTagAction({data: {id}}),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-tags']});
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error) => {
      console.error('Failed to delete tag:', error);
    },
  });

  return {
    ...query,
    rename: renameMutation.mutate,
    merge: mergeMutation.mutate,
    remove: deleteMutation.mutate,
    isRenamingLoading: renameMutation.isPending,
    isMergingLoading: mergeMutation.isPending,
    isDeletingLoading: deleteMutation.isPending,
  };
}
