import {describe, expect, it, beforeEach, afterEach} from 'bun:test';
import {z} from 'zod';
import {parseEnv} from '../src/index';

describe('parseEnv', function () {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(function () {
    savedEnv.FOO = process.env.FOO;
    savedEnv.PORT = process.env.PORT;
    savedEnv.REQUIRED_VAR = process.env.REQUIRED_VAR;
    savedEnv.KEEP = process.env.KEEP;
    savedEnv.EXTRA = process.env.EXTRA;
    savedEnv.NUM = process.env.NUM;
    savedEnv.OPT = process.env.OPT;
  });

  afterEach(function () {
    Object.entries(savedEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('should parse valid environment variables and return typed data', function () {
    process.env.FOO = 'bar';
    process.env.PORT = '3000';

    const result = parseEnv(z.object({FOO: z.string(), PORT: z.string()}));

    expect(result).toEqual({FOO: 'bar', PORT: '3000'});
  });

  it('should throw with message when required variable is missing', function () {
    delete process.env.REQUIRED_VAR;

    const schema = z.object({REQUIRED_VAR: z.string()});

    expect(() => {
      parseEnv(schema);
    }).toThrow();

    let thrownMessage = '';
    try {
      parseEnv(schema);
    } catch (error) {
      if (error instanceof Error) {
        thrownMessage = error.message;
      }
    }

    expect(thrownMessage).toContain('Invalid environment variables');
  });

  it('should ignore extra environment variables not in schema', function () {
    process.env.KEEP = 'yes';
    process.env.EXTRA = 'ignore';

    const result = parseEnv(z.object({KEEP: z.string()}));

    expect(result).toEqual({KEEP: 'yes'});
    expect(result).not.toHaveProperty('EXTRA');
  });

  it('should apply Zod coercion transforms', function () {
    process.env.NUM = '42';

    const result = parseEnv(z.object({NUM: z.coerce.number()}));

    expect(result).toEqual({NUM: 42});
    expect(typeof result.NUM).toBe('number');
  });

  it('should fill missing variables with Zod default values', function () {
    delete process.env.OPT;

    const result = parseEnv(z.object({OPT: z.string().default('fallback')}));

    expect(result).toEqual({OPT: 'fallback'});
  });
});
