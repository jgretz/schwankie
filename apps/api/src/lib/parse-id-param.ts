import type {Context} from 'hono';

export function parseIdParam(c: Context): number | null {
  const id = Number(c.req.param('id'));
  return Number.isNaN(id) ? null : id;
}
