import type PgBoss from 'pg-boss';
import {listPendingEmbeddings, upsertLinkEmbedding} from 'client';
import {embeddings} from '../lib/ollama';

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const MAX_INPUT_CHARS = 8000;
const BATCH_SIZE = 10;

export function buildInput(link: {
  title: string;
  description: string | null;
  content: string | null;
}): string {
  const parts = [link.title];
  if (link.description) parts.push(link.description);
  if (link.content) parts.push(link.content);
  return parts.join('\n\n').slice(0, MAX_INPUT_CHARS);
}

export const computeEmbeddingsHandler: PgBoss.WorkHandler<unknown> = async () => {
  if (!process.env.OLLAMA_URL) {
    console.log('[embed] OLLAMA_URL not set, skipping embeddings');
    return;
  }
  await computeEmbeddings(process.env.OLLAMA_URL, EMBED_MODEL);
};

export async function computeEmbeddings(ollamaUrl: string, model: string): Promise<void> {
  const {items} = await listPendingEmbeddings(model, BATCH_SIZE);
  if (items.length === 0) return;

  const results = await Promise.allSettled(
    items.map(async (item) => {
      const input = buildInput(item);
      if (!input.trim()) throw new Error('empty input');
      const vec = await embeddings({url: ollamaUrl, model, input});
      await upsertLinkEmbedding(item.id, {embedding: vec, model});
      return item.id;
    }),
  );

  for (let i = 0; i < results.length; i += 1) {
    const result = results[i]!;
    const item = items[i]!;
    if (result.status === 'fulfilled') {
      console.log(`[embed] link ${item.id}: embedded (dim=${result.value})`);
    } else {
      console.warn(`[embed] link ${item.id}: failed`, result.reason);
    }
  }
}
