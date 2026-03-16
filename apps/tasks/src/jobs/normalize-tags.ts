import {eq, isNull, isNotNull, and} from 'drizzle-orm';
import type {Database} from 'database';
import {tag, tagAlias, linkTag} from 'database';

interface OllamaMerge {
  merge: true;
  canonical: string;
}

interface OllamaNoMerge {
  merge: false;
}

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

async function mergeTag(
  db: Database,
  aliasTagId: number,
  aliasText: string,
  canonicalTagId: number,
): Promise<void> {
  // Find link_tag rows pointing to the alias
  const aliasLinkTags = await db
    .select({linkId: linkTag.linkId})
    .from(linkTag)
    .where(eq(linkTag.tagId, aliasTagId));

  for (const {linkId} of aliasLinkTags) {
    // Check if canonical already linked to this link
    const existing = await db
      .select({id: linkTag.id})
      .from(linkTag)
      .where(and(eq(linkTag.linkId, linkId), eq(linkTag.tagId, canonicalTagId)))
      .limit(1);

    if (existing.length > 0) {
      // Duplicate — delete the alias link_tag
      await db
        .delete(linkTag)
        .where(and(eq(linkTag.linkId, linkId), eq(linkTag.tagId, aliasTagId)));
    } else {
      // Reassign to canonical
      await db
        .update(linkTag)
        .set({tagId: canonicalTagId})
        .where(and(eq(linkTag.linkId, linkId), eq(linkTag.tagId, aliasTagId)));
    }
  }

  // Insert audit row
  await db.insert(tagAlias).values({
    aliasText,
    canonicalTagId,
    source: 'ollama',
  });

  // Delete the alias tag
  await db.delete(tag).where(eq(tag.id, aliasTagId));
}

export async function normalizeTags(
  db: Database,
  ollamaUrl: string,
  ollamaModel: string,
): Promise<void> {
  const unprocessed = await db
    .select({id: tag.id, text: tag.text})
    .from(tag)
    .where(isNull(tag.normalizedAt))
    .limit(10);

  if (unprocessed.length === 0) return;

  const canonicalRows = await db
    .select({text: tag.text})
    .from(tag)
    .where(isNotNull(tag.normalizedAt));

  const canonicalTags = canonicalRows.map((r) => r.text);

  for (const row of unprocessed) {
    try {
      // No canonical tags yet — just mark as processed
      if (canonicalTags.length === 0) {
        await db.update(tag).set({normalizedAt: new Date()}).where(eq(tag.id, row.id));
        canonicalTags.push(row.text);
        console.log(`[normalize] tag "${row.text}": first canonical`);
        continue;
      }

      const prompt = buildPrompt(canonicalTags, row.text);
      const result = await callOllama(ollamaUrl, ollamaModel, prompt);

      if (result.merge) {
        // Find the canonical tag in the DB
        const [canonicalRow] = await db
          .select({id: tag.id})
          .from(tag)
          .where(eq(tag.text, result.canonical))
          .limit(1);

        if (canonicalRow) {
          await mergeTag(db, row.id, row.text, canonicalRow.id);
          console.log(`[normalize] tag "${row.text}": merged into "${result.canonical}"`);
        } else {
          // Canonical not found — mark as standalone
          await db.update(tag).set({normalizedAt: new Date()}).where(eq(tag.id, row.id));
          canonicalTags.push(row.text);
          console.log(
            `[normalize] tag "${row.text}": canonical "${result.canonical}" not found, kept`,
          );
        }
      } else {
        await db.update(tag).set({normalizedAt: new Date()}).where(eq(tag.id, row.id));
        canonicalTags.push(row.text);
        console.log(`[normalize] tag "${row.text}": new canonical`);
      }
    } catch (error) {
      console.warn(`[normalize] tag "${row.text}": failed`, error);
    }
  }
}
