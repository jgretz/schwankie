import {InjectIn} from 'injectx';
import type {MailDomainDependencies} from '../../Types';

const UNREAD_RSS_QUERY = `label:unread AND label:rss---Newsletters`;

export const getUnreadRSSEmails = InjectIn(function ({gmail, userId}: MailDomainDependencies) {
  return async function () {
    const response = await gmail.users.messages.list({userId, q: UNREAD_RSS_QUERY});
    const messageIds = (response.data.messages?.map((message) => message.id) as string[]) || [];

    const messages = await Promise.all(
      messageIds.map(async function (id) {
        return await gmail.users.messages.get({id, userId});
      }),
    );

    return {
      messageIds,
      messages,
    };
  };
});
