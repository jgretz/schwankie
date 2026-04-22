import {eq} from 'drizzle-orm';
import {emailItem} from 'database';
import {getDb} from '../db';
import {createLink} from './create-link';

export async function promoteEmailItem(id: string): Promise<number> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [item] = await tx
      .select()
      .from(emailItem)
      .where(eq(emailItem.id, id));

    if (!item) {
      throw new Error(`Email item ${id} not found`);
    }

    const link = await createLink(
      {
        url: item.link,
        title: item.title || item.link,
        description: item.description || undefined,
        status: 'queued',
      },
      tx as any,
    );

    await tx
      .update(emailItem)
      .set({clicked: true})
      .where(eq(emailItem.id, id));

    return link.id;
  });
}
