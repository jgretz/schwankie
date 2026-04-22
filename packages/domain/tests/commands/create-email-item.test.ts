import {describe, expect, it} from 'bun:test';
import {setupDb} from '../helpers/setup';
import {makeEmailItem} from '../helpers/factory';

describe('createEmailItem', function () {
  setupDb();

  it('should create email item with required fields', async function () {
    const result = await makeEmailItem({
      emailMessageId: 'msg-123',
      emailFrom: 'sender@example.com',
      link: 'https://example.com',
    });

    expect(result).not.toBeNull();
    expect(result!.emailMessageId).toBe('msg-123');
    expect(result!.emailFrom).toBe('sender@example.com');
    expect(result!.link).toBe('https://example.com');
    expect(result!.read).toBe(false);
    expect(result!.clicked).toBe(false);
    expect(result!.id).toBeDefined();
  });

  it('should create email item with optional fields', async function () {
    const result = await makeEmailItem({
      emailMessageId: 'msg-456',
      emailFrom: 'sender@example.com',
      link: 'https://example.com',
      title: 'Test Article',
      description: 'A test article description',
    });

    expect(result!.title).toBe('Test Article');
    expect(result!.description).toBe('A test article description');
  });

  it('should handle onConflictDoNothing for duplicate (email_message_id, link)', async function () {
    const first = await makeEmailItem({
      emailMessageId: 'msg-conflict',
      emailFrom: 'sender1@example.com',
      link: 'https://example.com',
    });

    const second = await makeEmailItem({
      emailMessageId: 'msg-conflict',
      emailFrom: 'sender2@example.com',
      link: 'https://example.com',
    });

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(first!.emailFrom).toBe('sender1@example.com');
  });

  it('should allow same message with different link', async function () {
    const first = await makeEmailItem({
      emailMessageId: 'msg-same',
      emailFrom: 'sender@example.com',
      link: 'https://example.com/1',
    });

    const second = await makeEmailItem({
      emailMessageId: 'msg-same',
      emailFrom: 'sender@example.com',
      link: 'https://example.com/2',
    });

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first!.id).not.toBe(second!.id);
  });
});
