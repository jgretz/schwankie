import {useInfiniteQuery} from '@tanstack/react-query';
import type {LinkStatus} from 'client';
import {fetchLinks} from 'client';
import {initClient} from '@www/lib/init-client';

initClient();

type UseInfiniteLinksParams = {
  status: LinkStatus;
  tags?: string;
  q?: string;
};

export function useInfiniteLinks(params: UseInfiniteLinksParams) {
  return useInfiniteQuery({
    queryKey: ['links', params.status, params.tags, params.q],
    queryFn: ({pageParam = 0}) => fetchLinks({...params, offset: pageParam, limit: 50}),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
  });
}
