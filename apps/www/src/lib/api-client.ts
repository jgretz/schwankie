const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export type LinkData = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  createDate: string;
  updateDate: string;
  tags: Array<{id: number; text: string}>;
};

export type LinksResponse = {
  items: LinkData[];
  hasMore: boolean;
  nextOffset: number;
  total: number;
};

export type TagsResponse = {
  tags: Array<{id: number; text: string; count: number}>;
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API error: ${res.status} ${res.statusText} — ${body}`);
  }

  return res.json();
}

export function fetchLinks(params: {
  limit?: number;
  offset?: number;
  status?: string;
  tags?: string;
  q?: string;
}): Promise<LinksResponse> {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  if (params.status) search.set('status', params.status);
  if (params.tags) search.set('tags', params.tags);
  if (params.q) search.set('q', params.q);

  const qs = search.toString();
  return apiFetch<LinksResponse>(`/api/links${qs ? `?${qs}` : ''}`);
}

export function fetchTags(params: {status?: string}): Promise<TagsResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);

  const qs = search.toString();
  return apiFetch<TagsResponse>(`/api/tags${qs ? `?${qs}` : ''}`);
}
