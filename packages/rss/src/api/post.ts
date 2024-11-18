import {Elysia, t} from 'elysia';
import {refreshFeeds} from '../services/refreshFeeds';
import {markAsRead} from '../services/markAsRead';
import {markAsClicked} from '../services/markAsClicked';

export const PostApi = new Elysia()
  .post('/refresh', async function () {
    return await refreshFeeds();
  })
  .post(
    '/markAsRead',
    async function ({body: {mostRecentId}}) {
      return await markAsRead(mostRecentId);
    },
    {
      body: t.Object({
        mostRecentId: t.Number(),
      }),
    },
  )
  .post(
    '/markAsClicked',
    async ({body: {id}}) => {
      return await markAsClicked(id);
    },
    {
      body: t.Object({
        id: t.Number(),
      }),
    },
  );
