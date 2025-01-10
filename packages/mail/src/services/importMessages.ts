import {getUnreadRSSEmails} from './import/getUnreadRssEmails';
import {parseGoogleEmail} from './import/parseGoogleEmail';

export async function importMessages() {
  const {messageIds, messages} = await getUnreadRSSEmails();
  const parsedMessages = await Promise.all(messages.map(parseGoogleEmail));

  return messages;
}
