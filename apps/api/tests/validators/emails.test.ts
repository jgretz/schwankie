import {describe, it, expect} from 'bun:test';
import {bulkUpsertEmailItemsSchema} from '../../src/validators/emails';

const item = {
  messageId: 'msg-1',
  emailFrom: 'Bubbles',
  link: 'https://example.com/story',
};

describe('bulkUpsertEmailItemsSchema', function () {
  // zod strips unknown keys, so an unlisted field is dropped silently between
  // the client and the database.
  it('should carry emailSubject through to the parsed output', function () {
    const subject = 'Today in AI: a very long newsletter subject line';

    const result = bulkUpsertEmailItemsSchema.safeParse({
      items: [{...item, emailSubject: subject}],
    });

    expect(result.success).toBe(true);
    expect(result.data!.items[0]!.emailSubject).toBe(subject);
  });

  it('should accept an item with no emailSubject', function () {
    const result = bulkUpsertEmailItemsSchema.safeParse({items: [item]});

    expect(result.success).toBe(true);
    expect(result.data!.items[0]!.emailSubject).toBeUndefined();
  });

  it('should reject a non-string emailSubject', function () {
    const result = bulkUpsertEmailItemsSchema.safeParse({items: [{...item, emailSubject: 42}]});

    expect(result.success).toBe(false);
  });
});
