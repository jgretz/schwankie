import {describe, expect, it} from 'bun:test';
import {buildEmailItems} from '../../src/jobs/import-email-message';

const LINK = {url: 'https://example.com/story', title: 'Story', description: 'A story'};
const LONG_SUBJECT =
  'Today in AI: a very long newsletter subject line that runs well past 25 chars';

describe('buildEmailItems', function () {
  it('stores the display name as the sender and the full subject separately', function () {
    const [item] = buildEmailItems(
      {from: 'Bubbles <hi@bubbles.example>', subject: LONG_SUBJECT},
      'msg-1',
      [LINK],
    );

    expect(item!.emailFrom).toBe('Bubbles');
    expect(item!.emailSubject).toBe(LONG_SUBJECT);
    expect(item!.emailSubject!.length).toBe(LONG_SUBJECT.length);
  });

  it('uses the bare address when the header has no display name', function () {
    const [item] = buildEmailItems({from: 'hi@bubbles.example', subject: 'Hi'}, 'msg-1', [LINK]);

    expect(item!.emailFrom).toBe('hi@bubbles.example');
  });

  it('strips angle brackets when the header is address-only', function () {
    const [item] = buildEmailItems({from: '<hi@bubbles.example>', subject: 'Hi'}, 'msg-1', [LINK]);

    expect(item!.emailFrom).toBe('hi@bubbles.example');
  });

  it('leaves the subject undefined when the header is empty or whitespace', function () {
    const [empty] = buildEmailItems({from: 'Bubbles <hi@bubbles.example>', subject: ''}, 'm', [
      LINK,
    ]);
    const [blank] = buildEmailItems({from: 'Bubbles <hi@bubbles.example>', subject: '   '}, 'm', [
      LINK,
    ]);

    expect(empty!.emailSubject).toBeUndefined();
    expect(blank!.emailSubject).toBeUndefined();
  });

  it('trims the subject and carries link fields onto every item', function () {
    const items = buildEmailItems(
      {from: 'Bubbles <hi@bubbles.example>', subject: '  Weekly digest  '},
      'msg-7',
      [LINK, {url: 'https://example.com/other'}],
    );

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.emailSubject)).toEqual(['Weekly digest', 'Weekly digest']);
    expect(items[0]).toMatchObject({
      messageId: 'msg-7',
      link: 'https://example.com/story',
      title: 'Story',
      description: 'A story',
    });
    expect(items[1]!.title).toBeUndefined();
  });
});
