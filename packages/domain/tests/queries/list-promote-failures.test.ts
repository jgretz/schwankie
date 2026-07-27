import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {recordPromoteFailure} from '../../src/commands/record-promote-failure';
import {listPromoteFailures} from '../../src/queries/list-promote-failures';
import type {PromoteFailureSource} from 'database';

function makeFailure(source: PromoteFailureSource, sourceItemId: string) {
  return recordPromoteFailure({source, sourceItemId, errorMessage: `${sourceItemId} failed`});
}

describe('listPromoteFailures', function () {
  setupDb();

  it('should return the newest failure first', async function () {
    await makeFailure('rss', 'older');
    await makeFailure('rss', 'newer');

    const result = await listPromoteFailures({limit: 10, offset: 0});

    expect(result.items[0]!.sourceItemId).toBe('newer');
    expect(result.items[1]!.sourceItemId).toBe('older');
  });

  it('should return only the matching source when filtered', async function () {
    await makeFailure('rss', 'rss-1');
    await makeFailure('email', 'email-1');

    const result = await listPromoteFailures({limit: 10, offset: 0, source: 'email'});

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.sourceItemId).toBe('email-1');
  });

  it('should scope total to the source filter', async function () {
    await makeFailure('rss', 'rss-1');
    await makeFailure('rss', 'rss-2');
    await makeFailure('email', 'email-1');

    const result = await listPromoteFailures({limit: 10, offset: 0, source: 'rss'});

    expect(result.total).toBe(2);
  });

  it('should page with the unfiltered total across two pages', async function () {
    await makeFailure('rss', 'a');
    await makeFailure('rss', 'b');
    await makeFailure('rss', 'c');

    const page1 = await listPromoteFailures({limit: 2, offset: 0});
    const page2 = await listPromoteFailures({limit: 2, offset: 2});

    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(3);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextOffset).toBe(2);

    expect(page2.items).toHaveLength(1);
    expect(page2.hasMore).toBe(false);
    expect(page2.nextOffset).toBe(3);
  });

  it('should return an empty page when nothing has failed', async function () {
    const result = await listPromoteFailures({limit: 10, offset: 0});

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
