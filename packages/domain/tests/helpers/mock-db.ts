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
  createdAt: Date;
};

export const store = {
  links: [] as LinkRow[],
  tags: [] as TagRow[],
  linkTags: [] as LinkTagRow[],
  tagAliases: [] as TagAliasRow[],
  nextId: {link: 1, tag: 1, linkTag: 1, tagAlias: 1},
};

export function resetStore() {
  store.links = [];
  store.tags = [];
  store.linkTags = [];
  store.tagAliases = [];
  store.nextId = {link: 1, tag: 1, linkTag: 1, tagAlias: 1};
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
    created_at: 'createdAt',
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
      const linkTagIds = store.linkTags
        .filter((lt) => lt.linkId === linkId)
        .map((lt) => lt.tagId);
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
  // Walk all chunks recursively looking for Param objects with numeric values
  const ids: number[] = [];
  function walk(obj: any) {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
    } else if (obj?.value !== undefined && obj?.encoder) {
      if (typeof obj.value === 'number') ids.push(obj.value);
    } else if (obj?.queryChunks) {
      obj.queryChunks.forEach(walk);
    }
  }
  walk(condition);
  return ids;
}

function isAndCondition(chunks: any[]): boolean {
  return chunks.some(
    (c: any) =>
      c?.value && Array.isArray(c.value) && c.value.some((v: any) => typeof v === 'string' && v.includes(' and ')),
  );
}

function isOrCondition(chunks: any[]): boolean {
  return chunks.some(
    (c: any) =>
      c?.value && Array.isArray(c.value) && c.value.some((v: any) => typeof v === 'string' && v.includes(' or ')),
  );
}

function getOperator(chunks: any[]): string {
  for (const chunk of chunks) {
    if (chunk?.value && Array.isArray(chunk.value)) {
      for (const v of chunk.value) {
        if (typeof v === 'string') {
          if (v.includes(' = ')) return '=';
          if (v.includes(' != ') || v.includes(' <> ')) return '!=';
          if (v.includes(' in ')) return 'in';
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
        createdAt: values.createdAt ?? now,
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
  baseTable: any,
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

  const builder: any = {
    from(table: any) {
      fromTable = table;
      return builder;
    },
    where(condition: any) {
      whereCondition = condition;
      return builder;
    },
    orderBy() {
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
        // For joins, filter base rows first
        let baseRows = [...getStoreForTable(fromTable)];
        if (whereCondition) {
          baseRows = baseRows.filter((r) => evaluateCondition(r, whereCondition, fromTable));
        }
        result = performJoins(baseRows, fromTable, joinConfigs, fields);

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
  let conflictAction: 'nothing' | null = null;

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

        const id = store.nextId[idKey]++;
        const row = defaultsForTable(table, val, id);
        storeArr.push(row);
        inserted.push(row);
      }

      return Promise.resolve(inserted);
    },
    onConflictDoNothing() {
      conflictAction = 'nothing';
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
      for (const row of storeArr) {
        if (evaluateCondition(row, whereCondition, table)) {
          for (const [key, val] of Object.entries(setValues)) {
            if (val && typeof val === 'object' && (val as any).queryChunks) {
              (row as any)[key] = new Date();
            } else {
              (row as any)[key] = val;
            }
          }
        }
      }
      resolve(undefined);
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
      replaceStoreArray(table, kept);
      resolve(undefined);
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
