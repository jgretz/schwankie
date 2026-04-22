import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';
import {promoteEmailItem} from '../../src/commands/promote-email-item';
import {getEmailItem} from '../../src/queries/get-email-item';
import {getLink} from '../../src/queries/get-link';

describe('promoteEmailItem', function () {
  setupDb();

  it('should promote email item to link', async function () {
    const item = await makeEmailItem({
      title: 'Promoted Article',
      description: 'Article description',
    });

    const linkId = await promoteEmailItem(item!.id);
    expect(linkId).toBeGreaterThan(0);

    const link = await getLink(linkId);
    expect(link).not.toBeNull();
    expect(link!.url).toBe(item!.link);
    expect(link!.title).toBe('Promoted Article');
    expect(link!.description).toBe('Article description');
    expect(link!.status).toBe('queued');
  });

  it('should use link as title if not provided', async function () {
    const item = await makeEmailItem({
      link: 'https://example.com/article',
      title: undefined,
    });

    const linkId = await promoteEmailItem(item!.id);
    const link = await getLink(linkId);
    expect(link!.title).toBe('https://example.com/article');
  });

  it('should mark email item as clicked', async function () {
    const item = await makeEmailItem();
    expect(item!.clicked).toBe(false);

    await promoteEmailItem(item!.id);

    const updated = await getEmailItem(item!.id);
    expect(updated!.clicked).toBe(true);
  });

  it('should throw for non-existent item', async function () {
    expect(async () => {
      await promoteEmailItem('00000000-0000-0000-0000-000000000000');
    }).toThrow();
  });
});
