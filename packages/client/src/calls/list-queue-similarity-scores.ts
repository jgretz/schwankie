import {apiFetch} from '../config';

export type QueueSimilarityScoreItem = {linkId: number; score: number};
export type QueueSimilarityScoresResponse = {items: QueueSimilarityScoreItem[]};

export function listQueueSimilarityScores(
  limit = 100,
  k = 10,
  minSimilarity = 0.5,
): Promise<QueueSimilarityScoresResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    k: String(k),
    minSimilarity: String(minSimilarity),
  });
  return apiFetch<QueueSimilarityScoresResponse>(
    `/api/links/queue-similarity-scores?${params}`,
  );
}
