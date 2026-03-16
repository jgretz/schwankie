import type {Database} from 'database';
import {link, tag, linkTag} from 'database';
import {eq} from 'drizzle-orm';
import {resolveTags, upsertTags} from '../lib/upsert-tags';

export type UpdateLinkInput = {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  status?: 'saved' | 'queued' | 'archived';
  tags?: string[];
};

export async function updateLink(
  db: Database,
  id: number,
  input: UpdateLinkInput,
): Promise<(typeof link.$inferSelect & {tags: Array<{id: number; text: string}>}) | null> {
  const {tags: rawTags, ...fields} = input;

  const updateValues = {
    ...(fields.url !== undefined && {url: fields.url}),
    ...(fields.title !== undefined && {title: fields.title}),
    ...(fields.description !== undefined && {description: fields.description}),
    ...(fields.imageUrl !== undefined && {imageUrl: fields.imageUrl}),
    ...(fields.status !== undefined && {status: fields.status}),
    updateDate: new Date(),
  };

  return db.transaction(async (tx) => {
    const [updated] = await tx.update(link).set(updateValues).where(eq(link.id, id)).returning();

    if (!updated) return null;

    let tagRecords: Array<{id: number; text: string}> = [];

    if (rawTags !== undefined) {
      const normalizedTags = resolveTags(rawTags);
      tagRecords = await upsertTags(tx, normalizedTags);

      // replace tags: delete existing, insert new
      await tx.delete(linkTag).where(eq(linkTag.linkId, id));

      if (tagRecords.length > 0) {
        await tx.insert(linkTag).values(tagRecords.map((t) => ({linkId: id, tagId: t.id})));
      }
    } else {
      // fetch existing tags
      tagRecords = await tx
        .select({id: tag.id, text: tag.text})
        .from(linkTag)
        .innerJoin(tag, eq(linkTag.tagId, tag.id))
        .where(eq(linkTag.linkId, id));
    }

    return {...updated, tags: tagRecords};
  });
}
