import {apiFetch} from '../config';
import type {EmailItemData} from '../types';

type ListEmailItemsParams = {
  limit?: number;
  offset?: number;
  read?: boolean;
  from?: string;
};

export function listEmailItems(params: ListEmailItemsParams = {}): Promise<{items: EmailItemData[]; total: number}> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.read != null) search.set('read', String(params.read));
  if (params.from) search.set('from', params.from);

  const qs = search.toString();
  return apiFetch<{items: EmailItemData[]; total: number}>(`/api/emails${qs ? `?${qs}` : ''}`);
}
