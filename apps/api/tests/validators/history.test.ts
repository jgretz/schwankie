import {describe, it, expect} from 'bun:test';
import {searchHistorySchema} from '../../src/validators/history';

describe('searchHistorySchema', function () {
  it('should trim the description and default the window to 30 days', function () {
    const result = searchHistorySchema.safeParse({q: '  local llm box  '});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({q: 'local llm box', days: 30});
  });

  it('should accept each supported window as a number', function () {
    for (const days of ['7', '30', '90']) {
      const result = searchHistorySchema.safeParse({q: 'local llm box', days});

      expect(result.success).toBe(true);
      expect(result.data!.days).toBe(Number(days));
    }
  });

  it('should reject an unsupported window', function () {
    const result = searchHistorySchema.safeParse({q: 'local llm box', days: '14'});

    expect(result.success).toBe(false);
  });

  it('should reject a description shorter than three characters after trimming', function () {
    const result = searchHistorySchema.safeParse({q: '  ab  '});

    expect(result.success).toBe(false);
  });

  it('should reject a description longer than 300 characters', function () {
    const result = searchHistorySchema.safeParse({q: 'a'.repeat(301)});

    expect(result.success).toBe(false);
  });

  it('should reject a missing description', function () {
    const result = searchHistorySchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
