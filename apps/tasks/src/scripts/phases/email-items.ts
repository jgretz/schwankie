import postgres from 'postgres';
import {bulkUpsertEmailItems} from 'client';

export interface PhaseResult {
  read: number;
  wrote: number;
  skipped: number;
  errors: Error[];
}

interface StashlEmailItem {
  id: number;
  email_message_id: string;
  email_from: string;
  link: string;
  title: string | null;
  description: string | null;
}

const BATCH_SIZE = 200;

export async function migrateEmailItems(
  sql: postgres.Sql,
  userId: number,
  dryRun: boolean,
): Promise<PhaseResult> {
  const result: PhaseResult = {read: 0, wrote: 0, skipped: 0, errors: []};

  try {
    const countResult = await sql<Array<{count: string | number}>>`
      SELECT COUNT(*)::int as count FROM email_items WHERE user_id = ${userId}
    `;
    result.read = parseInt(String(countResult[0]?.count ?? '0'), 10);

    if (dryRun) {
      result.skipped = result.read;
      return result;
    }

    let offset = 0;
    while (true) {
      const items = await sql<StashlEmailItem[]>`
        SELECT
          id,
          email_message_id,
          email_from,
          link,
          title,
          description
        FROM email_items
        WHERE user_id = ${userId}
        LIMIT ${BATCH_SIZE}
        OFFSET ${offset}
      `;

      if (items.length === 0) break;

      try {
        await bulkUpsertEmailItems({
          items: items.map((item) => ({
            messageId: item.email_message_id,
            emailFrom: item.email_from,
            link: item.link,
            title: item.title || undefined,
            description: item.description || undefined,
          })),
        });
        result.wrote += items.length;
      } catch (error) {
        result.errors.push(error instanceof Error ? error : new Error(String(error)));
      }

      offset += BATCH_SIZE;
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  return result;
}
