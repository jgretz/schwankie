import {describe, expect, it} from 'bun:test';
import {computeHeuristicScore} from '../../src/jobs/score-links';

describe('computeHeuristicScore', function () {
  it('should score 0 for bare URL title, no description, no tags, no content', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: null,
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(0);
  });

  it('should score 10 for non-URL title only', function () {
    const link = {
      title: 'Example Article',
      description: null,
      content: null,
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(10);
  });

  it('should score correctly for bare URL with description, tag, and short content', function () {
    const link = {
      title: 'http://example.com',
      description: 'good description',
      content: 'some content',
      tags: [{id: 1, text: 'tag'}],
    };
    expect(computeHeuristicScore(link)).toBe(15 + 10 + 10);
  });

  it('should score 15 for description only', function () {
    const link = {
      title: 'http://example.com',
      description: 'good description',
      content: null,
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(15);
  });

  it('should score 10 for one tag', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: null,
      tags: [{id: 1, text: 'tag1'}],
    };
    expect(computeHeuristicScore(link)).toBe(10);
  });

  it('should score 15 for three or more tags', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: null,
      tags: [
        {id: 1, text: 'tag1'},
        {id: 2, text: 'tag2'},
        {id: 3, text: 'tag3'},
      ],
    };
    expect(computeHeuristicScore(link)).toBe(10 + 5);
  });

  it('should score 10 for short content (< 500 chars)', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: 'short content',
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(10);
  });

  it('should score 15 for medium content (501-2000 chars)', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: 'a'.repeat(600),
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(10 + 5);
  });

  it('should score 20 for long content (> 2000 chars)', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: 'a'.repeat(2500),
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(10 + 5 + 5);
  });

  it('should cap score at 60 for fully-loaded link', function () {
    const link = {
      title: 'Example Article',
      description: 'good description',
      content: 'a'.repeat(2500),
      tags: [
        {id: 1, text: 'tag1'},
        {id: 2, text: 'tag2'},
        {id: 3, text: 'tag3'},
      ],
    };
    const expectedScore = 10 + 15 + 15 + 20;
    expect(computeHeuristicScore(link)).toBe(Math.min(expectedScore, 60));
    expect(computeHeuristicScore(link)).toBe(60);
  });

  it('should score 35 for title + description + 2 tags + no content', function () {
    const link = {
      title: 'Example Article',
      description: 'good description',
      content: null,
      tags: [
        {id: 1, text: 'tag1'},
        {id: 2, text: 'tag2'},
      ],
    };
    expect(computeHeuristicScore(link)).toBe(10 + 15 + 10);
  });

  it('should score 50 for everything but bare URL title', function () {
    const link = {
      title: 'http://example.com',
      description: 'good description',
      content: 'a'.repeat(2500),
      tags: [
        {id: 1, text: 'tag1'},
        {id: 2, text: 'tag2'},
        {id: 3, text: 'tag3'},
      ],
    };
    const expectedScore = 0 + 15 + 15 + 20;
    expect(computeHeuristicScore(link)).toBe(expectedScore);
    expect(computeHeuristicScore(link)).toBe(50);
  });

  it('should handle exactly 500 chars as short content', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: 'a'.repeat(500),
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(10);
  });

  it('should handle exactly 2000 chars as medium content', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: 'a'.repeat(2000),
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(10 + 5);
  });

  it('should handle exactly 501 chars as medium content', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: 'a'.repeat(501),
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(10 + 5);
  });

  it('should handle exactly 2001 chars as long content', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: 'a'.repeat(2001),
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(10 + 5 + 5);
  });

  it('should handle two tags correctly (only one bonus)', function () {
    const link = {
      title: 'http://example.com',
      description: null,
      content: null,
      tags: [
        {id: 1, text: 'tag1'},
        {id: 2, text: 'tag2'},
      ],
    };
    expect(computeHeuristicScore(link)).toBe(10);
  });

  it('should not score title bonus for https URLs', function () {
    const link = {
      title: 'https://example.com',
      description: null,
      content: null,
      tags: [],
    };
    expect(computeHeuristicScore(link)).toBe(0);
  });
});
