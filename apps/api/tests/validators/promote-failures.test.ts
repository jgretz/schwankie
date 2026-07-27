import {describe, it, expect} from 'bun:test';
import {listPromoteFailuresSchema} from '../../src/validators/promote-failures';

// The route hands this raw `c.req.query(...)` values, so absent params arrive
// as `undefined` and present ones always arrive as strings.
describe('listPromoteFailuresSchema', () => {
  it('should default limit and offset when nothing is supplied', () => {
    const result = listPromoteFailuresSchema.safeParse({
      limit: undefined,
      offset: undefined,
      source: undefined,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({limit: 50, offset: 0});
  });

  it('should coerce the string query params to numbers', () => {
    const result = listPromoteFailuresSchema.safeParse({limit: '10', offset: '20'});

    expect(result.data).toMatchObject({limit: 10, offset: 20});
  });

  it('should accept offset=0', () => {
    const result = listPromoteFailuresSchema.safeParse({offset: '0'});

    expect(result.data!.offset).toBe(0);
  });

  it('should reject a non-positive limit', () => {
    expect(listPromoteFailuresSchema.safeParse({limit: '0'}).success).toBe(false);
    expect(listPromoteFailuresSchema.safeParse({limit: '-1'}).success).toBe(false);
  });

  it('should reject a negative offset', () => {
    expect(listPromoteFailuresSchema.safeParse({offset: '-1'}).success).toBe(false);
  });

  it('should reject a fractional limit', () => {
    expect(listPromoteFailuresSchema.safeParse({limit: '1.5'}).success).toBe(false);
  });

  it('should accept each known source', () => {
    expect(listPromoteFailuresSchema.safeParse({source: 'rss'}).data!.source).toBe('rss');
    expect(listPromoteFailuresSchema.safeParse({source: 'email'}).data!.source).toBe('email');
  });

  it('should reject an unknown source', () => {
    expect(listPromoteFailuresSchema.safeParse({source: 'slack'}).success).toBe(false);
  });
});
