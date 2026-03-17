type Link = {id: number; url: string};
type Tag = {id: number; text: string};

type LinksResponse = {
  items: Link[];
  hasMore: boolean;
  nextOffset: number;
  total: number;
};

type TagsResponse = {
  tags: Tag[];
};

function createApiClient(config: {apiUrl: string; apiKey: string}) {
  const {apiUrl, apiKey} = config;

  async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...options?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  return {
    getLinksNeedingEnrichment(limit = 5): Promise<LinksResponse> {
      return apiFetch(`/api/links?needs_enrichment=true&limit=${limit}`);
    },

    updateLinkContent(id: number, content: string): Promise<unknown> {
      return apiFetch(`/api/links/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({content}),
      });
    },

    getTagsNeedingNormalization(): Promise<TagsResponse> {
      return apiFetch('/api/tags?needs_normalization=true');
    },

    getCanonicalTags(): Promise<TagsResponse> {
      return apiFetch('/api/tags?canonical=true');
    },

    mergeTag(aliasId: number, canonicalTagId: number): Promise<unknown> {
      return apiFetch(`/api/tags/${aliasId}/merge`, {
        method: 'POST',
        body: JSON.stringify({canonicalTagId}),
      });
    },

    markTagNormalized(tagId: number): Promise<unknown> {
      return apiFetch(`/api/tags/${tagId}/normalize`, {
        method: 'PATCH',
      });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
export {createApiClient};
