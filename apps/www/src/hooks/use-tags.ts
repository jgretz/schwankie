import {useQuery} from '@tanstack/react-query';
import {fetchTags} from '@www/lib/api-client';

export function useTags(status: string) {
  return useQuery({
    queryKey: ['tags', status],
    queryFn: () => fetchTags({status}),
    select: (data) => data.tags,
  });
}
