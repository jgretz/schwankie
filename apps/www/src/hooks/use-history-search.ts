import {useQuery} from '@tanstack/react-query';
import type {HistoryDays} from 'client';
import {searchHistoryAction} from '@www/lib/history-actions';

// Every fetch spends two LLM calls, so a result is never refetched behind the owner's back.
export function useHistorySearch(q: string | undefined, days: HistoryDays) {
  return useQuery({
    queryKey: ['history-search', q, days],
    queryFn: () => searchHistoryAction({data: {q: q ?? '', days}}),
    enabled: !!q,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
