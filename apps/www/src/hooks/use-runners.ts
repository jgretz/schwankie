import {useQuery} from '@tanstack/react-query';
import {listRunnersAction} from '@www/lib/status-actions';

export function useRunners() {
  return useQuery({
    queryKey: ['runners'],
    queryFn: () => listRunnersAction(),
    refetchInterval: 30_000,
  });
}
