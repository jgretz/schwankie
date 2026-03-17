import {useQuery} from '@tanstack/react-query';
import type {LinkStatus} from 'client';
import {fetchTags} from 'client';
import {initClient} from '@www/lib/init-client';

initClient();

export function useTags(status: LinkStatus) {
  return useQuery({
    queryKey: ['tags', status],
    queryFn: () => fetchTags({status}),
    select: (data) => data.tags,
  });
}
