type ClientConfig = {
  apiUrl: string;
  apiKey?: string;
};

let config: ClientConfig | null = null;

export function init(clientConfig: ClientConfig): void {
  config = clientConfig;
}

function getConfig(): ClientConfig {
  if (!config) throw new Error('client not initialized — call init() first');
  return config;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const {apiUrl, apiKey} = getConfig();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API error: ${res.status} ${res.statusText} — ${body}`);
  }

  return res.json();
}
