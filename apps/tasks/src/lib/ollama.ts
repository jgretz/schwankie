type GenerateOptions = {
  url: string;
  model: string;
  prompt: string;
  timeout?: number;
  format?: 'json';
  options?: Record<string, unknown>;
};

export async function generate<T>(opts: GenerateOptions): Promise<T> {
  const response = await fetch(`${opts.url}/api/generate`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: opts.model,
      prompt: opts.prompt,
      stream: false,
      ...(opts.format && {format: opts.format}),
      ...(opts.options && {options: opts.options}),
    }),
    signal: AbortSignal.timeout(opts.timeout ?? 60_000),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const body = (await response.json()) as {response: string};
  return JSON.parse(body.response) as T;
}
