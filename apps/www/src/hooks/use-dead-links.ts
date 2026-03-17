import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {fetchDeadLinks, resetEnrichment, deleteLink} from 'client';
import {initClient} from '@www/lib/init-client';

initClient();

export function useDeadLinks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dead-links'],
    queryFn: () => fetchDeadLinks(100),
  });

  const retryMutation = useMutation({
    mutationFn: (id: number) => resetEnrichment(id),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['dead-links']}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLink(id),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['dead-links']}),
  });

  return {
    ...query,
    retryLink: retryMutation.mutate,
    deleteLink: deleteMutation.mutate,
  };
}
