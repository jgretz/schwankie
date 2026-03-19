import {describe, it, expect} from 'bun:test';
import {Hono} from 'hono';
import {healthRoutes} from '../../src/routes/health';

function makeApp(): Hono {
  const app = new Hono();
  app.route('/', healthRoutes);
  return app;
}

describe('GET /ping', function () {
  it('should return 200 with alive: true', async function () {
    const app = makeApp();
    const res = await app.request('/ping');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({alive: true});
  });
});
