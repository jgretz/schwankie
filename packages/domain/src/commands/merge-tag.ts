import {linkTag, tag, tagAlias} from 'database';
import {eq, sql} from 'drizzle-orm';
import {getDb} from '../db';
import type {MergeTagInput} from '../types';

export async function mergeTag(input: MergeTagInput): Promise<boolean> {
  const db = getDb();
  const {aliasTagId, canonicalTagId} = input;

  return db.transaction(async (tx) => {
    const [aliasRow] = await tx
      .select({id: tag.id, text: tag.text})
      .from(tag)
      .where(eq(tag.id, aliasTagId));
    const [canonicalRow] = await tx
      .select({id: tag.id})
      .from(tag)
      .where(eq(tag.id, canonicalTagId));
    if (!aliasRow || !canonicalRow) return false;

    await tx.execute(sql`
      DELETE FROM ${linkTag}
      WHERE ${linkTag.tagId} = ${aliasTagId}
        AND ${linkTag.linkId} IN (
          SELECT ${linkTag.linkId} FROM ${linkTag} WHERE ${linkTag.tagId} = ${canonicalTagId}
        )
    `);

    await tx.update(linkTag).set({tagId: canonicalTagId}).where(eq(linkTag.tagId, aliasTagId));

    // Re-point any existing aliases that reference the alias tag to the new canonical
    await tx
      .update(tagAlias)
      .set({canonicalTagId})
      .where(eq(tagAlias.canonicalTagId, aliasTagId));

    await tx.insert(tagAlias).values({
      aliasText: aliasRow.text,
      canonicalTagId,
      source: 'ollama',
    });

    await tx.delete(tag).where(eq(tag.id, aliasTagId));

    await tx
      .update(tag)
      .set({normalizedAt: sql`now()`})
      .where(eq(tag.id, canonicalTagId));

    return true;
  });
}
