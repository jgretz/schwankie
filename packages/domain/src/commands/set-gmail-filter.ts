import {setSetting} from './set-setting';

export async function setGmailFilter(query: string): Promise<void> {
  await setSetting('gmail_filter', query);
}
