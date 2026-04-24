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

type EmbeddingsOptions = {
  url: string;
  model: string;
  input: string;
  timeout?: number;
};

type OllamaEmbeddingsResponse = {embeddings: number[][]};

export async function embeddings(opts: EmbeddingsOptions): Promise<number[]> {
  const response = await fetch(`${opts.url}/api/embed`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: opts.model,
      input: opts.input,
    }),
    signal: AbortSignal.timeout(opts.timeout ?? 60_000),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const body = (await response.json()) as OllamaEmbeddingsResponse;
  const vec = body.embeddings?.[0];
  if (!Array.isArray(vec) || vec.length === 0) {
    throw new Error('Ollama returned empty embedding');
  }
  return vec;
}
