import {useQuery} from '@tanstack/react-query';
import {getStatusAction} from '@www/lib/status-actions';

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: () => getStatusAction(),
    refetchInterval: 30_000,
  });
}
