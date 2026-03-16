import {eq, and, isNull, ne} from 'drizzle-orm';
import type {Database} from 'database';
import {link} from 'database';

export async function enrichContent(db: Database, cfBrowserRenderingUrl: string): Promise<void> {
  const links = await db
    .select({id: link.id, url: link.url})
    .from(link)
    .where(and(isNull(link.content), ne(link.status, 'trashed')))
    .limit(5);

  for (const row of links) {
    try {
      const response = await fetch(`${cfBrowserRenderingUrl}/markdown`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({url: row.url}),
      });

      if (!response.ok) {
        console.warn(`[enrich] link ${row.id}: HTTP ${response.status}`);
        continue;
      }

      const markdown = await response.text();

      await db
        .update(link)
        .set({content: markdown, updateDate: new Date()})
        .where(eq(link.id, row.id));

      console.log(`[enrich] link ${row.id}: content fetched`);
    } catch (error) {
      console.warn(`[enrich] link ${row.id}: failed`, error);
    }
  }
}
