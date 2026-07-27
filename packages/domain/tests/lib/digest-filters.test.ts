import {describe, expect, it} from 'bun:test';
import {
  dedupeByUrl,
  filterDigestItems,
  isDealTitle,
  isDealUrl,
  isFiller,
  isPuzzleTitle,
} from '../../src/lib/digest-filters';

describe('isPuzzleTitle', function () {
  it('should flag the daily puzzle posts', function () {
    expect(isPuzzleTitle('Wordle today: answer for July 27')).toBe(true);
    expect(isPuzzleTitle('NYT Connections hints and answers')).toBe(true);
    expect(isPuzzleTitle('Strands: today’s theme')).toBe(true);
    expect(isPuzzleTitle('Quordle answers for Sunday')).toBe(true);
  });

  it('should not flag real articles that merely sound similar', function () {
    expect(isPuzzleTitle('The connections between rate cuts and housing')).toBe(false);
    expect(isPuzzleTitle('A new word processor for the terminal')).toBe(false);
  });
});

describe('isDealTitle', function () {
  it('should flag retail copy', function () {
    expect(isDealTitle('Save $200 on this OLED monitor')).toBe(true);
    expect(isDealTitle('Grab 40% off a year of storage')).toBe(true);
    expect(isDealTitle('The best Black Friday tech deals')).toBe(true);
  });

  it('should not flag articles about prices or money generally', function () {
    expect(isDealTitle('Why GPU prices are falling')).toBe(false);
    expect(isDealTitle('Anthropic raises funding round')).toBe(false);
  });
});

describe('isDealUrl', function () {
  it('should flag dated deal-roundup slugs', function () {
    expect(isDealUrl('https://mashable.com/article/july-27-deals-roundup')).toBe(true);
    expect(isDealUrl('https://example.com/deals/best-headphones')).toBe(true);
  });

  it('should not flag ordinary article urls', function () {
    expect(isDealUrl('https://example.com/2026/07/27/an-actual-article')).toBe(false);
    expect(isDealUrl('https://example.com/idealism-in-software')).toBe(false);
  });
});

describe('isFiller', function () {
  it('should combine the title and url rules', function () {
    expect(isFiller({title: 'Wordle today', url: 'https://example.com/a'})).toBe(true);
    expect(isFiller({title: 'A real post', url: 'https://example.com/deals/x'})).toBe(true);
    expect(isFiller({title: 'A real post', url: 'https://example.com/a'})).toBe(false);
  });
});

describe('dedupeByUrl', function () {
  it('should collapse the same article listed by two feeds', function () {
    const items = [
      {title: 'HN: Newest', url: 'https://example.com/post'},
      {title: 'Hacker News', url: 'https://example.com/post/'},
    ];

    const result = dedupeByUrl(items);

    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe('HN: Newest');
  });

  it('should collapse across tracking parameters', function () {
    const items = [
      {title: 'Via feed', url: 'https://example.com/post'},
      {title: 'Via newsletter', url: 'https://example.com/post?utm_source=news&mc_cid=1'},
    ];

    expect(dedupeByUrl(items)).toHaveLength(1);
  });

  it('should keep genuinely different urls', function () {
    const items = [
      {title: 'One', url: 'https://example.com/a'},
      {title: 'Two', url: 'https://example.com/b'},
    ];

    expect(dedupeByUrl(items)).toHaveLength(2);
  });

  it('should keep the first occurrence so callers control precedence', function () {
    const items = [
      {title: 'Preferred', url: 'https://example.com/post'},
      {title: 'Duplicate', url: 'https://example.com/post'},
    ];

    expect(dedupeByUrl(items)[0]!.title).toBe('Preferred');
  });

  it('should return an empty array unchanged', function () {
    expect(dedupeByUrl([])).toEqual([]);
  });
});

describe('filterDigestItems', function () {
  it('should drop filler and then collapse duplicates', function () {
    const items = [
      {title: 'Wordle today', url: 'https://example.com/wordle'},
      {title: 'Save $50 on a keyboard', url: 'https://example.com/kb'},
      {title: 'A real article', url: 'https://example.com/real'},
      {title: 'A real article (repost)', url: 'https://example.com/real/'},
    ];

    const result = filterDigestItems(items);

    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe('A real article');
  });

  it('should not dedupe a filler url into a real one', function () {
    const items = [
      {title: 'Wordle today', url: 'https://example.com/post'},
      {title: 'A real article', url: 'https://example.com/post'},
    ];

    const result = filterDigestItems(items);

    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe('A real article');
  });

  it('should return an empty array when everything is filler', function () {
    const items = [
      {title: 'Wordle today', url: 'https://example.com/a'},
      {title: 'Connections hints', url: 'https://example.com/b'},
    ];

    expect(filterDigestItems(items)).toEqual([]);
  });
});
