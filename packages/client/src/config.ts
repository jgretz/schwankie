type ClientConfig = {
  apiUrl: string;
  apiKey?: string;
};

let config: ClientConfig | null = null;

export function init(clientConfig: ClientConfig): void {
  config = clientConfig;
}

export function reset(): void {
  config = null;
}

function getConfig(): ClientConfig {
  if (!config) throw new Error('client not initialized — call init() first');
  return config;
}

const TRANSIENT_STATUS_CODES = new Set([502, 503, 504]);
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const {apiUrl, apiKey} = getConfig();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const res = await fetch(`${apiUrl}${path}`, {
        ...options,
        headers,
      });

      if (res.ok) return res.json();

      const body = await res.text().catch(() => '');
      lastError = new Error(`API error: ${res.status} ${res.statusText} — ${body}`);

      if (!TRANSIENT_STATUS_CODES.has(res.status)) throw lastError;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // non-transient API errors (4xx, 500, 501) — don't retry
      if (lastError.message.startsWith('API error:')) throw lastError;
      // network errors (fetch threw) are transient — retry
    }
  }

  throw lastError!;
}
