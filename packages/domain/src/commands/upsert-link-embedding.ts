import {linkEmbedding} from 'database';
import {getDb} from '../db';

export type UpsertLinkEmbeddingInput = {
  linkId: number;
  embedding: number[];
  model: string;
};

export async function upsertLinkEmbedding(input: UpsertLinkEmbeddingInput): Promise<void> {
  const db = getDb();
  await db
    .insert(linkEmbedding)
    .values({
      linkId: input.linkId,
      embedding: input.embedding,
      model: input.model,
      computedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: linkEmbedding.linkId,
      set: {
        embedding: input.embedding,
        model: input.model,
        computedAt: new Date(),
      },
    });
}
