import {apiFetch} from '../config';
import type {HistoryDays, HistorySearchResponse} from '../types';

type SearchHistoryParams = {
  q: string;
  days?: HistoryDays;
};

export function searchHistory(params: SearchHistoryParams): Promise<HistorySearchResponse> {
  const search = new URLSearchParams({q: params.q});
  if (params.days != null) search.set('days', String(params.days));

  return apiFetch<HistorySearchResponse>(`/api/history/search?${search.toString()}`);
}
