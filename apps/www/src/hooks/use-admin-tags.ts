import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {deleteTagAction, fetchTagsAction, mergeTagAction, renameTagAction} from '@www/lib/tag-actions';

export function useAdminTags() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-tags'],
    queryFn: () => fetchTagsAction({data: {all: true}}),
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
