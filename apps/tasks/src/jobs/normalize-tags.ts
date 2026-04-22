import type PgBoss from 'pg-boss';
import {getCanonicalTags, getTagsNeedingNormalization, markTagNormalized, mergeTag} from 'client';
import {generate} from '../lib/ollama';

type OllamaMerge = {merge: true; canonical: string};
type OllamaNoMerge = {merge: false};
type OllamaResponse = OllamaMerge | OllamaNoMerge;

const SIMILARITY_THRESHOLD = 0.6;
const MAX_CANDIDATES = 10;

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({length: m + 1}, (_, i) =>
    Array.from({length: n + 1}, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

export function findCandidates(newTag: string, canonicalTags: string[]): string[] {
  const scored = canonicalTags
    .map(function (tag) {
      const sim = similarity(newTag, tag);
      const isSubstring = tag.includes(newTag) || newTag.includes(tag);
      const score = isSubstring ? Math.max(sim, 0.7) : sim;
      return {tag, score};
    })
    .filter((r) => r.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);

  return scored.map((r) => r.tag);
}

export function buildPrompt(candidates: string[], newTag: string): string {
  return [
    `Given these existing tags: ${JSON.stringify(candidates)}`,
    `Should the new tag "${newTag}" be merged into one of these existing tags?`,
    'Only merge if they represent the same concept (e.g. plurals, abbreviations, synonyms).',
    'Respond with JSON (only): { "merge": true, "canonical": "existing-tag" } or { "merge": false }',
  ].join('\n');
}

async function callOllama(
  ollamaUrl: string,
  model: string,
  prompt: string,
): Promise<OllamaResponse> {
  return generate<OllamaResponse>({
    url: ollamaUrl,
    model,
    prompt,
  });
}

export const normalizeTagsHandler: PgBoss.WorkHandler<unknown> = async () => {
  if (!process.env.OLLAMA_URL) {
    console.log('[normalize] OLLAMA_URL not set, skipping tag normalization');
    return;
  }
  await normalizeTags(process.env.OLLAMA_URL, process.env.OLLAMA_MODEL || 'llama3.2:3b');
};

export async function normalizeTags(ollamaUrl: string, ollamaModel: string): Promise<void> {
  const {tags: unprocessed} = await getTagsNeedingNormalization();

  if (unprocessed.length === 0) return;

  const {tags: canonicalRows} = await getCanonicalTags(500);
  const canonicalTags = canonicalRows.map((r) => r.text);

  for (const row of unprocessed) {
    try {
      const tag = row.text.trim();

      // No canonical tags yet — just mark as processed
      if (canonicalTags.length === 0) {
        await markTagNormalized(row.id);
        canonicalTags.push(row.text);
        canonicalRows.push(row);
        console.log(`[normalize] tag "${tag}": first canonical`);
        continue;
      }

      // Exact match — merge immediately
      const exactMatch = canonicalRows.find((r) => r.text === tag);
      if (exactMatch && exactMatch.id !== row.id) {
        await mergeTag(row.id, exactMatch.id);
        console.log(`[normalize] tag "${tag}": exact match, merged into "${exactMatch.text}"`);
        continue;
      }

      // Find fuzzy candidates
      const candidates = findCandidates(tag, canonicalTags);

      // No close matches — new canonical
      if (candidates.length === 0) {
        await markTagNormalized(row.id);
        canonicalTags.push(row.text);
        canonicalRows.push(row);
        console.log(`[normalize] tag "${tag}": no close matches, new canonical`);
        continue;
      }

      // Ambiguous — ask Ollama with only the close candidates
      const prompt = buildPrompt(candidates, tag);
      const result = await callOllama(ollamaUrl, ollamaModel, prompt);

      if (result.merge && result.canonical) {
        const canonicalRow = canonicalRows.find((r) => r.text === result.canonical);

        if (canonicalRow) {
          await mergeTag(row.id, canonicalRow.id);
          console.log(`[normalize] tag "${tag}": merged into "${result.canonical}"`);
        } else {
          await markTagNormalized(row.id);
          canonicalTags.push(row.text);
          canonicalRows.push(row);
          console.log(`[normalize] tag "${tag}": canonical "${result.canonical}" not found, kept`);
        }
      } else {
        await markTagNormalized(row.id);
        canonicalTags.push(row.text);
        canonicalRows.push(row);
        console.log(`[normalize] tag "${tag}": new canonical`);
      }
    } catch (error) {
      console.warn(`[normalize] tag "${row.text}": failed`, error);
    }
  }
}
