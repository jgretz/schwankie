import {Hono} from 'hono';

export const healthRoutes = new Hono();

healthRoutes.get('/ping', (c) => c.json({alive: true}));
