import {link, linkEmbedding} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';

export type UpsertLinkEmbeddingInput = {
  linkId: number;
  embedding: number[];
  model: string;
};

export async function upsertLinkEmbedding(input: UpsertLinkEmbeddingInput): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .insert(linkEmbedding)
      .values({
        linkId: input.linkId,
        embedding: input.embedding,
        model: input.model,
        computedAt: now,
      })
      .onConflictDoUpdate({
        target: linkEmbedding.linkId,
        set: {
          embedding: input.embedding,
          model: input.model,
          computedAt: now,
        },
      });
    await tx
      .update(link)
      .set({embeddingFailCount: 0, embeddingLastError: null})
      .where(eq(link.id, input.linkId));
  });
}
