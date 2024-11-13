import {Elysia} from 'elysia';
import {refreshFeeds} from '../services/refreshFeeds';

export const PostApi = new Elysia().post('/refresh', async function () {
  return await refreshFeeds();
});
