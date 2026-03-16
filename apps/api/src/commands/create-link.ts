import type {Database} from 'database';
import {link, linkTag} from 'database';
import {resolveTags, upsertTags} from '../lib/upsert-tags';

export type CreateLinkInput = {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status?: 'saved' | 'queued';
  tags?: string[];
};

export async function createLink(
  db: Database,
  input: CreateLinkInput,
): Promise<typeof link.$inferSelect & {tags: Array<{id: number; text: string}>}> {
  const normalizedTags = resolveTags(input.tags);
  const tagRecords = await upsertTags(db, normalizedTags);

  const [created] = await db
    .insert(link)
    .values({
      url: input.url,
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      status: input.status ?? 'saved',
    })
    .returning();

  if (tagRecords.length > 0) {
    await db.insert(linkTag).values(tagRecords.map((t) => ({linkId: created!.id, tagId: t.id})));
  }

  return {
    ...created!,
    tags: tagRecords.map((t) => ({id: t.id, text: t.text})),
  };
}
