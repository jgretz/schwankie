import {getLink, listTags} from '@domain';

type SuggestTagsResult = {tags: string[]};

export async function suggestTags(
  id: number,
  anthropicApiKey?: string,
): Promise<SuggestTagsResult | null> {
  const link = await getLink(id);
  if (!link) return null;

  if (!link.content || !anthropicApiKey) {
    return {tags: []};
  }

  const {tags: allTags} = await listTags({canonical: true, limit: 500});
  const tagTexts = allTags.map((t) => t.text);

  if (tagTexts.length === 0) return {tags: []};

  const contentSnippet = link.content.slice(0, 2000);

  try {
    const result = await callAnthropic(anthropicApiKey, contentSnippet, link.title, tagTexts);
    const valid = result.filter((t) => tagTexts.includes(t));
    return {tags: valid};
  } catch (error) {
    console.warn(`[suggest-tags] link ${id}: anthropic failed`, error);
    return {tags: []};
  }
}

async function callAnthropic(
  apiKey: string,
  content: string,
  title: string,
  existingTags: string[],
): Promise<string[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: [
            `Article title: "${title}"`,
            `Content (first 2000 chars):`,
            content,
            '',
            `Existing tags: ${JSON.stringify(existingTags)}`,
            '',
            'Which of these existing tags are relevant to this article?',
            'Select 1-5 tags maximum. Only select from the provided tag list.',
            'Respond with JSON only: { "tags": ["tag1", "tag2"] }',
          ].join('\n'),
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Anthropic HTTP ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {content: Array<{type: string; text: string}>};
  const text = data.content.find((c) => c.type === 'text')?.text ?? '{}';
  const parsed = JSON.parse(text) as {tags?: string[]};
  return Array.isArray(parsed.tags) ? parsed.tags : [];
}
