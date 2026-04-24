import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {deleteLinks} from '../../src/commands/delete-links';
import {getLink} from '../../src/queries/get-link';

describe('deleteLinks', function () {
  setupDb();

  it('should delete multiple links and return the count', async function () {
    const a = await makeLink();
    const b = await makeLink();
    const c = await makeLink();

    const count = await deleteLinks([a.id, b.id, c.id]);

    expect(count).toBe(3);
    expect(await getLink(a.id)).toBeNull();
    expect(await getLink(b.id)).toBeNull();
    expect(await getLink(c.id)).toBeNull();
  });

  it('should return 0 for an empty array without hitting the db', async function () {
    const count = await deleteLinks([]);

    expect(count).toBe(0);
  });

  it('should not throw and should return 0 for non-existent ids', async function () {
    const count = await deleteLinks([999999, 999998]);

    expect(count).toBe(0);
  });

  it('should delete only the matched ids', async function () {
    const keeper = await makeLink();
    const gone = await makeLink();

    const count = await deleteLinks([gone.id]);

    expect(count).toBe(1);
    expect(await getLink(keeper.id)).not.toBeNull();
    expect(await getLink(gone.id)).toBeNull();
  });
});
