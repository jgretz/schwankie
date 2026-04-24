import {useQuery} from '@tanstack/react-query';
import {getRelatedLinksAction} from '@www/lib/link-actions';

export function useRelatedLinks(linkId: number | null, limit = 8) {
  return useQuery({
    queryKey: ['related-links', linkId, limit],
    queryFn: () => {
      if (linkId == null) throw new Error('linkId required');
      return getRelatedLinksAction({data: {id: linkId, limit}});
    },
    enabled: linkId != null,
    staleTime: 60_000,
  });
}
