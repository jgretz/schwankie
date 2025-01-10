import {InjectIn} from 'injectx';
import type {MailDomainDependencies} from '../../Types';

export const markEmailsAsRead = InjectIn(function ({gmail, userId}: MailDomainDependencies) {
  return async function (messageIds: string[]) {
    gmail.users.messages.batchModify({
      userId,
      requestBody: {ids: messageIds, removeLabelIds: ['UNREAD']},
    });
  };
});
