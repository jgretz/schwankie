import type PgBoss from 'pg-boss';
import {
  getSetting,
  setSetting,
  bulkUpsertEmailItems,
  getGmailTokens,
} from 'client';
import {GmailClient, extractDisplayName} from '../utils/gmail-client';
import {
  parseLinksWithScores,
  type ParsedLink,
  type ScoredLink,
  SCORE_KEEP_THRESHOLD,
  SCORE_HIGH_THRESHOLD,
  SCORE_LOW_THRESHOLD,
} from '../utils/email-parser';
import {classifyAmbiguousLinks, type EmailContext} from '../utils/llm-link-classifier';

const CONFIDENCE_THRESHOLD = 0.7;

async function classifyLinks(
  scoredLinks: ScoredLink[],
  emailContext: EmailContext,
  ollamaUrl: string,
  ollamaModel: string,
): Promise<ParsedLink[]> {
  if (!ollamaUrl) {
    // Ollama disabled - use heuristic-only
    return scoredLinks.filter((l) => l.score >= SCORE_KEEP_THRESHOLD);
  }

  const definiteKeep = scoredLinks.filter((l) => l.score >= SCORE_HIGH_THRESHOLD);
  const ambiguous = scoredLinks.filter(
    (l) => l.score >= SCORE_LOW_THRESHOLD && l.score < SCORE_HIGH_THRESHOLD,
  );

  try {
    const classifications = await classifyAmbiguousLinks(ambiguous, emailContext, ollamaUrl, ollamaModel);
    const approved = ambiguous.filter((link, i) => {
      const c = classifications[i];
      if (!c || c.confidence <= CONFIDENCE_THRESHOLD) return link.score >= SCORE_KEEP_THRESHOLD;
      return c.keep;
    });
    return [...definiteKeep, ...approved];
  } catch (error) {
    // Any unexpected error - fall back to heuristic-only
    console.error('Failed to classify links:', error);
    return scoredLinks.filter((l) => l.score >= SCORE_KEEP_THRESHOLD);
  }
}

export async function importEmailsHandler(_jobs: PgBoss.Job[]): Promise<void> {
  console.log('Starting email import job...');

  const startTime = Date.now();
  let emailCount = 0;
  let linkCount = 0;

  try {
    // Fetch tokens via client (handles server-side refresh)
    let tokens;
    try {
      tokens = await getGmailTokens();
    } catch (error) {
      // Check if it's a 410 (token revoked)
      if (error instanceof Error && error.message.includes('410')) {
        console.log('Gmail tokens revoked, skipping import');
        return;
      }
      throw error;
    }

    if (!tokens) {
      console.log('Gmail not connected, skipping import');
      return;
    }

    // Fetch filter from settings
    const filterSetting = await getSetting('gmail_filter');
    const filter = filterSetting?.value ?? '';
    const gmailClient = new GmailClient(tokens.accessToken, tokens.refreshToken || '');

    // Get Ollama config from env
    const ollamaUrl = process.env.OLLAMA_URL || '';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';

    // List unread messages
    const messageIds = await gmailClient.listMessages(filter);

    if (messageIds.length === 0) {
      console.log('No unread messages found');
      return;
    }

    // Process messages with error isolation (Promise.allSettled pattern)
    const results = await Promise.allSettled(
      messageIds.map(async (messageId) => {
        const message = await gmailClient.getMessage(messageId);
        const scoredLinks = parseLinksWithScores(message.htmlBody);
        const emailContext: EmailContext = {from: message.from, subject: message.subject || ''};
        const parsedLinks = await classifyLinks(scoredLinks, emailContext, ollamaUrl, ollamaModel);

        if (parsedLinks.length > 0) {
          const displayName = extractDisplayName(message.from);
          const subjectTrimmed = message.subject?.trim() || '';
          const subjectPreview = subjectTrimmed.slice(0, 25);
          const ellipsis = subjectTrimmed.length > 25 ? '...' : '';
          const emailFrom = subjectPreview.length > 0
            ? `${displayName} (${subjectPreview}${ellipsis})`
            : displayName;

          const items = parsedLinks.map((parsed: ParsedLink) => ({
            messageId,
            emailFrom,
            link: parsed.url,
            title: parsed.title,
            description: parsed.description,
          }));

          const {inserted} = await bulkUpsertEmailItems({items});
          linkCount += inserted;
        }

        // Mark as read
        await gmailClient.markAsRead(messageId);
      }),
    );

    // Count results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        emailCount++;
      } else {
        console.error('Failed to process email:', result.reason);
      }
    }

    // Update last import timestamp
    await setSetting('gmail_last_imported_at', new Date().toISOString());

    console.log(JSON.stringify({
      event: 'import-emails',
      duration_ms: Date.now() - startTime,
      emailCount,
      linkCount,
    }));
  } catch (error) {
    console.error('Failed to run email import:', error);
  }
}
