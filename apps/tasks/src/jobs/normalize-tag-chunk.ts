import type PgBoss from 'pg-boss';
import {getCanonicalTags, markTagNormalized, mergeTag} from 'client';
import {generate} from '../lib/ollama';

type OllamaMerge = {merge: true; canonical: string};
type OllamaNoMerge = {merge: false};
type OllamaResponse = OllamaMerge | OllamaNoMerge;

const SIMILARITY_THRESHOLD = 0.6;
const MAX_CANDIDATES = 10;

interface NormalizeTagChunkData {
  tags: Array<{id: number; text: string}>;
}

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

export const normalizeTagChunkHandler: PgBoss.WorkHandler<NormalizeTagChunkData> = async (jobs) => {
  for (const job of jobs) {
    await processChunk(job.data.tags);
  }
};

async function processChunk(rows: Array<{id: number; text: string}>): Promise<void> {
  const ollamaUrl = process.env.OLLAMA_URL;
  if (!ollamaUrl) return;
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';

  const {tags: canonicalRows} = await getCanonicalTags(500);
  const canonical: Array<{id: number; text: string}> = canonicalRows.map((r) => ({
    id: r.id,
    text: r.text,
  }));

  for (const row of rows) {
    try {
      const tag = row.text.trim();

      if (canonical.length === 0) {
        await markTagNormalized(row.id);
        canonical.push({id: row.id, text: row.text});
        console.log(`[normalize-tag-chunk] "${tag}": first canonical`);
        continue;
      }

      const exact = canonical.find((r) => r.text === tag);
      if (exact && exact.id !== row.id) {
        await mergeTag(row.id, exact.id);
        console.log(`[normalize-tag-chunk] "${tag}": exact match → "${exact.text}"`);
        continue;
      }

      const candidates = findCandidates(
        tag,
        canonical.map((r) => r.text),
      );
      if (candidates.length === 0) {
        await markTagNormalized(row.id);
        canonical.push({id: row.id, text: row.text});
        console.log(`[normalize-tag-chunk] "${tag}": no close matches, new canonical`);
        continue;
      }

      const prompt = buildPrompt(candidates, tag);
      const result = await generate<OllamaResponse>({
        url: ollamaUrl,
        model: ollamaModel,
        prompt,
      });

      if (result.merge && result.canonical) {
        const target = canonical.find((r) => r.text === result.canonical);
        if (target) {
          await mergeTag(row.id, target.id);
          console.log(`[normalize-tag-chunk] "${tag}": merged into "${result.canonical}"`);
        } else {
          await markTagNormalized(row.id);
          canonical.push({id: row.id, text: row.text});
          console.log(
            `[normalize-tag-chunk] "${tag}": canonical "${result.canonical}" not found, kept`,
          );
        }
      } else {
        await markTagNormalized(row.id);
        canonical.push({id: row.id, text: row.text});
        console.log(`[normalize-tag-chunk] "${tag}": new canonical`);
      }
    } catch (error) {
      console.warn(`[normalize-tag-chunk] "${row.text}": failed`, error);
    }
  }
}
