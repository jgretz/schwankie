const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export type LinkStatus = 'saved' | 'archived';

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

export type MetadataResponse = {
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  tags: string[];
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

async function apiFetch<T>(path: string, options?: RequestInit, authToken?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? {Authorization: `Bearer ${authToken}`} : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API error: ${res.status} ${res.statusText} — ${body}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
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

export function fetchTags(params: {status?: LinkStatus}): Promise<TagsResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);

  const qs = search.toString();
  return apiFetch<TagsResponse>(`/api/tags${qs ? `?${qs}` : ''}`);
}

export function fetchMetadata(url: string): Promise<MetadataResponse> {
  return apiFetch<MetadataResponse>('/api/metadata/fetch', {
    method: 'POST',
    body: JSON.stringify({url}),
  });
}

export function createLink(authToken: string, input: CreateLinkInput): Promise<LinkData> {
  return apiFetch<LinkData>('/api/links', {
    method: 'POST',
    body: JSON.stringify(input),
  }, authToken);
}

export function updateLink(authToken: string, id: number, input: UpdateLinkInput): Promise<LinkData> {
  return apiFetch<LinkData>(`/api/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }, authToken);
}

export function deleteLink(authToken: string, id: number): Promise<{deleted: boolean}> {
  return apiFetch<{deleted: boolean}>(`/api/links/${id}`, {
    method: 'DELETE',
  }, authToken);
}
