import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {getSetting, setSetting, validateSettingValue, type SettingResponse} from '@domain';
import {updateSettingSchema} from '../validators/settings';

export const settingsRouter = new Hono();
const auth = authMiddleware();

settingsRouter.get('/api/settings/:key', auth, async (c) => {
  const key = c.req.param('key');
  const value = await getSetting(key);

  if (value === null) {
    return c.json({error: 'Setting not found'}, 404);
  }

  return c.json<SettingResponse>({key, value});
});

settingsRouter.put('/api/settings/:key', auth, async (c) => {
  const key = c.req.param('key');

  const parsed = updateSettingSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }

  const validation = validateSettingValue(key, parsed.data.value);
  if (!validation.success) {
    return c.json({error: 'Invalid setting value', details: validation.error}, 400);
  }

  await setSetting(key, parsed.data.value);
  return c.json<SettingResponse>({key, value: parsed.data.value});
});
