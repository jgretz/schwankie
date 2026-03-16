import {useInfiniteQuery} from '@tanstack/react-query';
import {fetchLinks} from '@www/lib/api-client';

type LinkStatus = 'saved' | 'archived';

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
