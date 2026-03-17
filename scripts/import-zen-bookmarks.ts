#!/usr/bin/env bun
/**
 * Import links into schwankie.
 *
 * Reads JSON from stdin (piped from extract-zen-tabs.ts):
 *   bun run scripts/extract-zen-tabs.ts --group "To Do" | \
 *     SCHWANKIE_API_KEY=xxx bun run scripts/import-zen-bookmarks.ts
 *
 * Env vars:
 *   SCHWANKIE_API_URL  — defaults to http://localhost:3001
 *   SCHWANKIE_API_KEY  — Bearer token (required)
 */

const CONCURRENCY = 5;

type Link = {url: string; title: string};

async function postLink(
  link: Link,
  apiUrl: string,
  apiKey: string,
): Promise<void> {
  const res = await fetch(`${apiUrl}/api/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({url: link.url, title: link.title, status: 'queued'}),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${body}`);
  }
}

async function main() {
  const apiUrl = process.env.SCHWANKIE_API_URL ?? 'http://localhost:3001';
  const apiKey = process.env.SCHWANKIE_API_KEY ?? '';

  if (!apiKey) {
    console.error('Error: SCHWANKIE_API_KEY env var is required');
    process.exit(1);
  }

  const stdin = await Bun.stdin.text();
  const links: Link[] = JSON.parse(stdin);

  if (!Array.isArray(links) || links.length === 0) {
    console.error('No links in stdin. Pipe output from extract-zen-tabs.ts');
    process.exit(1);
  }

  console.log(`Importing ${links.length} links...`);

  let created = 0;
  let failed = 0;
  const failures: {url: string; error: string}[] = [];

  for (let i = 0; i < links.length; i += CONCURRENCY) {
    const chunk = links.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((link) => postLink(link, apiUrl, apiKey)),
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === 'fulfilled') {
        created++;
      } else {
        failed++;
        failures.push({
          url: chunk[j].url,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }

    process.stdout.write(`\rImporting... [${i + chunk.length}/${links.length}]`);
  }

  console.log(`\nDone: ${created} created, ${failed} failed`);

  if (failures.length > 0) {
    for (const {url, error} of failures) {
      console.error(`  FAILED: ${url} — ${error}`);
    }
  }
}

main().catch((err: unknown) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
