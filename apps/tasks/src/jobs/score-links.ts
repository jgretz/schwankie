import type PgBoss from 'pg-boss';
import {getLinksNeedingScoring, updateLinkScore} from 'client';
import {generate} from '../lib/ollama';

type OllamaQualityResponse = {quality: number};

export function computeHeuristicScore(link: {
  title: string;
  description: string | null;
  content: string | null;
  tags: Array<{id: number; text: string}>;
}): number {
  let score = 0;

  // Title is not bare URL: +10
  if (!link.title.startsWith('http')) {
    score += 10;
  }

  // Has description: +15
  if (link.description) {
    score += 15;
  }

  // Has tags: +10 for ≥1, +5 more for ≥3
  if (link.tags.length >= 1) {
    score += 10;
    if (link.tags.length >= 3) {
      score += 5;
    }
  }

  // Has enriched content: +10
  if (link.content) {
    score += 10;
    // Content length > 500 chars: +5; > 2000 chars: +5 more
    if (link.content.length > 500) {
      score += 5;
      if (link.content.length > 2000) {
        score += 5;
      }
    }
  }

  return Math.min(score, 60);
}

async function getOllamaQuality(
  ollamaUrl: string,
  ollamaModel: string,
  link: {title: string; description: string | null; content: string | null},
): Promise<number | null> {
  try {
    const contentExcerpt = link.content ? link.content.substring(0, 2000) : '';
    const prompt = [
      `Title: ${link.title}`,
      link.description ? `Description: ${link.description}` : '',
      `Content excerpt: ${contentExcerpt}`,
      '',
      'Rate the quality of this link content (0-40) based on:',
      '- Uniqueness: Is the content original or distinctive?',
      '- Depth: How comprehensive and detailed is the content?',
      '- Usefulness: How helpful would this be for someone interested in this topic?',
      '',
      'Respond with JSON only: {"quality": <number 0-40>}',
    ]
      .filter(Boolean)
      .join('\n');

    const parsed = await generate<OllamaQualityResponse>({
      url: ollamaUrl,
      model: ollamaModel,
      prompt,
      timeout: 120_000,
      format: 'json',
      options: {num_predict: 50},
    });
    const quality = Math.min(Math.max(parsed.quality, 0), 40);
    return quality;
  } catch (error) {
    console.warn(`[score] Ollama failed:`, error);
    return null;
  }
}

export const scoreLinksHandler: PgBoss.WorkHandler<unknown> = async () => {
  await scoreLinks(process.env.OLLAMA_URL, process.env.OLLAMA_MODEL || 'llama3.2:3b');
};

export async function scoreLinks(ollamaUrl?: string, ollamaModel?: string): Promise<void> {
  const {items: links} = await getLinksNeedingScoring(10);

  if (links.length === 0) return;

  for (const link of links) {
    try {
      let score = computeHeuristicScore(link);

      // Try Ollama enhancement if available
      if (ollamaUrl && ollamaModel && link.content) {
        const quality = await getOllamaQuality(ollamaUrl, ollamaModel, link);
        if (quality !== null) {
          score += quality;
        }
      }

      score = Math.min(score, 100);

      await updateLinkScore(link.id, score);
      console.log(`[score] link ${link.id}: scored ${score}`);
    } catch (error) {
      console.warn(`[score] link ${link.id}: failed`, error);
    }
  }
}
