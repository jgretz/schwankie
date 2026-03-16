import {useQuery} from '@tanstack/react-query';
import type {LinkStatus} from '@www/lib/api-client';
import {fetchTags} from '@www/lib/api-client';

export function useTags(status: LinkStatus) {
  return useQuery({
    queryKey: ['tags', status],
    queryFn: () => fetchTags({status}),
    select: (data) => data.tags,
  });
}
