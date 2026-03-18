import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {fetchTags, renameTag, mergeTag, deleteTag} from 'client';
import {initClient} from '@www/lib/init-client';

initClient();

export function useAdminTags() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-tags'],
    queryFn: () => fetchTags({}),
  });

  const renameMutation = useMutation({
    mutationFn: ({id, text}: {id: number; text: string}) => renameTag(id, text),
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
      mergeTag(aliasId, canonicalTagId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['admin-tags']});
      queryClient.invalidateQueries({queryKey: ['tags']});
    },
    onError: (error) => {
      console.error('Failed to merge tag:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTag(id),
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
