import {afterEach, beforeEach, describe, expect, it, mock, spyOn} from 'bun:test';
import type {HistoryCandidate, SearchHistoryCandidatesParams} from '@domain';
import {
  fallbackTerms,
  HISTORY_FALLBACK_LIMIT,
  searchHistory,
} from '../../src/commands/search-history';

const NOW = new Date('2026-10-08T12:00:00Z');
const Q = 'a link to dedicated hardware for a local LLM startup';
const API_KEY = 'sk-test';

type Stage = 'expand' | 'judge';
type StageReply = {status?: number; text?: string; stopReason?: string};
type CapturedRequest = {stage: Stage; headers: Headers; body: any};

const originalFetch = global.fetch;
let captured: CapturedRequest[];
let replies: Record<Stage, StageReply>;

function stageOf(body: any): Stage {
  return 'terms' in body.output_config.format.schema.properties ? 'expand' : 'judge';
}

function installFetch(): void {
  global.fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    const stage = stageOf(body);
    captured.push({stage, headers: new Headers(init?.headers), body});

    const reply = replies[stage];
    if (reply.status && reply.status !== 200) {
      return new Response('upstream exploded', {status: reply.status});
    }
    return Response.json({
      stop_reason: reply.stopReason ?? 'end_turn',
      content: [
        {type: 'thinking', thinking: 'considering'},
        {type: 'text', text: reply.text ?? '{}'},
      ],
    });
  }) as unknown as typeof fetch;
}

function expansionReply(terms: string[]): StageReply {
  return {text: JSON.stringify({terms})};
}

function judgeReply(matches: Array<{id: string; reason: string}>): StageReply {
  return {text: JSON.stringify({matches})};
}

function makeCandidate(i: number, overrides: Partial<HistoryCandidate> = {}): HistoryCandidate {
  return {
    kind: 'rss',
    feedId: 'feed-1',
    id: `item-${i}`,
    title: `Title ${i}`,
    url: `https://example.com/${i}`,
    source: 'TechCrunch',
    summary: `<p>Summary ${i}</p>`,
    ingestedAt: new Date('2026-10-05T09:00:00Z'),
    openedAt: null,
    promoted: false,
    rank: 1 / (i + 1),
    ...overrides,
  } as HistoryCandidate;
}

const CANDIDATES = Array.from({length: 12}, function (_, i) {
  return makeCandidate(i);
});

function makeFindCandidates(result: HistoryCandidate[] = CANDIDATES) {
  return mock(async (_params: SearchHistoryCandidatesParams) => result);
}

describe('searchHistory', function () {
  let warnSpy: ReturnType<typeof spyOn>;
  let infoSpy: ReturnType<typeof spyOn>;

  beforeEach(function () {
    captured = [];
    replies = {
      expand: expansionReply(['Ghost founder', 'personal AI computer']),
      judge: judgeReply([
        {id: 'item-3', reason: 'A startup building hardware for local AI'},
        {id: 'item-0', reason: 'Related dev box'},
      ]),
    };
    installFetch();
    warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(function () {
    global.fetch = originalFetch;
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it('should expand, retrieve and return the judged matches in the judge order', async function () {
    const findCandidates = makeFindCandidates();

    const result = await searchHistory(
      {q: Q, days: 30, now: NOW},
      {findCandidates, anthropicApiKey: API_KEY},
    );

    expect(findCandidates).toHaveBeenCalledTimes(1);
    const params = findCandidates.mock.calls[0][0];
    expect(params.terms).toEqual(['Ghost founder', 'personal AI computer', ...fallbackTerms(Q)]);
    expect(params.days).toBe(30);
    expect(params.now).toBe(NOW);

    expect(result.judged).toBe(true);
    expect(result.windowStart).toBe('2026-09-08T12:00:00.000Z');
    expect(result.results.map((r) => [r.id, r.reason])).toEqual([
      ['item-3', 'A startup building hardware for local AI'],
      ['item-0', 'Related dev box'],
    ]);
    expect(result.results[0]).toEqual({
      kind: 'rss',
      feedId: 'feed-1',
      id: 'item-3',
      title: 'Title 3',
      url: 'https://example.com/3',
      source: 'TechCrunch',
      ingestedAt: '2026-10-05T09:00:00.000Z',
      openedAt: null,
      promoted: false,
      reason: 'A startup building hardware for local AI',
    });
  });

  it('should send structured-output requests to haiku with the api key', async function () {
    await searchHistory(
      {q: Q, days: 30, now: NOW},
      {findCandidates: makeFindCandidates(), anthropicApiKey: API_KEY},
    );

    expect(captured.map((c) => c.stage)).toEqual(['expand', 'judge']);
    for (const request of captured) {
      expect(request.body.model).toBe('claude-haiku-5-5');
      expect(request.body.output_config.format.type).toBe('json_schema');
      expect(request.headers.get('x-api-key')).toBe(API_KEY);
    }
    const judgePrompt: string = captured[1].body.messages[0].content;
    expect(judgePrompt).toContain('id: item-3');
    expect(judgePrompt).toContain('summary: Summary 3');
    expect(judgePrompt).not.toContain('<p>');
  });

  it('should drop judge ids that are not candidates and collapse duplicates', async function () {
    replies.judge = judgeReply([
      {id: 'not-a-candidate', reason: 'invented'},
      {id: 'item-2', reason: 'first'},
      {id: 'item-2', reason: 'again'},
    ]);

    const result = await searchHistory(
      {q: Q, days: 30, now: NOW},
      {findCandidates: makeFindCandidates(), anthropicApiKey: API_KEY},
    );

    expect(result.results.map((r) => [r.id, r.reason])).toEqual([['item-2', 'first']]);
    expect(result.judged).toBe(true);
  });

  it('should cut more than five judge matches to five', async function () {
    replies.judge = judgeReply(
      CANDIDATES.slice(0, 8).map(function (c) {
        return {id: c.id, reason: 'fits'};
      }),
    );

    const result = await searchHistory(
      {q: Q, days: 30, now: NOW},
      {findCandidates: makeFindCandidates(), anthropicApiKey: API_KEY},
    );

    expect(result.results.map((r) => r.id)).toEqual([
      'item-0',
      'item-1',
      'item-2',
      'item-3',
      'item-4',
    ]);
  });

  it('should retrieve on the description words when expansion fails', async function () {
    replies.expand = {status: 500};
    const findCandidates = makeFindCandidates();

    const result = await searchHistory(
      {q: Q, days: 30, now: NOW},
      {findCandidates, anthropicApiKey: API_KEY},
    );

    expect(findCandidates.mock.calls[0][0].terms).toEqual(fallbackTerms(Q));
    expect(fallbackTerms(Q)).toContain('startup');
    expect(captured.map((c) => c.stage)).toEqual(['expand', 'judge']);
    expect(result.judged).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith('[history] expand failed', expect.any(Error));
  });

  const judgeFailures: Array<[string, StageReply]> = [
    ['an HTTP 500', {status: 500}],
    ['malformed JSON', {text: '{"matches": [oops'}],
    ['a refusal', {stopReason: 'refusal', text: '{"matches": []}'}],
  ];

  for (const [label, reply] of judgeFailures) {
    it(`should fall back to keyword-ranked results when the judge returns ${label}`, async function () {
      replies.judge = reply;

      const result = await searchHistory(
        {q: Q, days: 30, now: NOW},
        {findCandidates: makeFindCandidates(), anthropicApiKey: API_KEY},
      );

      expect(result.judged).toBe(false);
      expect(result.results).toHaveLength(HISTORY_FALLBACK_LIMIT);
      expect(result.results.map((r) => r.id)).toEqual(
        CANDIDATES.slice(0, HISTORY_FALLBACK_LIMIT).map((c) => c.id),
      );
      expect(result.results.every((r) => r.reason === null)).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith('[history] judge failed', expect.any(Error));
    });
  }

  it('should fall back when the judge answers with the wrong shape', async function () {
    replies.judge = {text: JSON.stringify({matches: [{id: 7}]})};

    const result = await searchHistory(
      {q: Q, days: 30, now: NOW},
      {findCandidates: makeFindCandidates(), anthropicApiKey: API_KEY},
    );

    expect(result.judged).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('[history] judge failed', expect.any(Error));
  });

  it('should never call the llm without an api key', async function () {
    const findCandidates = makeFindCandidates(CANDIDATES.slice(0, 3));

    const result = await searchHistory({q: Q, days: 7, now: NOW}, {findCandidates});

    expect(global.fetch).toHaveBeenCalledTimes(0);
    expect(findCandidates.mock.calls[0][0].terms).toEqual(fallbackTerms(Q));
    expect(result.judged).toBe(false);
    expect(result.results.map((r) => [r.id, r.reason])).toEqual([
      ['item-0', null],
      ['item-1', null],
      ['item-2', null],
    ]);
  });

  it('should not call the judge when there are no candidates', async function () {
    const result = await searchHistory(
      {q: Q, days: 30, now: NOW},
      {findCandidates: makeFindCandidates([]), anthropicApiKey: API_KEY},
    );

    expect(captured.map((c) => c.stage)).toEqual(['expand']);
    expect(result).toEqual({results: [], judged: true, windowStart: '2026-09-08T12:00:00.000Z'});
  });

  it('should propagate a retrieval failure', async function () {
    const failure = new Error('database unreachable');
    const findCandidates = mock(async (_params: SearchHistoryCandidatesParams) => {
      throw failure;
    });

    await expect(
      searchHistory({q: Q, days: 30, now: NOW}, {findCandidates, anthropicApiKey: API_KEY}),
    ).rejects.toBe(failure);
  });

  it('should log the per-stage timings', async function () {
    await searchHistory(
      {q: Q, days: 30, now: NOW},
      {findCandidates: makeFindCandidates(), anthropicApiKey: API_KEY},
    );

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(String(infoSpy.mock.calls[0][0])).toMatch(
      /^\[history\] retrieve=\d+ms expand=\d+ms judge=\d+ms candidates=12$/,
    );
  });
});

describe('fallbackTerms', function () {
  it('should keep distinct words of three or more characters', function () {
    expect(fallbackTerms('an AI box, the AI box & a startup')).toEqual(['box', 'the', 'startup']);
  });

  it('should cap the list at twelve', function () {
    const words = Array.from({length: 20}, function (_, i) {
      return `word${i}`;
    });

    expect(fallbackTerms(words.join(' '))).toHaveLength(12);
  });
});
