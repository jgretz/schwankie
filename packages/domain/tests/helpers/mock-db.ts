/* eslint-disable @typescript-eslint/no-explicit-any */

// --- In-memory store ---

type LinkRow = {
  id: number;
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  content: string | null;
  enrichmentFailCount: number;
  enrichmentLastError: string | null;
  score: number | null;
  createDate: Date;
  updateDate: Date;
};

type TagRow = {
  id: number;
  text: string;
  normalizedAt: Date | null;
  createDate: Date;
  updateDate: Date;
};

type LinkTagRow = {
  id: number;
  linkId: number;
  tagId: number;
  createDate: Date;
};

type TagAliasRow = {
  id: number;
  aliasText: string;
  canonicalTagId: number;
  source: string;
  createDate: Date;
};

type FeedRow = {
  id: string;
  name: string;
  sourceUrl: string;
  lastFetchedAt: Date | null;
  errorCount: number;
  lastError: string | null;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type RssItemRow = {
  id: string;
  feedId: string;
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  content: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  read: boolean;
  clicked: boolean;
  createdAt: Date;
};

type EmailItemRow = {
  id: string;
  emailMessageId: string;
  emailFrom: string;
  link: string;
  title: string | null;
  description: string | null;
  read: boolean;
  clicked: boolean;
  importedAt: Date;
};

type SettingRow = {
  key: string;
  value: string;
};

type WorkRequestRow = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};

export const store = {
  links: [] as LinkRow[],
  tags: [] as TagRow[],
  linkTags: [] as LinkTagRow[],
  tagAliases: [] as TagAliasRow[],
  feeds: [] as (FeedRow & {_insertionOrder: number})[],
  rssItems: [] as (RssItemRow & {_insertionOrder: number})[],
  emailItems: [] as EmailItemRow[],
  settings: [] as SettingRow[],
  workRequests: [] as WorkRequestRow[],
  nextId: {link: 1, tag: 1, linkTag: 1, tagAlias: 1, emailItem: 1, setting: 1, workRequest: 1},
  insertionCounter: 0,
};

export function resetStore() {
  store.links = [];
  store.tags = [];
  store.linkTags = [];
  store.tagAliases = [];
  store.feeds = [];
  store.rssItems = [];
  store.emailItems = [];
  store.settings = [];
  store.workRequests = [];
  store.nextId = {link: 1, tag: 1, linkTag: 1, tagAlias: 1, emailItem: 1, setting: 1, workRequest: 1};
  store.insertionCounter = 0;
}

// --- Table identity ---

const TABLE_NAME = Symbol.for('drizzle:Name');

function tableName(table: any): string {
  return table[TABLE_NAME] ?? '';
}

function getStoreForTable(table: any): any[] {
  const name = tableName(table);
  switch (name) {
    case 'link':
      return store.links;
    case 'tag':
      return store.tags;
    case 'link_tag':
      return store.linkTags;
    case 'tag_alias':
      return store.tagAliases;
    case 'feed':
      return store.feeds;
    case 'rss_item':
      return store.rssItems;
    case 'email_item':
      return store.emailItems;
    case 'setting':
      return store.settings;
    case 'work_request':
      return store.workRequests;
    default:
      throw new Error(`Unknown table: ${name}`);
  }
}

function getNextIdKey(table: any): keyof typeof store.nextId {
  const name = tableName(table);
  switch (name) {
    case 'link':
      return 'link';
    case 'tag':
      return 'tag';
    case 'link_tag':
      return 'linkTag';
    case 'tag_alias':
      return 'tagAlias';
    case 'feed':
      return 'link';
    case 'rss_item':
      return 'link';
    case 'email_item':
      return 'emailItem';
    case 'setting':
      return 'setting';
    case 'work_request':
      return 'workRequest';
    default:
      throw new Error(`Unknown table: ${name}`);
  }
}

// --- Column name mapping (DB snake_case → JS camelCase) ---

const COLUMN_MAP: Record<string, Record<string, string>> = {
  link: {
    id: 'id',
    url: 'url',
    title: 'title',
    description: 'description',
    image_url: 'imageUrl',
    status: 'status',
    content: 'content',
    enrichment_fail_count: 'enrichmentFailCount',
    enrichment_last_error: 'enrichmentLastError',
    score: 'score',
    create_date: 'createDate',
    update_date: 'updateDate',
  },
  tag: {
    id: 'id',
    text: 'text',
    normalized_at: 'normalizedAt',
    create_date: 'createDate',
    update_date: 'updateDate',
  },
  link_tag: {
    id: 'id',
    link_id: 'linkId',
    tag_id: 'tagId',
    create_date: 'createDate',
  },
  tag_alias: {
    id: 'id',
    alias_text: 'aliasText',
    canonical_tag_id: 'canonicalTagId',
    source: 'source',
    create_date: 'createDate',
  },
  feed: {
    id: 'id',
    name: 'name',
    source_url: 'sourceUrl',
    last_fetched_at: 'lastFetchedAt',
    error_count: 'errorCount',
    last_error: 'lastError',
    disabled: 'disabled',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  rss_item: {
    id: 'id',
    feed_id: 'feedId',
    guid: 'guid',
    title: 'title',
    link: 'link',
    summary: 'summary',
    content: 'content',
    image_url: 'imageUrl',
    published_at: 'publishedAt',
    read: 'read',
    clicked: 'clicked',
    created_at: 'createdAt',
  },
  email_item: {
    id: 'id',
    email_message_id: 'emailMessageId',
    email_from: 'emailFrom',
    link: 'link',
    title: 'title',
    description: 'description',
    read: 'read',
    clicked: 'clicked',
    imported_at: 'importedAt',
  },
  setting: {
    key: 'key',
    value: 'value',
  },
  work_request: {
    id: 'id',
    type: 'type',
    payload: 'payload',
    status: 'status',
    error_message: 'errorMessage',
    created_at: 'createdAt',
    started_at: 'startedAt',
    completed_at: 'completedAt',
  },
};

function colToField(table: any, colName: string): string {
  const tName = tableName(table);
  return COLUMN_MAP[tName]?.[colName] ?? colName;
}

// --- SQL condition evaluator ---

function evaluateCondition(row: any, condition: any, _rowTable: any): boolean {
  if (!condition) return true;
  if (!condition.queryChunks) return true;

  const chunks = condition.queryChunks;

  // and/or — detect by checking StringChunks for " and " or " or "
  if (isAndCondition(chunks)) {
    const subConditions = chunks.filter((c: any) => c?.queryChunks);
    return subConditions.every((sub: any) => evaluateCondition(row, sub, _rowTable));
  }

  if (isOrCondition(chunks)) {
    const subConditions = chunks.filter((c: any) => c?.queryChunks);
    return subConditions.some((sub: any) => evaluateCondition(row, sub, _rowTable));
  }

  // and() with single condition wraps it as [SQL] — unwrap
  const subSqls = chunks.filter((c: any) => c?.queryChunks);
  if (subSqls.length === 1 && getOperator(chunks) === '') {
    return evaluateCondition(row, subSqls[0], _rowTable);
  }

  const op = getOperator(chunks);
  const col = getColumn(chunks);
  const val = getValue(chunks);

  // SQL subquery (e.g. `link.id IN (subquery)`) — check for " in " with nested SQL
  if (op === 'in' && !Array.isArray(val)) {
    // This is a raw SQL subquery — used by listLinks for tag filtering
    // Parse the tag IDs from the subquery's params and check linkTags
    const tagIds = extractTagIdsFromSubquery(condition);
    if (tagIds.length > 0 && col) {
      const field = colToField(col.table, col.name);
      const linkId = row[field];
      const linkTagIds = store.linkTags.filter((lt) => lt.linkId === linkId).map((lt) => lt.tagId);
      return tagIds.every((tid) => linkTagIds.includes(tid));
    }
    return true;
  }

  if (!col) return true;

  const field = colToField(col.table, col.name);

  switch (op) {
    case '=':
      return row[field] === val;
    case '!=':
      return row[field] !== val;
    case '>=':
      return row[field] >= val;
    case '>':
      return row[field] > val;
    case '<=':
      return row[field] <= val;
    case '<':
      return row[field] < val;
    case 'in':
      return Array.isArray(val) && val.includes(row[field]);
    case 'ilike': {
      const rowVal = row[field];
      if (rowVal == null) return false;
      const pattern = String(val).replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(pattern, 'i').test(String(rowVal));
    }
    case 'is null':
      return row[field] == null;
    case 'is not null':
      return row[field] != null;
    default:
      return true;
  }
}

function extractTagIdsFromSubquery(condition: any): number[] {
  // Walk all chunks recursively looking for Param objects
  const nums: number[] = [];
  const strs: string[] = [];
  function walk(obj: any) {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
    } else if (obj?.value !== undefined && obj?.encoder) {
      if (typeof obj.value === 'number') nums.push(obj.value);
      else if (typeof obj.value === 'string') strs.push(obj.value);
    } else if (obj?.queryChunks) {
      obj.queryChunks.forEach(walk);
    }
  }
  walk(condition);

  // Prefer string tag texts — the HAVING COUNT() value is a false numeric match
  if (strs.length > 0) {
    return strs
      .map((text) => store.tags.find((t) => t.text === text)?.id)
      .filter((id): id is number => id != null);
  }
  return nums;
}

function isAndCondition(chunks: any[]): boolean {
  return chunks.some(
    (c: any) =>
      c?.value &&
      Array.isArray(c.value) &&
      c.value.some((v: any) => typeof v === 'string' && v.includes(' and ')),
  );
}

function isOrCondition(chunks: any[]): boolean {
  return chunks.some(
    (c: any) =>
      c?.value &&
      Array.isArray(c.value) &&
      c.value.some((v: any) => typeof v === 'string' && v.includes(' or ')),
  );
}

function getOperator(chunks: any[]): string {
  for (const chunk of chunks) {
    if (chunk?.value && Array.isArray(chunk.value)) {
      for (const v of chunk.value) {
        if (typeof v === 'string') {
          if (v.includes(' = ')) return '=';
          if (v.includes(' != ') || v.includes(' <> ')) return '!=';
          if (v.includes(' >= ')) return '>=';
          if (v.includes(' <= ')) return '<=';
          if (v.includes(' > ')) return '>';
          if (v.includes(' < ')) return '<';
          if (v.toLowerCase().includes(' in ')) return 'in';
          if (v.includes(' ilike ')) return 'ilike';
          if (v.includes(' is not null')) return 'is not null';
          if (v.includes(' is null')) return 'is null';
        }
      }
    }
  }
  return '';
}

function getColumn(chunks: any[]): any {
  for (const chunk of chunks) {
    if (chunk?.name && chunk?.table) return chunk;
  }
  return null;
}

function getValue(chunks: any[]): any {
  for (const chunk of chunks) {
    if (chunk?.value !== undefined && chunk?.encoder) return chunk.value;
    if (Array.isArray(chunk) && chunk.length > 0 && chunk[0]?.value !== undefined) {
      return chunk.map((p: any) => p.value);
    }
    if (typeof chunk === 'string') return chunk;
  }
  return undefined;
}

// --- Row defaults ---

function defaultsForTable(table: any, values: any, id: number): any {
  const name = tableName(table);
  const now = new Date();

  switch (name) {
    case 'link':
      return {
        id,
        url: values.url ?? '',
        title: values.title ?? '',
        description: values.description ?? null,
        imageUrl: values.imageUrl ?? values.image_url ?? null,
        status: values.status ?? 'saved',
        content: values.content ?? null,
        enrichmentFailCount: values.enrichmentFailCount ?? values.enrichment_fail_count ?? 0,
        enrichmentLastError: values.enrichmentLastError ?? values.enrichment_last_error ?? null,
        score: values.score ?? null,
        createDate: values.createDate ?? now,
        updateDate: values.updateDate ?? now,
      };
    case 'tag':
      return {
        id,
        text: values.text ?? '',
        normalizedAt: values.normalizedAt ?? null,
        createDate: values.createDate ?? now,
        updateDate: values.updateDate ?? now,
      };
    case 'link_tag':
      return {
        id,
        linkId: values.linkId ?? values.link_id,
        tagId: values.tagId ?? values.tag_id,
        createDate: values.createDate ?? now,
      };
    case 'tag_alias':
      return {
        id,
        aliasText: values.aliasText ?? values.alias_text ?? '',
        canonicalTagId: values.canonicalTagId ?? values.canonical_tag_id,
        source: values.source ?? '',
        createDate: values.createDate ?? now,
      };
    case 'feed':
      return {
        id: values.id ?? crypto.randomUUID(),
        name: values.name ?? '',
        sourceUrl: values.sourceUrl ?? values.source_url ?? '',
        lastFetchedAt: values.lastFetchedAt ?? values.last_fetched_at ?? null,
        errorCount: values.errorCount ?? values.error_count ?? 0,
        lastError: values.lastError ?? values.last_error ?? null,
        disabled: values.disabled ?? false,
        createdAt: values.createdAt ?? values.created_at ?? now,
        updatedAt: values.updatedAt ?? values.updated_at ?? now,
        _insertionOrder: store.insertionCounter++,
      };
    case 'rss_item':
      return {
        id: values.id ?? crypto.randomUUID(),
        feedId: values.feedId ?? values.feed_id ?? '',
        guid: values.guid ?? '',
        title: values.title ?? '',
        link: values.link ?? '',
        summary: values.summary ?? null,
        content: values.content ?? null,
        imageUrl: values.imageUrl ?? values.image_url ?? null,
        publishedAt: values.publishedAt ?? values.published_at ?? null,
        read: values.read ?? false,
        clicked: values.clicked ?? false,
        createdAt: values.createdAt ?? values.created_at ?? now,
        _insertionOrder: store.insertionCounter++,
      };
    case 'email_item': {
      const uuid = `550e8400-e29b-41d4-a716-${id.toString().padStart(12, '0')}`;
      return {
        id: values.id ?? uuid,
        emailMessageId: values.emailMessageId ?? values.email_message_id ?? '',
        emailFrom: values.emailFrom ?? values.email_from ?? '',
        link: values.link ?? '',
        title: values.title ?? null,
        description: values.description ?? null,
        read: values.read ?? false,
        clicked: values.clicked ?? false,
        importedAt: values.importedAt ?? values.imported_at ?? now,
      };
    }
    case 'setting':
      return {
        key: values.key ?? '',
        value: values.value ?? '',
      };
    case 'work_request':
      return {
        id: values.id ?? crypto.randomUUID(),
        type: values.type ?? '',
        payload: values.payload ?? {},
        status: values.status ?? 'pending',
        errorMessage: values.errorMessage ?? values.error_message ?? null,
        createdAt: values.createdAt ?? values.created_at ?? now,
        startedAt: values.startedAt ?? values.started_at ?? null,
        completedAt: values.completedAt ?? values.completed_at ?? null,
      };
    default:
      return {id, ...values};
  }
}

// --- Select field projection ---

function hasCountField(fields: any): boolean {
  if (!fields) return false;
  for (const col of Object.values(fields)) {
    if ((col as any)?.queryChunks) return true;
  }
  return false;
}

function projectFields(row: any, fields: any): any {
  if (!fields) return {...row};

  const result: any = {};
  for (const [alias, col] of Object.entries(fields)) {
    if ((col as any)?.name && (col as any)?.table) {
      const field = colToField((col as any).table, (col as any).name);
      result[alias] = row[field];
    } else {
      // SQL expression placeholder — caller handles count
      result[alias] = 0;
    }
  }
  return result;
}

// --- Join logic ---

function getJoinColumns(onCondition: any): {leftField: string; rightField: string} | null {
  if (!onCondition?.queryChunks) return null;

  const cols: any[] = [];
  for (const chunk of onCondition.queryChunks) {
    if (chunk?.name && chunk?.table) {
      cols.push(chunk);
    }
  }

  if (cols.length === 2) {
    return {
      leftField: colToField(cols[0].table, cols[0].name),
      rightField: colToField(cols[1].table, cols[1].name),
    };
  }
  return null;
}

function performJoins(
  baseRows: any[],
  _baseTable: any,
  joins: Array<{table: any; onCondition: any}>,
  fields?: any,
): any[] {
  // Keep full row data through all joins, project at the end
  let result: any[] = baseRows.map((r) => ({_raw: {...r}}));

  for (const {table: joinTable, onCondition} of joins) {
    const joinRows = getStoreForTable(joinTable);
    const joinCol = getJoinColumns(onCondition);
    const joined: any[] = [];

    for (const composite of result) {
      for (const joinRow of joinRows) {
        const raw = composite._raw;
        // Check join condition against the merged raw data
        if (joinCol && raw[joinCol.leftField] === joinRow[joinCol.rightField]) {
          joined.push({_raw: {...raw, ...joinRow}});
        }
      }
    }
    result = joined;
  }

  // Project fields from the merged raw data
  if (fields) {
    return result.map((composite) => {
      const raw = composite._raw;
      const projected: any = {};
      for (const [alias, col] of Object.entries(fields)) {
        const c = col as any;
        if (c?.name && c?.table) {
          const field = colToField(c.table, c.name);
          projected[alias] = raw[field];
        } else {
          projected[alias] = 0;
        }
      }
      return projected;
    });
  }

  return result.map((composite) => composite._raw);
}

// --- Mock Database ---

function createSelectBuilder(targetTable?: any, fields?: any) {
  let fromTable: any = targetTable;
  let whereCondition: any = undefined;
  let joinConfigs: Array<{table: any; onCondition: any}> = [];
  let hasGroupBy = false;
  let orderByDirs: Array<{col: any; desc: boolean}> = [];

  const builder: any = {
    from(table: any) {
      fromTable = table;
      return builder;
    },
    where(condition: any) {
      whereCondition = condition;
      return builder;
    },
    orderBy(...cols: any[]) {
      for (const col of cols) {
        if (col) {
          // Drizzle desc() wraps columns with {__drizzle_SortBuilder: true, direction: 'DESC', ...}
          const isDesc = col.direction === 'DESC' || col.__drizzle_SortBuilder === true;
          orderByDirs.push({col, desc: isDesc});
        }
      }
      return builder;
    },
    limit(n: number) {
      builder._limit = n;
      return builder;
    },
    offset(n: number) {
      builder._offset = n;
      return builder;
    },
    groupBy() {
      hasGroupBy = true;
      return builder;
    },
    $dynamic() {
      return builder;
    },
    innerJoin(joinTable: any, onCondition: any) {
      joinConfigs.push({table: joinTable, onCondition});
      return builder;
    },
    then(resolve: any) {
      let rows = [...getStoreForTable(fromTable)];

      // Apply where filter on raw rows BEFORE projection
      if (whereCondition && joinConfigs.length === 0) {
        rows = rows.filter((r) => evaluateCondition(r, whereCondition, fromTable));
      }

      // Special case: count query (select({count: count()}).from(table).where(cond))
      if (fields && hasCountField(fields) && joinConfigs.length === 0 && !hasGroupBy) {
        resolve([{count: rows.length}]);
        return;
      }

      let result: any[];

      if (joinConfigs.length > 0) {
        const baseRows = [...getStoreForTable(fromTable)];
        // Join first, then apply WHERE on merged rows (matches SQL semantics)
        let mergedRows = performJoins(baseRows, fromTable, joinConfigs, undefined);
        if (whereCondition) {
          mergedRows = mergedRows.filter((r) => evaluateCondition(r, whereCondition, fromTable));
        }
        // Project fields from the filtered merged rows
        result = fields
          ? mergedRows.map((r) => {
              const projected: any = {};
              for (const [alias, col] of Object.entries(fields)) {
                const c = col as any;
                if (c?.name && c?.table) {
                  projected[alias] = r[colToField(c.table, c.name)];
                } else {
                  projected[alias] = 0;
                }
              }
              return projected;
            })
          : mergedRows;

        // Handle groupBy with count for getTagsWithCount
        if (hasGroupBy && fields && hasCountField(fields)) {
          const groups = new Map<string, any>();
          for (const row of result) {
            const groupKey = Object.entries(fields)
              .filter(([, col]) => (col as any)?.name)
              .map(([alias]) => `${alias}:${row[alias]}`)
              .join('|');

            if (!groups.has(groupKey)) {
              groups.set(groupKey, {...row, count: 0});
            }
            groups.get(groupKey)!.count++;
          }
          result = [...groups.values()];
        }
      } else if (fields) {
        result = rows.map((r) => projectFields(r, fields));
      } else {
        result = rows.map((r) => ({...r}));
      }

      // Clean up internal fields
      result.forEach((r) => {
        delete r._sourceTable;
      });

      // Apply orderBy sorting
      if (orderByDirs.length > 0) {
        result.sort((a: any, b: any) => {
          for (const {col, desc: isDescFromParam} of orderByDirs) {
            let colInfo: any = null;
            let isDesc = isDescFromParam;

            // Extract column and DESC info from queryChunks
            // Format: chunk[0] = SQL, chunk[1] = column info, chunk[2] = " desc"
            if (col.queryChunks && col.queryChunks.length >= 2) {
              colInfo = col.queryChunks[1];

              // Check for DESC in chunk[2]
              if (col.queryChunks[2]?.value) {
                const valStr = Array.isArray(col.queryChunks[2].value)
                  ? col.queryChunks[2].value[0]
                  : col.queryChunks[2].value;
                if (typeof valStr === 'string' && valStr.toLowerCase().includes('desc')) {
                  isDesc = true;
                }
              }
            } else if (col?.name && col?.table) {
              colInfo = col;
            }

            if (colInfo?.name && colInfo?.table) {
              const field = colToField(colInfo.table, colInfo.name);
              const aVal = a[field];
              const bVal = b[field];

              let cmp = 0;
              if (aVal == null && bVal != null) cmp = 1;
              else if (aVal != null && bVal == null) cmp = -1;
              else if (aVal < bVal) cmp = -1;
              else if (aVal > bVal) cmp = 1;
              else if (aVal === bVal) {
                // Tiebreaker: use insertion order
                const aOrder = (a as any)._insertionOrder ?? 0;
                const bOrder = (b as any)._insertionOrder ?? 0;
                cmp = aOrder - bOrder;
              }

              if (cmp !== 0) return isDesc ? -cmp : cmp;
            }
          }
          return 0;
        });
      }

      if (builder._offset) {
        result = result.slice(builder._offset);
      }
      if (builder._limit) {
        result = result.slice(0, builder._limit);
      }

      resolve(result);
    },
  };

  return builder;
}

function createInsertBuilder(table: any) {
  let valuesToInsert: any[] = [];
  let conflictAction: 'nothing' | 'update' | null = null;
  let conflictTargetColumns: any[] = [];
  let conflictUpdateSet: any = {};

  const builder: any = {
    values(vals: any) {
      valuesToInsert = Array.isArray(vals) ? vals : [vals];
      return builder;
    },
    returning() {
      const storeArr = getStoreForTable(table);
      const idKey = getNextIdKey(table);
      const inserted: any[] = [];

      for (const val of valuesToInsert) {
        if (conflictAction === 'nothing' && tableName(table) === 'tag') {
          const existing = store.tags.find((t) => t.text === val.text);
          if (existing) continue;
        }

        if (conflictAction === 'nothing' && tableName(table) === 'rss_item') {
          const existing = store.rssItems.find(
            (item) => item.feedId === val.feedId && item.guid === val.guid,
          );
          if (existing) continue;
        }

        if (
          conflictAction === 'nothing' &&
          conflictTargetColumns.length > 0 &&
          (tableName(table) === 'email_item' || tableName(table) === 'setting')
        ) {
          const dbColNames = conflictTargetColumns.map((col: any) => col.name || col);
          const existing = storeArr.find((row: any) =>
            dbColNames.every((dbColName: string) => {
              const fieldName = colToField(table, dbColName);
              return row[fieldName] === val[fieldName];
            }),
          );
          if (existing) continue;
        }

        if (conflictAction === 'update') {
          const dbColNames = conflictTargetColumns.map((col: any) => col.name || col);
          const existingIdx = storeArr.findIndex((row: any) =>
            dbColNames.every((dbColName: string) => {
              const fieldName = colToField(table, dbColName);
              return row[fieldName] === val[fieldName];
            }),
          );
          if (existingIdx >= 0) {
            const existingRow = storeArr[existingIdx];
            for (const [key, value] of Object.entries(conflictUpdateSet)) {
              existingRow[key] = value;
            }
            inserted.push(existingRow);
            continue;
          }
        }

        const id = store.nextId[idKey]++;
        const row = defaultsForTable(table, val, id);
        storeArr.push(row);
        inserted.push(row);
      }

      return Promise.resolve(inserted);
    },
    onConflictDoNothing(options?: any) {
      conflictAction = 'nothing';
      if (options?.target) {
        conflictTargetColumns = Array.isArray(options.target) ? options.target : [options.target];
      }
      return builder;
    },
    onConflictDoUpdate(options?: any) {
      conflictAction = 'update';
      if (options?.target) {
        conflictTargetColumns = Array.isArray(options.target) ? options.target : [options.target];
      }
      if (options?.set) {
        conflictUpdateSet = options.set;
      }
      return builder;
    },
    then(resolve: any) {
      const storeArr = getStoreForTable(table);
      const idKey = getNextIdKey(table);

      for (const val of valuesToInsert) {
        if (conflictAction === 'nothing' && tableName(table) === 'tag') {
          const existing = store.tags.find((t) => t.text === val.text);
          if (existing) continue;
        }

        if (conflictAction === 'nothing' && tableName(table) === 'rss_item') {
          const existing = store.rssItems.find(
            (item) => item.feedId === val.feedId && item.guid === val.guid,
          );
          if (existing) continue;
        }

        if (
          conflictAction === 'nothing' &&
          conflictTargetColumns.length > 0 &&
          (tableName(table) === 'email_item' || tableName(table) === 'setting')
        ) {
          const dbColNames = conflictTargetColumns.map((col: any) => col.name || col);
          const existing = storeArr.find((row: any) =>
            dbColNames.every((dbColName: string) => {
              const fieldName = colToField(table, dbColName);
              return row[fieldName] === val[fieldName];
            }),
          );
          if (existing) continue;
        }

        if (conflictAction === 'update' && conflictTargetColumns?.length) {
          const dbColNames = conflictTargetColumns.map((col: any) => col.name || col);
          const existingIdx = storeArr.findIndex((row: any) =>
            dbColNames.every((dbColName: string) => {
              const fieldName = colToField(table, dbColName);
              return row[fieldName] === val[fieldName];
            }),
          );
          if (existingIdx >= 0) {
            const existingRow = storeArr[existingIdx];
            for (const [key, value] of Object.entries(conflictUpdateSet)) {
              existingRow[key] = value;
            }
            continue;
          }
        }

        const id = store.nextId[idKey]++;
        const row = defaultsForTable(table, val, id);
        storeArr.push(row);
      }

      resolve(undefined);
    },
  };

  return builder;
}

function createUpdateBuilder(table: any) {
  let setValues: any = {};
  let whereCondition: any = undefined;

  const builder: any = {
    set(values: any) {
      setValues = values;
      return builder;
    },
    where(condition: any) {
      whereCondition = condition;
      return builder;
    },
    returning(fields?: any) {
      const storeArr = getStoreForTable(table);
      const updated: any[] = [];

      for (const row of storeArr) {
        if (evaluateCondition(row, whereCondition, table)) {
          for (const [key, val] of Object.entries(setValues)) {
            if (val && typeof val === 'object' && (val as any).queryChunks) {
              (row as any)[key] = new Date();
            } else {
              (row as any)[key] = val;
            }
          }
          updated.push(fields ? projectFields(row, fields) : {...row});
        }
      }

      return Promise.resolve(updated);
    },
    then(resolve: any) {
      const storeArr = getStoreForTable(table);
      let count = 0;
      for (const row of storeArr) {
        if (evaluateCondition(row, whereCondition, table)) {
          count++;
          for (const [key, val] of Object.entries(setValues)) {
            if (val && typeof val === 'object' && (val as any).queryChunks) {
              (row as any)[key] = new Date();
            } else {
              (row as any)[key] = val;
            }
          }
        }
      }
      resolve({rowCount: count});
    },
  };

  return builder;
}

function createDeleteBuilder(table: any) {
  let whereCondition: any = undefined;

  const builder: any = {
    where(condition: any) {
      whereCondition = condition;
      return builder;
    },
    returning() {
      const storeArr = getStoreForTable(table);
      const toRemove: any[] = [];
      const kept: any[] = [];

      for (const row of storeArr) {
        if (evaluateCondition(row, whereCondition, table)) {
          toRemove.push({...row});
        } else {
          kept.push(row);
        }
      }

      replaceStoreArray(table, kept);
      return Promise.resolve(toRemove);
    },
    then(resolve: any) {
      const storeArr = getStoreForTable(table);
      const kept = storeArr.filter((row) => !evaluateCondition(row, whereCondition, table));
      const removed = storeArr.length - kept.length;
      replaceStoreArray(table, kept);
      resolve({rowCount: removed});
    },
  };

  return builder;
}

function replaceStoreArray(table: any, kept: any[]) {
  const name = tableName(table);
  switch (name) {
    case 'link':
      store.links = kept;
      break;
    case 'tag':
      store.tags = kept;
      break;
    case 'link_tag':
      store.linkTags = kept;
      break;
    case 'tag_alias':
      store.tagAliases = kept;
      break;
    case 'feed':
      store.feeds = kept;
      break;
    case 'rss_item':
      store.rssItems = kept;
      break;
    case 'email_item':
      store.emailItems = kept;
      break;
    case 'setting':
      store.settings = kept;
      break;
    case 'work_request':
      store.workRequests = kept;
      break;
  }
}

// --- Execute raw SQL ---
// mergeTag uses: DELETE FROM link_tag WHERE tag_id = $alias AND link_id IN (SELECT link_id FROM link_tag WHERE tag_id = $canonical)

function executeRawSql(sqlObj: any): Promise<any[]> {
  if (!sqlObj?.queryChunks) return Promise.resolve([]);

  // Extract numeric values from chunks (raw numbers interpolated via sql``)
  const nums: number[] = [];
  for (const chunk of sqlObj.queryChunks) {
    if (typeof chunk === 'number') {
      nums.push(chunk);
    } else if (chunk?.value !== undefined && typeof chunk.value === 'number') {
      nums.push(chunk.value);
    }
  }

  // Detect the merge-tag dedup delete pattern: 2 numeric params = aliasTagId, canonicalTagId
  if (nums.length >= 2) {
    const aliasTagId = nums[0];
    const canonicalTagId = nums[1];

    const canonicalLinkIds = store.linkTags
      .filter((lt) => lt.tagId === canonicalTagId)
      .map((lt) => lt.linkId);

    store.linkTags = store.linkTags.filter(
      (lt) => !(lt.tagId === aliasTagId && canonicalLinkIds.includes(lt.linkId)),
    );
  }

  return Promise.resolve([]);
}

// --- Mock db object ---

export const mockDb: any = {
  select(fields?: any) {
    return createSelectBuilder(undefined, fields);
  },
  insert(table: any) {
    return createInsertBuilder(table);
  },
  update(table: any) {
    return createUpdateBuilder(table);
  },
  delete(table: any) {
    return createDeleteBuilder(table);
  },
  transaction(fn: any) {
    return fn(mockDb);
  },
  execute(sqlObj: any) {
    return executeRawSql(sqlObj);
  },
};
