import {describe, it, expect} from 'bun:test';
import {removeLinkFromInfiniteData} from '../../src/services/links-cache';
import {makeInfiniteData, makeLink, makePage} from '../factories';

describe('removeLinkFromInfiniteData', () => {
  it('should remove the matching item from its page', () => {
    const data = makeInfiniteData([
      makePage({items: [makeLink({id: 1}), makeLink({id: 2}), makeLink({id: 3})]}),
    ]);

    const result = removeLinkFromInfiniteData(data, 2);

    const ids = result!.pages[0]!.items.map((item) => item.id);
    expect(ids).toEqual([1, 3]);
  });

  it('should be a no-op when the id is absent', () => {
    const data = makeInfiniteData([makePage({items: [makeLink({id: 1}), makeLink({id: 2})]})]);

    const result = removeLinkFromInfiniteData(data, 99);

    const ids = result!.pages[0]!.items.map((item) => item.id);
    expect(ids).toEqual([1, 2]);
  });

  it('should remove from the correct page in multi-page data', () => {
    const data = makeInfiniteData([
      makePage({items: [makeLink({id: 1}), makeLink({id: 2})], hasMore: true, nextOffset: 25}),
      makePage({items: [makeLink({id: 3}), makeLink({id: 4})]}),
    ]);

    const result = removeLinkFromInfiniteData(data, 3);

    expect(result!.pages[0]!.items.map((i) => i.id)).toEqual([1, 2]);
    expect(result!.pages[1]!.items.map((i) => i.id)).toEqual([4]);
  });

  it('should preserve page count, pageParams, hasMore, and nextOffset', () => {
    const data = makeInfiniteData([
      makePage({items: [makeLink({id: 1}), makeLink({id: 2})], hasMore: true, nextOffset: 25}),
      makePage({items: [makeLink({id: 3})], hasMore: false, nextOffset: 50}),
    ]);

    const result = removeLinkFromInfiniteData(data, 1);

    expect(result!.pages).toHaveLength(2);
    expect(result!.pageParams).toEqual(data.pageParams);
    expect(result!.pages[0]!.hasMore).toBe(true);
    expect(result!.pages[0]!.nextOffset).toBe(25);
    expect(result!.pages[1]!.hasMore).toBe(false);
    expect(result!.pages[1]!.nextOffset).toBe(50);
  });

  it('should return undefined for undefined input', () => {
    expect(removeLinkFromInfiniteData(undefined, 1)).toBeUndefined();
  });
});
