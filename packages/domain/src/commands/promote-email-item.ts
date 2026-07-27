import {eq} from 'drizzle-orm';
import {emailItem} from 'database';
import {getDb} from '../db';
import {NotFoundError} from '../lib/errors';
import {createLink} from './create-link';
import type {LinkWithTags} from '../types';

export async function promoteEmailItem(id: string): Promise<LinkWithTags> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [item] = await tx.select().from(emailItem).where(eq(emailItem.id, id));

    if (!item) {
      throw new NotFoundError('emailItem', id);
    }

    // fitLinkFields owns the empty-title fallback to the url.
    const link = await createLink(
      {
        url: item.link,
        title: item.title,
        description: item.description,
        status: 'queued',
      },
      tx as any,
    );

    await tx.update(emailItem).set({clicked: true}).where(eq(emailItem.id, id));

    return link;
  });
}
