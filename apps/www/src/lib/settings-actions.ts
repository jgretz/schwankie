import {createServerFn} from '@tanstack/react-start';
import {z} from 'zod';
import {getClient, requireAuth} from './server-helpers';

const setSettingInput = z.object({key: z.string(), value: z.string()});

export const setSettingAction = createServerFn({method: 'POST'})
  .inputValidator(setSettingInput)
  .handler(async ({data}) => {
    await getClient();
    await requireAuth();
    const {setSetting} = await import('client');
    return setSetting(data.key, data.value);
  });
