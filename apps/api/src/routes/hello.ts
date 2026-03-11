import {Hono} from 'hono';

export const helloRoutes = new Hono();

helloRoutes.get('/', (c) => c.json({message: 'Hello from schwankie API'}));
