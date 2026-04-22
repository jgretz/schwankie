import {createServerFn} from '@tanstack/react-start';

import {getClient, requireAuth} from './server-helpers';

export const triggerRefreshAllFeedsAction = createServerFn({method: 'POST'}).handler(
  async () => {
    await getClient();
    await requireAuth();
    const {triggerRefreshAllFeeds} = await import('client');
    return triggerRefreshAllFeeds();
  },
);

export const triggerRefreshEmailsAction = createServerFn({method: 'POST'}).handler(
  async () => {
    await getClient();
    await requireAuth();
    const {triggerRefreshEmails} = await import('client');
    return triggerRefreshEmails();
  },
);
