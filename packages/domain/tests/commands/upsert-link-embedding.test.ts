import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {upsertLinkEmbedding} from '../../src/commands/upsert-link-embedding';
import {store} from '../helpers/mock-db';

describe('upsertLinkEmbedding', function () {
  setupDb();

  it('inserts a row on first call', async function () {
    const link = await makeLink({title: 'Embed me'});

    await upsertLinkEmbedding({
      linkId: link.id,
      embedding: [0.1, 0.2, 0.3],
      model: 'nomic-embed-text',
    });

    const rows = store.linkEmbeddings.filter((e) => e.linkId === link.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.model).toBe('nomic-embed-text');
    expect(rows[0]!.embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it('is idempotent — upserting the same link updates in place', async function () {
    const link = await makeLink({title: 'Embed me twice'});

    await upsertLinkEmbedding({
      linkId: link.id,
      embedding: [1, 2, 3],
      model: 'nomic-embed-text',
    });
    await upsertLinkEmbedding({
      linkId: link.id,
      embedding: [4, 5, 6],
      model: 'nomic-embed-text',
    });

    const rows = store.linkEmbeddings.filter((e) => e.linkId === link.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.embedding).toEqual([4, 5, 6]);
  });

  it('updates the model when it changes', async function () {
    const link = await makeLink({title: 'Switch model'});

    await upsertLinkEmbedding({linkId: link.id, embedding: [0], model: 'old-model'});
    await upsertLinkEmbedding({linkId: link.id, embedding: [1], model: 'new-model'});

    const rows = store.linkEmbeddings.filter((e) => e.linkId === link.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.model).toBe('new-model');
  });
});
