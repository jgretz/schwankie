import type {ApiClient} from '../lib/api-client';

type OllamaMerge = {merge: true; canonical: string};
type OllamaNoMerge = {merge: false};
type OllamaResponse = OllamaMerge | OllamaNoMerge;

function buildPrompt(canonicalTags: string[], newTag: string): string {
  return [
    `Given these canonical tags: ${JSON.stringify(canonicalTags)}`,
    `Should the new tag "${newTag}" be merged into one of these existing tags?`,
    'Respond with JSON (only): { "merge": true, "canonical": "javascript" } or { "merge": false }',
  ].join('\n');
}

async function callOllama(
  ollamaUrl: string,
  model: string,
  prompt: string,
): Promise<OllamaResponse> {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({model, prompt, stream: false}),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const body = (await response.json()) as {response: string};
  return JSON.parse(body.response) as OllamaResponse;
}

export async function normalizeTags(
  api: ApiClient,
  ollamaUrl: string,
  ollamaModel: string,
): Promise<void> {
  const {tags: unprocessed} = await api.getTagsNeedingNormalization();

  if (unprocessed.length === 0) return;

  const {tags: canonicalRows} = await api.getCanonicalTags();
  const canonicalTags = canonicalRows.map((r) => r.text);

  for (const row of unprocessed) {
    try {
      // No canonical tags yet — just mark as processed
      if (canonicalTags.length === 0) {
        await api.markTagNormalized(row.id);
        canonicalTags.push(row.text);
        console.log(`[normalize] tag "${row.text}": first canonical`);
        continue;
      }

      const prompt = buildPrompt(canonicalTags, row.text);
      const result = await callOllama(ollamaUrl, ollamaModel, prompt);

      if (result.merge && result.canonical) {
        const canonicalRow = canonicalRows.find((r) => r.text === result.canonical);

        if (canonicalRow) {
          await api.mergeTag(row.id, canonicalRow.id);
          console.log(`[normalize] tag "${row.text}": merged into "${result.canonical}"`);
        } else {
          await api.markTagNormalized(row.id);
          canonicalTags.push(row.text);
          console.log(
            `[normalize] tag "${row.text}": canonical "${result.canonical}" not found, kept`,
          );
        }
      } else {
        await api.markTagNormalized(row.id);
        canonicalTags.push(row.text);
        console.log(`[normalize] tag "${row.text}": new canonical`);
      }
    } catch (error) {
      console.warn(`[normalize] tag "${row.text}": failed`, error);
    }
  }
}
