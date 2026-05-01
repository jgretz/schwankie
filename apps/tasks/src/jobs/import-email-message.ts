import type PgBoss from 'pg-boss';
import {bulkUpsertEmailItems, getGmailTokens} from 'client';
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

interface ImportEmailMessageData {
  messageId: string;
}

async function classifyLinks(
  scoredLinks: ScoredLink[],
  emailContext: EmailContext,
  ollamaUrl: string,
  ollamaModel: string,
): Promise<ParsedLink[]> {
  if (!ollamaUrl) {
    return scoredLinks.filter((l) => l.score >= SCORE_KEEP_THRESHOLD);
  }

  const definiteKeep = scoredLinks.filter((l) => l.score >= SCORE_HIGH_THRESHOLD);
  const ambiguous = scoredLinks.filter(
    (l) => l.score >= SCORE_LOW_THRESHOLD && l.score < SCORE_HIGH_THRESHOLD,
  );

  try {
    const classifications = await classifyAmbiguousLinks(
      ambiguous,
      emailContext,
      ollamaUrl,
      ollamaModel,
    );
    const approved = ambiguous.filter((link, i) => {
      const c = classifications[i];
      if (!c || c.confidence <= CONFIDENCE_THRESHOLD) return link.score >= SCORE_KEEP_THRESHOLD;
      return c.keep;
    });
    return [...definiteKeep, ...approved];
  } catch (error) {
    console.error('[import-email-message] classify failed, falling back to heuristics', error);
    return scoredLinks.filter((l) => l.score >= SCORE_KEEP_THRESHOLD);
  }
}

export const importEmailMessageHandler: PgBoss.WorkHandler<ImportEmailMessageData> = async (
  jobs,
) => {
  for (const job of jobs) {
    await processOne(job);
  }
};

async function processOne(job: PgBoss.Job<ImportEmailMessageData>): Promise<void> {
  const {messageId} = job.data;

  try {
    let tokens: Awaited<ReturnType<typeof getGmailTokens>>;
    try {
      tokens = await getGmailTokens();
    } catch (error) {
      if (error instanceof Error && error.message.includes('410')) {
        console.log(`[import-email-message] ${messageId}: tokens revoked, skipping`);
        return;
      }
      throw error;
    }
    if (!tokens) {
      console.log(`[import-email-message] ${messageId}: Gmail not connected, skipping`);
      return;
    }

    const ollamaUrl = process.env.OLLAMA_URL || '';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';
    const gmail = new GmailClient(tokens.accessToken, tokens.refreshToken || '');

    const message = await gmail.getMessage(messageId);
    const scoredLinks = parseLinksWithScores(message.htmlBody);
    const emailContext: EmailContext = {from: message.from, subject: message.subject || ''};
    const parsedLinks = await classifyLinks(scoredLinks, emailContext, ollamaUrl, ollamaModel);

    if (parsedLinks.length > 0) {
      const displayName = extractDisplayName(message.from);
      const subjectTrimmed = message.subject?.trim() || '';
      const subjectPreview = subjectTrimmed.slice(0, 25);
      const ellipsis = subjectTrimmed.length > 25 ? '...' : '';
      const emailFrom =
        subjectPreview.length > 0 ? `${displayName} (${subjectPreview}${ellipsis})` : displayName;

      const items = parsedLinks.map((parsed: ParsedLink) => ({
        messageId,
        emailFrom,
        link: parsed.url,
        title: parsed.title,
        description: parsed.description,
      }));

      const {inserted} = await bulkUpsertEmailItems({items});
      console.log(`[import-email-message] ${messageId}: inserted ${inserted}`);
    } else {
      console.log(`[import-email-message] ${messageId}: no links extracted (${scoredLinks.length} candidates filtered)`);
    }

    await gmail.markAsRead(messageId);
  } catch (error) {
    console.error(`[import-email-message] ${messageId}: failed`, error);
  }
}
