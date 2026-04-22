import postgres from 'postgres';
import {createLink, fetchLinks} from 'client';
import {mapLimitSettled} from '../concurrency';

export interface PhaseResult {
  read: number;
  wrote: number;
  skipped: number;
  errors: Error[];
}

interface StashlLink {
  id: number;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date_added: string;
}

const BATCH_SIZE = 200;
const CONCURRENCY = 5;

export async function migrateLinks(
  sql: postgres.Sql,
  userId: number,
  dryRun: boolean,
): Promise<PhaseResult> {
  const result: PhaseResult = {read: 0, wrote: 0, skipped: 0, errors: []};

  try {
    const countResult = await sql<Array<{count: string | number}>>`
      SELECT COUNT(*)::int as count FROM links WHERE user_id = ${userId}
    `;
    result.read = parseInt(String(countResult[0]?.count ?? '0'), 10);

    if (dryRun) {
      result.skipped = result.read;
      return result;
    }

    // Pre-fetch existing links once for idempotency check
    const existingLinks = new Set<string>();
    let fetchOffset = 0;
    while (true) {
      const batch = await fetchLinks({limit: 100, offset: fetchOffset});
      if (batch.items.length === 0) break;
      for (const item of batch.items) {
        existingLinks.add(item.url);
      }
      fetchOffset += 100;
    }

    let offset = 0;
    while (true) {
      const links = await sql<StashlLink[]>`
        SELECT id, url, title, description, image_url, date_added
        FROM links
        WHERE user_id = ${userId}
        ORDER BY date_added ASC
        LIMIT ${BATCH_SIZE}
        OFFSET ${offset}
      `;

      if (links.length === 0) break;

      const settled = await mapLimitSettled(
        links,
        CONCURRENCY,
        async (link) => {
          if (existingLinks.has(link.url)) {
            return {skipped: true};
          }

          await createLink({
            url: link.url,
            title: link.title,
            description: link.description || undefined,
            imageUrl: link.image_url || undefined,
            status: 'queued',
            tags: [],
          });

          return {skipped: false};
        },
      );

      for (const s of settled) {
        if (s.status === 'fulfilled') {
          if (s.value.skipped) {
            result.skipped++;
          } else {
            result.wrote++;
          }
        } else {
          result.errors.push(s.reason instanceof Error ? s.reason : new Error(String(s.reason)));
        }
      }

      offset += BATCH_SIZE;
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  return result;
}
