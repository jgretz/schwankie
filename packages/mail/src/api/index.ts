import Elysia from 'elysia';
import {importMessages} from '../services';

export const Api = new Elysia({prefix: 'mail'}).post('/importMessages', async () => {
  const messages = await importMessages();

  return messages;
});
