import {apiFetch} from '../config';

export type UpsertLinkEmbeddingInput = {
  embedding: number[];
  model: string;
};

export function upsertLinkEmbedding(
  id: number,
  input: UpsertLinkEmbeddingInput,
): Promise<{upserted: true}> {
  return apiFetch<{upserted: true}>(`/api/links/${id}/embedding`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
