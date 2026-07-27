import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';
import {promoteEmailItem} from '../../src/commands/promote-email-item';
import {getEmailItem} from '../../src/queries/get-email-item';
import {getLink} from '../../src/queries/get-link';
import {DomainValidationError, NotFoundError} from '../../src/lib/errors';

const ELLIPSIS = '…';

function repeat(char: string, count: number): string {
  return Array.from({length: count}, () => char).join('');
}

function codePoints(value: string): number {
  return Array.from(value).length;
}

describe('promoteEmailItem', function () {
  setupDb();

  it('should promote email item to link', async function () {
    const item = await makeEmailItem({
      title: 'Promoted Article',
      description: 'Article description',
    });

    const link = await promoteEmailItem(item!.id);
    expect(link).not.toBeNull();
    expect(link.url).toBe(item!.link);
    expect(link.title).toBe('Promoted Article');
    expect(link.description).toBe('Article description');
    expect(link.status).toBe('queued');
  });

  it('should use link as title if not provided', async function () {
    const item = await makeEmailItem({
      link: 'https://example.com/article',
      title: undefined,
    });

    const link = await promoteEmailItem(item!.id);
    expect(link.title).toBe('https://example.com/article');
  });

  it('should mark email item as clicked', async function () {
    const item = await makeEmailItem();
    expect(item!.clicked).toBe(false);

    await promoteEmailItem(item!.id);

    const updated = await getEmailItem(item!.id);
    expect(updated!.clicked).toBe(true);
  });

  it('should throw NotFoundError for non-existent item', async function () {
    let caught: unknown;
    try {
      await promoteEmailItem('00000000-0000-0000-0000-000000000000');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(NotFoundError);
  });

  describe('destination column bounds', function () {
    it('should truncate an over-long title to 500 code points', async function () {
      const item = await makeEmailItem({title: repeat('a', 900)});

      const link = await promoteEmailItem(item!.id);
      const stored = await getLink(link.id);

      expect(codePoints(stored!.title)).toBe(500);
      expect(stored!.title.endsWith(ELLIPSIS)).toBe(true);
    });

    it('should truncate an over-long description to 800 code points', async function () {
      const item = await makeEmailItem({description: repeat('a', 5000)});

      const link = await promoteEmailItem(item!.id);
      const stored = await getLink(link.id);

      expect(codePoints(stored!.description!)).toBe(800);
      expect(stored!.description!.endsWith(ELLIPSIS)).toBe(true);
    });

    it('should throw DomainValidationError for an over-long link', async function () {
      const item = await makeEmailItem({link: `https://example.com/${repeat('a', 2100)}`});

      let caught: unknown;
      try {
        await promoteEmailItem(item!.id);
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(DomainValidationError);
      expect((caught as DomainValidationError).field).toBe('url');
    });
  });
});
