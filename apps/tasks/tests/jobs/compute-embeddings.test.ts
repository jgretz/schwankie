import {describe, expect, it} from 'bun:test';
import {buildInput} from '../../src/jobs/compute-embeddings';

describe('buildInput', function () {
  it('concatenates title, description, and content with blank-line separators', function () {
    const input = buildInput({
      title: 'Hello',
      description: 'world',
      content: 'body text',
    });
    expect(input).toBe('Hello\n\nworld\n\nbody text');
  });

  it('omits null description and content', function () {
    expect(buildInput({title: 'Only title', description: null, content: null})).toBe('Only title');
  });

  it('truncates to the nomic-embed-text context ceiling', function () {
    const long = 'a'.repeat(10_000);
    const input = buildInput({title: 'T', description: null, content: long});
    expect(input.length).toBe(6000);
    expect(input.startsWith('T\n\n')).toBe(true);
  });
});
