import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';
import {getEmailItem} from '../../src/queries/get-email-item';

describe('getEmailItem', function () {
  setupDb();

  it('should get email item by id', async function () {
    const created = await makeEmailItem({
      emailMessageId: 'msg-get-test',
      emailFrom: 'test@example.com',
      link: 'https://example.com',
      title: 'Test Title',
    });

    const found = await getEmailItem(created!.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created!.id);
    expect(found!.emailMessageId).toBe('msg-get-test');
    expect(found!.title).toBe('Test Title');
  });

  it('should return null for non-existent item', async function () {
    const result = await getEmailItem('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});
