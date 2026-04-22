import type {Database} from 'database';
import {emailItem} from 'database';
import {getDb} from '../db';

export interface EmailItemInput {
  messageId: string;
  emailFrom: string;
  link: string;
  title?: string;
  description?: string;
}

export async function bulkUpsertEmailItems(items: EmailItemInput[], db?: Database): Promise<number> {
  if (items.length === 0) return 0;

  const database = db || getDb();

  const rows = items.map((item) => ({
    emailMessageId: item.messageId,
    emailFrom: item.emailFrom,
    link: item.link,
    title: item.title,
    description: item.description,
  }));

  const result = await database
    .insert(emailItem)
    .values(rows)
    .onConflictDoNothing({
      target: [emailItem.emailMessageId, emailItem.link],
    })
    .returning();

  return result.length;
}
