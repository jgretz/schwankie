import type {Database} from 'database';
import {linkTag, tag, tagAlias} from 'database';
import {eq, sql} from 'drizzle-orm';

type MergeTagInput = {aliasTagId: number; canonicalTagId: number};

export async function mergeTag(db: Database, input: MergeTagInput): Promise<boolean> {
  const {aliasTagId, canonicalTagId} = input;

  return db.transaction(async (tx) => {
    // Verify both tags exist
    const [aliasRow] = await tx
      .select({id: tag.id, text: tag.text})
      .from(tag)
      .where(eq(tag.id, aliasTagId));
    const [canonicalRow] = await tx
      .select({id: tag.id})
      .from(tag)
      .where(eq(tag.id, canonicalTagId));
    if (!aliasRow || !canonicalRow) return false;

    // Move link_tag rows from alias to canonical, handling duplicates
    // Delete link_tag rows where the link already has the canonical tag
    await tx.execute(sql`
      DELETE FROM ${linkTag}
      WHERE ${linkTag.tagId} = ${aliasTagId}
        AND ${linkTag.linkId} IN (
          SELECT ${linkTag.linkId} FROM ${linkTag} WHERE ${linkTag.tagId} = ${canonicalTagId}
        )
    `);

    // Update remaining alias link_tag rows to point to canonical
    await tx.update(linkTag).set({tagId: canonicalTagId}).where(eq(linkTag.tagId, aliasTagId));

    // Record the alias
    await tx.insert(tagAlias).values({
      aliasText: aliasRow.text,
      canonicalTagId,
      source: 'ollama',
    });

    // Delete the alias tag
    await tx.delete(tag).where(eq(tag.id, aliasTagId));

    // Mark canonical tag as normalized
    await tx
      .update(tag)
      .set({normalizedAt: sql`now()`})
      .where(eq(tag.id, canonicalTagId));

    return true;
  });
}
