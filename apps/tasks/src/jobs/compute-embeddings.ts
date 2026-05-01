import type PgBoss from 'pg-boss';
import {listPendingEmbeddings, reportEmbeddingFailure, upsertLinkEmbedding} from 'client';
import {embeddings} from '../lib/ollama';

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
// nomic-embed-text has a 2048-token context. Most text fits at 4000 chars
// (~2.5 chars/token), but token-dense input (CJK, base64 data URIs, dense
// markdown) can exceed 2048 tokens at well under 4000 chars. Ollama's
// truncate:true is silently ignored on some versions, so we retry with
// halved input on context-length errors instead of relying on a single cap.
const MAX_INPUT_CHARS = 4000;
const MIN_INPUT_CHARS = 500;
const BATCH_SIZE = 50;

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

function isContextLengthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes('context length') || error.message.includes('exceeds');
}

async function embedWithBackoff(
  ollamaUrl: string,
  model: string,
  initialInput: string,
): Promise<number[]> {
  let input = initialInput;
  while (true) {
    try {
      return await embeddings({url: ollamaUrl, model, input});
    } catch (error) {
      if (!isContextLengthError(error)) throw error;
      const next = Math.floor(input.length / 2);
      if (next < MIN_INPUT_CHARS) throw error;
      input = input.slice(0, next);
    }
  }
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
      const vec = await embedWithBackoff(ollamaUrl, model, input);
      await upsertLinkEmbedding(item.id, {embedding: vec, model});
      return vec.length;
    }),
  );

  for (let i = 0; i < results.length; i += 1) {
    const result = results[i]!;
    const item = items[i]!;
    if (result.status === 'fulfilled') {
      console.log(`[embed] link ${item.id}: embedded (dim=${result.value})`);
      continue;
    }
    const failCount = (item.embeddingFailCount ?? 0) + 1;
    const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
    try {
      await reportEmbeddingFailure(item.id, failCount, reason.slice(0, 500));
    } catch (reportError) {
      console.warn(`[embed] link ${item.id}: failed to record failure`, reportError);
    }
    console.warn(`[embed] link ${item.id}: failed ${failCount}/3`, result.reason);
  }
}
