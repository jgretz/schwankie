import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {deleteLink} from '../../src/commands/delete-link';

describe('deleteLink', function () {
  setupDb();

  it('should delete an existing link', async function () {
    const created = await makeLink();

    const result = await deleteLink(created.id);

    expect(result).toBe(true);
  });

  it('should return false for non-existent link', async function () {
    const result = await deleteLink(999999);

    expect(result).toBe(false);
  });
});
