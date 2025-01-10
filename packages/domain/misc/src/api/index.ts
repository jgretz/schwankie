import {Elysia, t} from 'elysia';
import type {Google} from '../Types';
import {googleQuery} from '../queries';
import {updateGoogle} from '../commands';

export const Api = new Elysia({prefix: 'misc'})
  .get('/google', async function (): Promise<Google> {
    const google = await googleQuery();
    if (!google) {
      throw new Error('Google Access not found');
    }

    return google;
  })
  .post(
    '/google',
    async function ({body: {email, tokens}}): Promise<void> {
      await updateGoogle(email, tokens);
    },
    {
      body: t.Object({
        email: t.String(),
        tokens: t.String(),
      }),
    },
  );
