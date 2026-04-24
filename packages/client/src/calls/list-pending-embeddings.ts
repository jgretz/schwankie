import {apiFetch} from '../config';

export type PendingEmbeddingLink = {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
};

export type PendingEmbeddingsResponse = {items: PendingEmbeddingLink[]};

export function listPendingEmbeddings(
  model: string,
  limit = 10,
): Promise<PendingEmbeddingsResponse> {
  const params = new URLSearchParams({model, limit: String(limit)});
  return apiFetch<PendingEmbeddingsResponse>(`/api/links/pending-embeddings?${params}`);
}
