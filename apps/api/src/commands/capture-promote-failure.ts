import {getEmailItem, getRssItem, recordPromoteFailure} from '@domain';
import type {PromoteFailureSource} from '@domain';
import {promoteErrorCode} from '../lib/promote-error-code';

type CapturePromoteFailureInput = {
  source: PromoteFailureSource;
  sourceItemId: string;
  error: unknown;
};

type SourceContext = {url: string | null; title: string | null};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Resolve the operator's primary diagnostic — which url kept failing. Its own
 * failure must not cost us the row, so it degrades to nulls.
 */
async function resolveSourceContext(
  source: PromoteFailureSource,
  sourceItemId: string,
): Promise<SourceContext> {
  try {
    if (source === 'rss') {
      const item = await getRssItem(sourceItemId);
      return {url: item?.link ?? null, title: item?.title ?? null};
    }

    const item = await getEmailItem(sourceItemId);
    return {url: item?.link ?? null, title: item?.title ?? null};
  } catch (lookupError) {
    console.error('[promote] failed to resolve source item context', lookupError);
    return {url: null, title: null};
  }
}

/**
 * Record a failed promote, best-effort. Called from the route's catch block —
 * never from inside the promote command, whose transaction has already rolled
 * back by the time we get here — and it never throws: the caller rethrows the
 * original error, and a diagnostic that eats the diagnosis is the exact failure
 * mode this table exists to prevent.
 */
export async function capturePromoteFailure(input: CapturePromoteFailureInput): Promise<void> {
  const {source, sourceItemId, error} = input;

  // One guard around the whole body, not just the insert: message extraction
  // and the log line are cheap but not provably total (`String(x)` throws for
  // a null-prototype throwable), and anything that escapes here would replace
  // the promote error the route is about to rethrow.
  try {
    const {url, title} = await resolveSourceContext(source, sourceItemId);
    const code = promoteErrorCode(error);
    const message = errorMessage(error);

    console.error(
      `[promote] source=${source} itemId=${sourceItemId} url=${url ?? '-'} code=${code ?? '-'} message=${message}`,
      error,
    );

    await recordPromoteFailure({
      source,
      sourceItemId,
      url,
      title,
      errorMessage: message,
      errorCode: code,
    });
  } catch (captureError) {
    console.error('[promote] failed to capture promote failure', captureError);
  }
}
