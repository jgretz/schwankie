import {link, linkTag} from 'database';
import {getDb} from '../db';
import {resolveTags, upsertTags} from '../lib/upsert-tags';
import type {CreateLinkInput, LinkWithTags} from '../types';

export async function createLink(input: CreateLinkInput): Promise<LinkWithTags> {
  const db = getDb();
  const normalizedTags = resolveTags(input.tags);

  return db.transaction(async (tx) => {
    const tagRecords = await upsertTags(tx, normalizedTags);

    const [created] = await tx
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
      await tx.insert(linkTag).values(tagRecords.map((t) => ({linkId: created!.id, tagId: t.id})));
    }

    return {
      ...created!,
      tags: tagRecords.map((t) => ({id: t.id, text: t.text})),
    };
  });
}
