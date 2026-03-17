#!/usr/bin/env bun
/**
 * Reads a Zen Browser sessionstore .jsonlz4 file and extracts URLs from a
 * named tab group, writing them to stdout as JSON or a bookmarks HTML file.
 *
 * Usage:
 *   bun run scripts/extract-zen-tabs.ts --group "To Do"
 *   bun run scripts/extract-zen-tabs.ts --group "To Do" --out links.json
 *
 * Reads from the active session by default. Pass --file to override.
 */

import {readFile} from 'node:fs/promises';
import {writeFile} from 'node:fs/promises';

const ZEN_SESSIONS =
  `${process.env.HOME}/Library/Application Support/zen/Profiles/r7aqmu8z.Default (release)/zen-sessions.jsonlz4`;

// ---------------------------------------------------------------------------
// mozlz4 decoder
// Mozilla's format: 8-byte magic + 4-byte LE uncompressed length + LZ4 block
// ---------------------------------------------------------------------------

const MAGIC = 'mozLz40\0';

function decodeMozLz4(buf: Uint8Array): string {
  // Verify magic
  const magic = new TextDecoder().decode(buf.slice(0, 8));
  if (magic !== MAGIC) throw new Error(`Not a mozlz4 file (magic: ${JSON.stringify(magic)})`);

  const uncompressedLen = new DataView(buf.buffer, buf.byteOffset + 8, 4).getUint32(0, true);
  const compressed = buf.slice(12);

  const out = new Uint8Array(uncompressedLen);
  let src = 0;
  let dst = 0;

  while (src < compressed.length) {
    const token = compressed[src++];

    // Literal run length
    let litLen = token >>> 4;
    if (litLen === 15) {
      let extra: number;
      do {
        extra = compressed[src++];
        litLen += extra;
      } while (extra === 255);
    }

    // Copy literals
    out.set(compressed.subarray(src, src + litLen), dst);
    src += litLen;
    dst += litLen;

    if (src >= compressed.length) break;

    // Match offset (little-endian 16-bit)
    const offset = compressed[src] | (compressed[src + 1] << 8);
    src += 2;

    // Match length
    let matchLen = (token & 0xf) + 4;
    if (matchLen - 4 === 15) {
      let extra: number;
      do {
        extra = compressed[src++];
        matchLen += extra;
      } while (extra === 255);
    }

    // Copy match (may overlap — copy byte by byte)
    const matchStart = dst - offset;
    for (let i = 0; i < matchLen; i++) {
      out[dst++] = out[matchStart + i];
    }
  }

  return new TextDecoder().decode(out.slice(0, dst));
}

// ---------------------------------------------------------------------------
// Session parsing — extract tabs from a named group
// ---------------------------------------------------------------------------

type TabEntry = {url: string; title: string};

// zen-sessions.jsonlz4 has a flat top-level structure (tabs, folders, groups)
// rather than windows. Folders can be nested — a parent folder's children also
// have tabs we want to collect.
function extractGroupFromZenSessions(
  data: Record<string, unknown>,
  groupName: string,
): TabEntry[] {
  const folders = (data.folders ?? []) as Record<string, unknown>[];
  const tabs = (data.tabs ?? []) as Record<string, unknown>[];

  const parent = folders.find(
    (f) => String(f.name ?? '').toLowerCase() === groupName.toLowerCase(),
  );
  if (!parent) return [];

  // Collect the parent id and all direct child folder ids
  const groupIds = new Set<unknown>([
    parent.id,
    ...folders.filter((f) => f.parentId === parent.id).map((f) => f.id),
  ]);

  const results: TabEntry[] = [];
  for (const tab of tabs) {
    if (!groupIds.has((tab as Record<string, unknown>).groupId)) continue;

    const entries = ((tab as Record<string, unknown>).entries ?? []) as Record<
      string,
      unknown
    >[];
    const idx = ((tab as Record<string, unknown>).index as number) ?? entries.length;
    const entry = entries[idx - 1] ?? entries[entries.length - 1];
    if (!entry) continue;

    const url = String(entry.url ?? '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) continue;

    results.push({url, title: String(entry.title ?? url)});
  }

  return results;
}

// sessionstore recovery.jsonlz4 has a windows[] structure
function extractGroupFromSessionstore(
  session: Record<string, unknown>,
  groupName: string,
): TabEntry[] {
  const windows = (session.windows ?? []) as Record<string, unknown>[];
  const results: TabEntry[] = [];

  for (const win of windows) {
    const groups = (win.groups ?? []) as Record<string, unknown>[];
    const tabs = (win.tabs ?? []) as Record<string, unknown>[];

    const group = groups.find(
      (g) => String(g.name ?? '').toLowerCase() === groupName.toLowerCase(),
    );
    if (!group) continue;

    for (const tab of tabs) {
      if ((tab as Record<string, unknown>).groupId !== group.id) continue;

      const entries = ((tab as Record<string, unknown>).entries ?? []) as Record<
        string,
        unknown
      >[];
      const idx = ((tab as Record<string, unknown>).index as number) ?? entries.length;
      const entry = entries[idx - 1] ?? entries[entries.length - 1];
      if (!entry) continue;

      const url = String(entry.url ?? '');
      if (!url.startsWith('http://') && !url.startsWith('https://')) continue;

      results.push({url, title: String(entry.title ?? url)});
    }
  }

  return results;
}

function extractGroup(data: Record<string, unknown>, groupName: string): TabEntry[] {
  // zen-sessions files have top-level `folders`; sessionstore files have `windows`
  if (Array.isArray(data.folders)) {
    return extractGroupFromZenSessions(data, groupName);
  }
  return extractGroupFromSessionstore(data, groupName);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  return {
    file: get('--file') ?? ZEN_SESSIONS,
    group: get('--group') ?? 'To Do',
    out: get('--out'),
  };
}

async function main() {
  const {file, group, out} = parseArgs();

  const buf = await readFile(file);
  const json = decodeMozLz4(new Uint8Array(buf));
  const data = JSON.parse(json) as Record<string, unknown>;

  const links = extractGroup(data, group);

  if (links.length === 0) {
    const folders = (data.folders ?? []) as Record<string, unknown>[];
    const windows = (data.windows ?? []) as Record<string, unknown>[];
    const names = [
      ...folders.map((f) => String(f.name ?? '')),
      ...windows.flatMap((w) =>
        ((w.groups ?? []) as Record<string, unknown>[]).map((g) => String(g.name ?? '')),
      ),
    ].filter(Boolean);
    console.error(`No links found in group "${group}".`);
    if (names.length) console.error(`Available groups: ${[...new Set(names)].join(', ')}`);
    process.exit(1);
  }

  console.error(`Found ${links.length} links in "${group}"`);

  const result = JSON.stringify(links, null, 2);
  if (out) {
    await writeFile(out, result, 'utf8');
    console.error(`Written to ${out}`);
  } else {
    console.log(result);
  }
}

main().catch((err: unknown) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
