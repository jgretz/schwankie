import {useQuery} from '@tanstack/react-query';
import {fetchTags} from '@www/lib/api-client';

type LinkStatus = 'saved' | 'archived';

export function useTags(status: LinkStatus) {
  return useQuery({
    queryKey: ['tags', status],
    queryFn: () => fetchTags({status}),
    select: (data) => data.tags,
  });
}
