import type PgBoss from 'pg-boss';
import {getGmailTokens, getSetting, setSetting} from 'client';
import {GmailClient} from '../utils/gmail-client';

export function createScheduleImportEmailsHandler(boss: PgBoss): PgBoss.WorkHandler<unknown> {
  return async () => {
    try {
      let tokens: Awaited<ReturnType<typeof getGmailTokens>>;
      try {
        tokens = await getGmailTokens();
      } catch (error) {
        if (error instanceof Error && error.message.includes('410')) {
          console.log('[schedule-import-emails] Gmail tokens revoked, skipping');
          return;
        }
        throw error;
      }

      if (!tokens) {
        console.log('[schedule-import-emails] Gmail not connected, skipping');
        return;
      }

      const filterSetting = await getSetting('gmail_filter');
      const filter = filterSetting?.value ?? '';
      const gmail = new GmailClient(tokens.accessToken, tokens.refreshToken || '');
      const messageIds = await gmail.listMessages(filter);

      if (messageIds.length === 0) {
        console.log('[schedule-import-emails] no unread messages');
        return;
      }

      let dispatched = 0;
      for (const messageId of messageIds) {
        const sent = await boss.send(
          'import-email-message',
          {messageId},
          {singletonKey: messageId},
        );
        if (sent) dispatched += 1;
      }

      await setSetting('gmail_last_imported_at', new Date().toISOString());
      console.log(`[schedule-import-emails] dispatched ${dispatched}/${messageIds.length}`);
    } catch (error) {
      console.error('[schedule-import-emails] Failed:', error);
      throw error;
    }
  };
}
