import {link, tag, linkTag} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';
import {resolveTags, upsertTags} from '../lib/upsert-tags';
import type {UpdateLinkInput, LinkWithTags} from '../types';

export async function updateLink(id: number, input: UpdateLinkInput): Promise<LinkWithTags | null> {
  const db = getDb();
  const {tags: rawTags, ...fields} = input;

  const updateValues = {
    ...(fields.url !== undefined && {url: fields.url}),
    ...(fields.title !== undefined && {title: fields.title}),
    ...(fields.description !== undefined && {description: fields.description}),
    ...(fields.imageUrl !== undefined && {imageUrl: fields.imageUrl}),
    ...(fields.content !== undefined && {content: fields.content}),
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

      await tx.delete(linkTag).where(eq(linkTag.linkId, id));

      if (tagRecords.length > 0) {
        await tx.insert(linkTag).values(tagRecords.map((t) => ({linkId: id, tagId: t.id})));
      }
    } else {
      tagRecords = await tx
        .select({id: tag.id, text: tag.text})
        .from(linkTag)
        .innerJoin(tag, eq(linkTag.tagId, tag.id))
        .where(eq(linkTag.linkId, id));
    }

    return {...updated, tags: tagRecords};
  });
}
