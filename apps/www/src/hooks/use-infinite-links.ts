import {useInfiniteQuery} from '@tanstack/react-query';
import type {LinkStatus} from 'client';
import {fetchLinksAction} from '@www/lib/link-actions';

type UseInfiniteLinksParams = {
  status: LinkStatus;
  tags?: string;
  q?: string;
  sort?: 'date' | 'score';
};

export function useInfiniteLinks(params: UseInfiniteLinksParams) {
  return useInfiniteQuery({
    queryKey: ['links', params.status, params.tags, params.q, params.sort],
    queryFn: ({pageParam = 0}) =>
      fetchLinksAction({data: {...params, offset: pageParam, limit: 50}}),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
  });
}
