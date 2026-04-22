import {Hono} from 'hono';
import {authMiddleware} from '../middleware/auth';
import {
  getSetting,
  setSetting,
  clearGmailTokens,
  setGmailTokens,
  type GmailTokens,
} from '@domain';
import {
  buildGmailAuthUrl,
  exchangeGmailCodeWithGoogle,
  GmailTokenRevokedError,
} from '../lib/gmail-oauth';
import {refreshGmailTokens} from '../commands/refresh-gmail-tokens';
import {exchangeCodeSchema, setGmailFilterSchema} from '../validators/gmail';

export const gmailRouter = new Hono();
const auth = authMiddleware();

gmailRouter.get('/api/gmail/auth-url', auth, async (c) => {
  const url = buildGmailAuthUrl();
  return c.json({url});
});

gmailRouter.post('/api/gmail/exchange-code', auth, async (c) => {
  const parsed = exchangeCodeSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({error: 'Invalid request body', details: parsed.error.flatten()}, 400);
  }

  try {
    const result = await exchangeGmailCodeWithGoogle(parsed.data.code);

    await Promise.all([
      setGmailTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiry: result.expiryDate,
      }),
      setSetting('gmail_email', result.email),
    ]);

    return c.json({connected: true, email: result.email}, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to exchange code';
    return c.json({error: message}, 400);
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

  return c.json({
    connected: !!email,
    filter: filter || null,
    lastImportedAt: lastImportedAt || null,
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
