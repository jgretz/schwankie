import type PgBoss from 'pg-boss';
import {reportEmbeddingFailure, upsertLinkEmbedding} from 'client';
import {embeddings} from '../lib/ollama';

// nomic-embed-text has a 2048-token context. Most text fits at 4000 chars
// (~2.5 chars/token), but token-dense input (CJK, base64 data URIs, dense
// markdown) can exceed 2048 tokens at well under 4000 chars. Ollama's
// truncate:true is silently ignored on some versions, so we retry with
// halved input on context-length errors instead of relying on a single cap.
const MAX_INPUT_CHARS = 4000;
const MIN_INPUT_CHARS = 500;

interface EmbedLinkData {
  linkId: number;
  title: string;
  description: string | null;
  content: string | null;
  currentFailCount: number;
  model: string;
}

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

export const embedLinkHandler: PgBoss.WorkHandler<EmbedLinkData> = async (jobs) => {
  for (const job of jobs) {
    await processOne(job);
  }
};

async function processOne(job: PgBoss.Job<EmbedLinkData>): Promise<void> {
  const ollamaUrl = process.env.OLLAMA_URL;
  if (!ollamaUrl) return;

  const {linkId, currentFailCount, model} = job.data;
  const input = buildInput(job.data);
  if (!input.trim()) {
    try {
      await reportEmbeddingFailure(linkId, currentFailCount + 1, 'empty input');
    } catch (reportError) {
      console.warn(`[embed-link] link ${linkId}: failed to record failure`, reportError);
    }
    return;
  }

  try {
    const vec = await embedWithBackoff(ollamaUrl, model, input);
    await upsertLinkEmbedding(linkId, {embedding: vec, model});
    console.log(`[embed-link] link ${linkId}: embedded (dim=${vec.length})`);
  } catch (error) {
    const failCount = currentFailCount + 1;
    const reason = error instanceof Error ? error.message : String(error);
    try {
      await reportEmbeddingFailure(linkId, failCount, reason.slice(0, 500));
    } catch (reportError) {
      console.warn(`[embed-link] link ${linkId}: failed to record failure`, reportError);
    }
    console.warn(`[embed-link] link ${linkId}: failed ${failCount}/3`, error);
  }
}
