import {Elysia, t} from 'elysia';
import {markAsRead} from '../services/markAsRead';
import {markAsClicked} from '../services/markAsClicked';
import {importLatestFromAllFeeds} from '../services/feedImport/importLatestFromAllFeeds';
import {importLatestFromFeedById} from '../services/feedImport/importLatestFromFeed';

export const PostApi = new Elysia()
  .post('/importLatestFromAllFeeds', async function () {
    return await importLatestFromAllFeeds();
  })
  .post(
    'importLatestFromFeed',
    async function ({body: {id}}) {
      return await importLatestFromFeedById(id);
    },
    {
      body: t.Object({
        id: t.Number(),
      }),
    },
  )
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
