import type {ScoredLink} from './email-parser';
import {generate} from '../lib/ollama';

export type EmailContext = {
  from: string;
  subject: string;
};

export type LinkClassification = {
  url: string;
  keep: boolean;
  confidence: number;
  reason: string;
};

type ClassificationResult = {
  results: Array<{
    index: number;
    keep: boolean;
    confidence: number;
    reason: string;
  }>;
};

const SYSTEM_PROMPT = `You are a content curator for a link-saving application. Your job is to classify links from newsletter emails as worth saving or not.

A link is worth saving if it leads to:
- Original articles, blog posts, tutorials, or research papers
- Technical documentation or guides
- Interesting open-source projects, tools, or resources

A link is NOT worth saving if it is:
- Sponsor or advertisement content
- Subscription management or unsubscribe links
- Social media profiles or posts
- Cross-promotion for other newsletters
- Generic calls-to-action or boilerplate footer links

Respond ONLY with valid JSON matching the specified format.`;

function fallbackKeepAll(links: ScoredLink[]): LinkClassification[] {
  return links.map((link) => ({url: link.url, keep: true, confidence: 0, reason: 'fallback'}));
}

export async function classifyAmbiguousLinks(
  links: ScoredLink[],
  emailContext: EmailContext,
  ollamaUrl: string,
  ollamaModel: string,
): Promise<LinkClassification[]> {
  if (links.length === 0) return [];

  // Prompt injection risk: from, subject, title, and context are inserted verbatim.
  // A crafted newsletter could embed payloads in any field. Accepted risk — local LLM,
  // personal data only, worst case is link misclassification.
  const linkList = links
    .map(
      (link, i) =>
        // context is already capped at 200 chars by emailParser
        `${i + 1}. URL: ${link.url}\n   Title: ${link.title || 'N/A'}\n   Context: ${link.context}`,
    )
    .join('\n\n');

  const userMessage = `Classify these links from an email by "${emailContext.from}" with subject "${emailContext.subject}":

${linkList}

Respond with JSON: { "results": [{ "index": 1, "keep": true, "confidence": 0.85, "reason": "tech article" }] }`;

  const fullPrompt = `${SYSTEM_PROMPT}

${userMessage}`;

  try {
    const response = await generate<ClassificationResult>({
      url: ollamaUrl,
      model: ollamaModel,
      prompt: fullPrompt,
      format: 'json',
    });

    return links.map((link, i) => {
      const result = response.results.find((r) => r.index === i + 1);
      if (!result) {
        return {url: link.url, keep: true, confidence: 0, reason: 'missing'};
      }
      return {url: link.url, keep: result.keep, confidence: result.confidence, reason: result.reason};
    });
  } catch {
    return fallbackKeepAll(links);
  }
}
