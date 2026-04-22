import {link, rssItem} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';
import {upsertTags} from '../lib/upsert-tags';

export async function promoteRssItem(id: string): Promise<number | null> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [item] = await tx.select().from(rssItem).where(eq(rssItem.id, id));

    if (!item) return null;

    const tagRecords = await upsertTags(tx, []);

    const [created] = await tx
      .insert(link)
      .values({
        url: item.link,
        title: item.title,
        description: item.summary || undefined,
        imageUrl: item.imageUrl || undefined,
        status: 'queued',
        content: null,
      })
      .returning();

    if (!created) return null;

    if (tagRecords.length > 0) {
      const {linkTag} = await import('database');
      await tx.insert(linkTag).values(tagRecords.map((t) => ({linkId: created.id, tagId: t.id})));
    }

    await tx.update(rssItem).set({clicked: true}).where(eq(rssItem.id, id));

    return created.id;
  });
}
