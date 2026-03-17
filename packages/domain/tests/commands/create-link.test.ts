import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeLink} from '../helpers/factory';

describe('createLink', function () {
  setupDb();

  it('should create a link with no tags', async function () {
    const result = await makeLink({url: 'https://example.com', title: 'Example'});

    expect(result.url).toBe('https://example.com');
    expect(result.title).toBe('Example');
    expect(result.status).toBe('saved');
    expect(result.tags).toEqual([]);
    expect(result.id).toBeGreaterThan(0);
  });

  it('should create a link with tags', async function () {
    const result = await makeLink({
      url: 'https://example.com',
      title: 'Example',
      tags: ['test-javascript', 'test-web-dev'],
    });

    expect(result.tags).toHaveLength(2);
    const tagTexts = result.tags.map((t) => t.text).sort();
    expect(tagTexts).toEqual(['test-javascript', 'test-web-dev']);
  });

  it('should normalize and deduplicate tags', async function () {
    const result = await makeLink({
      url: 'https://example.com',
      title: 'Example',
      tags: ['Test-Unique-A', '  test-unique-a  ', 'Test Unique B'],
    });

    const tagTexts = result.tags.map((t) => t.text).sort();
    expect(tagTexts).toEqual(['test-unique-a', 'test-unique-b']);
  });

  it('should use queued status when specified', async function () {
    const result = await makeLink({status: 'queued'});

    expect(result.status).toBe('queued');
  });

  it('should set optional fields', async function () {
    const result = await makeLink({
      title: 'Example',
      description: 'A description',
      imageUrl: 'https://example.com/image.png',
    });

    expect(result.description).toBe('A description');
    expect(result.imageUrl).toBe('https://example.com/image.png');
  });

  it('should reuse existing tags', async function () {
    const first = await makeLink({title: 'First', tags: ['shared-tag']});
    const second = await makeLink({title: 'Second', tags: ['shared-tag']});

    expect(first.tags[0]!.id).toBe(second.tags[0]!.id);
  });
});
