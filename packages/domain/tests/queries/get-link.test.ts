import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';
import {getLink} from '../../src/queries/get-link';

describe('getLink', function () {
  setupDb();

  it('should return link with tags when found', async function () {
    const created = await makeLink({title: 'Get Link Test', tags: ['get-link-tag']});

    const result = await getLink(created.id);

    expect(result).toBeDefined();
    expect(result?.id).toBe(created.id);
    expect(result?.title).toBe('Get Link Test');
    expect(result?.tags).toHaveLength(1);
    expect(result?.tags[0]?.text).toBe('get-link-tag');
  });

  it('should return null when link does not exist', async function () {
    const result = await getLink(99999);

    expect(result).toBeNull();
  });

  it('should return empty tags array when link has no tags', async function () {
    const created = await makeLink({title: 'No Tags Link'});

    const result = await getLink(created.id);

    expect(result).toBeDefined();
    expect(result?.id).toBe(created.id);
    expect(result?.tags).toHaveLength(0);
  });
});
