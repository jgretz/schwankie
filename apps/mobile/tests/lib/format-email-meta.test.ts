import {describe, expect, it} from 'bun:test';
import {formatEmailMeta} from '../../src/lib/format-email-meta';

const DATE = 'Jan 5, 2026 @ 9:04 AM';

describe('formatEmailMeta', function () {
  it('should join sender and date with a separator', function () {
    const {meta} = formatEmailMeta({emailFrom: 'Bubbles', emailSubject: null, date: DATE});

    expect(meta).toBe(`Bubbles · ${DATE}`);
  });

  it('should return the date alone when the sender is hidden', function () {
    const {meta} = formatEmailMeta({emailFrom: null, emailSubject: null, date: DATE});

    expect(meta).toBe(DATE);
  });

  it('should return the subject as its own segment', function () {
    const {meta, subject} = formatEmailMeta({
      emailFrom: 'Bubbles',
      emailSubject: 'Weekly digest',
      date: DATE,
    });

    expect(meta).toBe(`Bubbles · ${DATE}`);
    expect(subject).toBe('Weekly digest');
  });

  it('should trim the sender', function () {
    const {meta} = formatEmailMeta({emailFrom: '  Bubbles  ', emailSubject: null, date: DATE});

    expect(meta).toBe(`Bubbles · ${DATE}`);
  });

  it('should trim the subject', function () {
    expect(
      formatEmailMeta({emailFrom: 'Bubbles', emailSubject: '  Weekly digest  ', date: DATE})
        .subject,
    ).toBe('Weekly digest');
  });

  it('should return a null subject for a legacy null-subject row', function () {
    const {meta, subject} = formatEmailMeta({emailFrom: 'Bubbles', emailSubject: null, date: DATE});

    expect(subject).toBeNull();
    expect(meta.endsWith('·')).toBe(false);
    expect(meta.trim()).toBe(meta);
  });

  it('should return a null subject for an empty or whitespace subject', function () {
    expect(
      formatEmailMeta({emailFrom: 'Bubbles', emailSubject: '', date: DATE}).subject,
    ).toBeNull();
    expect(
      formatEmailMeta({emailFrom: 'Bubbles', emailSubject: '   ', date: DATE}).subject,
    ).toBeNull();
  });

  it('should not leave a dangling separator when the sender is blank', function () {
    const {meta} = formatEmailMeta({emailFrom: '   ', emailSubject: null, date: DATE});

    expect(meta).toBe(DATE);
  });
});
