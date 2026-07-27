import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';
import {markAllEmailItemsRead} from '../../src/commands/mark-all-email-items-read';
import {getEmailItem} from '../../src/queries/get-email-item';

describe('markAllEmailItemsRead', function () {
  setupDb();

  it('should mark every item from one sender read and leave other senders alone', async function () {
    await makeEmailItem({emailFrom: 'Bubbles', emailSubject: 'Monday issue'});
    await makeEmailItem({emailFrom: 'Bubbles', emailSubject: 'Tuesday issue'});
    await makeEmailItem({emailFrom: 'Bubbles', emailSubject: 'Wednesday issue'});
    const other = await makeEmailItem({emailFrom: 'Frothy', emailSubject: 'Monday issue'});

    const count = await markAllEmailItemsRead({from: 'Bubbles'});

    expect(count).toBe(3);
    expect((await getEmailItem(other!.id))!.read).toBe(false);
  });

  it('should mark every unread item read when no sender is given', async function () {
    await makeEmailItem({emailFrom: 'Bubbles'});
    await makeEmailItem({emailFrom: 'Frothy'});

    const count = await markAllEmailItemsRead({});

    expect(count).toBe(2);
  });

  it('should return zero when there is nothing unread', async function () {
    await makeEmailItem({emailFrom: 'Bubbles'});
    await markAllEmailItemsRead({from: 'Bubbles'});

    expect(await markAllEmailItemsRead({from: 'Bubbles'})).toBe(0);
  });
});
