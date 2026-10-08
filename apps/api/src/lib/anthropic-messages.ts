export type AnthropicEffort = 'low' | 'medium' | 'high';

export type CallAnthropicJsonInput = {
  apiKey: string;
  model: string;
  effort: AnthropicEffort;
  /** Thinking spends from this budget too, so leave headroom over the expected JSON. */
  maxTokens: number;
  prompt: string;
  schema: Record<string, unknown>;
  timeoutMs: number;
};

type MessagesResponse = {
  stop_reason?: string | null;
  content?: Array<{type: string; text?: string}>;
};

/**
 * One structured-output Messages call. Returns the parsed JSON as `unknown`:
 * the caller owns validating it. Throws on any response that cannot be
 * trusted to carry the full answer.
 */
export async function callAnthropicJson(input: CallAnthropicJsonInput): Promise<unknown> {
  const {apiKey, model, effort, maxTokens, prompt, schema, timeoutMs} = input;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      output_config: {effort, format: {type: 'json_schema', schema}},
      messages: [{role: 'user', content: prompt}],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Anthropic HTTP ${response.status}: ${body}`);
  }

  const data = (await response.json()) as MessagesResponse;
  if (data.stop_reason === 'refusal' || data.stop_reason === 'max_tokens') {
    throw new Error(`Anthropic stopped with ${data.stop_reason}`);
  }

  // Thinking blocks can precede the answer; the answer is the text block.
  const text = data.content?.find((block) => block.type === 'text')?.text;
  if (text === undefined) {
    throw new Error('Anthropic response carried no text block');
  }

  return JSON.parse(text);
}
