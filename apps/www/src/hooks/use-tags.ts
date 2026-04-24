import {useQuery} from '@tanstack/react-query';
import type {LinkStatus} from 'client';
import {fetchTagsAction} from '@www/lib/tag-actions';

export function useTags(status: LinkStatus) {
  return useQuery({
    queryKey: ['tags', status],
    queryFn: () => fetchTagsAction({data: {status}}),
    select: (data) => data.tags,
  });
}
