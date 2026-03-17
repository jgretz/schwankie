const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export type LinkStatus = 'queued' | 'saved' | 'archived';

export type LinkData = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: LinkStatus;
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
  status?: LinkStatus;
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

export type LinkMetadata = {
  title: string;
  description: string | null;
  imageUrl: string | null;
};

export type CreateLinkInput = {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status?: 'saved' | 'queued';
  tags?: string[];
};

export type UpdateLinkInput = {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  status?: 'saved' | 'queued' | 'archived';
  tags?: string[];
};

export function fetchMetadata(url: string): Promise<LinkMetadata> {
  return apiFetch<LinkMetadata>('/api/metadata/fetch', {
    method: 'POST',
    body: JSON.stringify({url}),
  });
}

export function createLink(apiKey: string, data: CreateLinkInput): Promise<LinkData> {
  return apiFetch<LinkData>('/api/links', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {Authorization: `Bearer ${apiKey}`},
  });
}

export function updateLink(apiKey: string, id: number, data: UpdateLinkInput): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: {Authorization: `Bearer ${apiKey}`},
  });
}

export function deleteLink(apiKey: string, id: number): Promise<{deleted: boolean}> {
  return apiFetch<{deleted: boolean}>(`/api/links/${id}`, {
    method: 'DELETE',
    headers: {Authorization: `Bearer ${apiKey}`},
  });
}

export function fetchTags(params: {status?: LinkStatus}): Promise<TagsResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);

  const qs = search.toString();
  return apiFetch<TagsResponse>(`/api/tags${qs ? `?${qs}` : ''}`);
}
