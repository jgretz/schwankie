import {Hono} from 'hono';
import {parseEnv} from 'env';
import {z} from 'zod';
import {authMiddleware} from '../middleware/auth';
import {
  getSetting,
  setSetting,
  clearGmailTokens,
  setGmailTokens,
  countRecentEmailItems,
  type GmailTokens,
} from '@domain';
import {
  buildGmailAuthUrl,
  exchangeGmailCodeWithGoogle,
  GmailTokenRevokedError,
} from '../lib/gmail-oauth';
import {refreshGmailTokens} from '../commands/refresh-gmail-tokens';
import {setGmailFilterSchema} from '../validators/gmail';

const {WWW_URL} = parseEnv(z.object({WWW_URL: z.string().url()}));

export const gmailRouter = new Hono();
const auth = authMiddleware();

gmailRouter.get('/api/gmail/auth-url', auth, async (c) => {
  const url = buildGmailAuthUrl();
  return c.json({url});
});

gmailRouter.get('/api/email/oauth/callback', async (c) => {
  const error = c.req.query('error');
  const code = c.req.query('code');

  if (error) {
    return c.redirect(`${WWW_URL}/admin/gmail?error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return c.redirect(`${WWW_URL}/admin/gmail?error=${encodeURIComponent('No authorization code received')}`);
  }

  try {
    const result = await exchangeGmailCodeWithGoogle(code);
    await Promise.all([
      setGmailTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiry: result.expiryDate,
      }),
      setSetting('gmail_email', result.email),
    ]);
    return c.redirect(`${WWW_URL}/admin/gmail`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to exchange code';
    return c.redirect(`${WWW_URL}/admin/gmail?error=${encodeURIComponent(message)}`);
  }
});

gmailRouter.post('/api/gmail/disconnect', auth, async (c) => {
  await clearGmailTokens();
  return c.json({disconnected: true});
});

gmailRouter.get('/api/gmail/status', auth, async (c) => {
  const email = await getSetting('gmail_email');
  const filter = await getSetting('gmail_filter');
  const lastImportedAt = await getSetting('gmail_last_imported_at');
  const recentCount = await countRecentEmailItems(7);

  return c.json({
    connected: !!email,
    filter: filter || null,
    lastImportedAt: lastImportedAt || null,
    recentCount,
    email: email || undefined,
  });
});

gmailRouter.post('/api/gmail/filter', auth, async (c) => {
  const parsed = setGmailFilterSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }

  await setSetting('gmail_filter', parsed.data.filter);
  return c.json({filter: parsed.data.filter});
});

gmailRouter.get('/api/gmail/tokens', auth, async (c) => {
  try {
    const tokens = await refreshGmailTokens();

    if (!tokens) {
      return c.json({error: 'Gmail not connected'}, 404);
    }

    return c.json<GmailTokens>(tokens, 200);
  } catch (error) {
    if (error instanceof GmailTokenRevokedError) {
      return c.json({error: 'Token revoked'}, 410);
    }
    const message =
      error instanceof Error ? error.message : 'Failed to refresh tokens';
    return c.json({error: message}, 400);
  }
});
