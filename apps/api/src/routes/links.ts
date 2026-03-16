import {Hono} from 'hono';
import {z} from 'zod';
import {createDatabase, link, tag, linkTag} from 'database';
import {parseEnv} from 'env';
import {eq, and, ilike, or, inArray, desc, sql, count} from 'drizzle-orm';
import {authMiddleware} from '../middleware/auth';
import {normalizeTag} from '../lib/normalize-tag';

const envSchema = z.object({
  DATABASE_URL: z.string(),
});
const env = parseEnv(envSchema);
const db = createDatabase(env.DATABASE_URL);

const createLinkSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['saved', 'queued']).optional(),
  tags: z.array(z.string()).optional(),
});

const updateLinkSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(['saved', 'queued', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});

export const linksRoutes = new Hono();

const statusParamSchema = z.enum(['saved', 'queued', 'archived']).optional();
const auth = authMiddleware();

linksRoutes.get('/api/links', async (c) => {
  const limitParam = Math.min(Number(c.req.query('limit') || '50'), 100);
  const offset = Number(c.req.query('offset') || '0');
  const statusResult = statusParamSchema.safeParse(c.req.query('status') || undefined);
  if (!statusResult.success) {
    return c.json({error: 'Invalid status parameter. Must be: saved, queued, or archived'}, 400);
  }
  const status = statusResult.data;
  const tagsParam = c.req.query('tags');
  const q = c.req.query('q');

  const conditions = [];

  if (status) {
    conditions.push(eq(link.status, status));
  }

  if (q) {
    conditions.push(or(ilike(link.title, `%${q}%`), ilike(link.description, `%${q}%`)));
  }

  if (tagsParam) {
    const tagIds = tagsParam.split(',').map(Number).filter(Boolean);
    if (tagIds.length > 0) {
      // AND filter: link must have ALL specified tags
      const subquery = sql`(
        SELECT ${linkTag.linkId}
        FROM ${linkTag}
        WHERE ${inArray(linkTag.tagId, tagIds)}
        GROUP BY ${linkTag.linkId}
        HAVING COUNT(DISTINCT ${linkTag.tagId}) = ${tagIds.length}
      )`;
      conditions.push(sql`${link.id} IN ${subquery}`);
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(link)
      .where(where)
      .orderBy(desc(link.createDate))
      .limit(limitParam)
      .offset(offset),
    db.select({count: count()}).from(link).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  // fetch tags for returned links
  const linkIds = items.map((l) => l.id);
  const tagRows =
    linkIds.length > 0
      ? await db
          .select({
            linkId: linkTag.linkId,
            tagId: tag.id,
            tagText: tag.text,
          })
          .from(linkTag)
          .innerJoin(tag, eq(linkTag.tagId, tag.id))
          .where(inArray(linkTag.linkId, linkIds))
      : [];

  const tagsByLink = new Map<number, Array<{id: number; text: string}>>();
  for (const row of tagRows) {
    const existing = tagsByLink.get(row.linkId) ?? [];
    existing.push({id: row.tagId, text: row.tagText});
    tagsByLink.set(row.linkId, existing);
  }

  const itemsWithTags = items.map((item) => ({
    ...item,
    tags: tagsByLink.get(item.id) ?? [],
  }));

  return c.json({
    items: itemsWithTags,
    hasMore: offset + limitParam < total,
    nextOffset: Math.min(offset + limitParam, total),
    total,
  });
});

linksRoutes.post('/api/links', auth, async (c) => {
  const body = createLinkSchema.parse(await c.req.json());

  const normalizedTags = resolveTags(body.tags);
  const tagRecords = await upsertTags(normalizedTags);

  const [created] = await db
    .insert(link)
    .values({
      url: body.url,
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl,
      status: body.status ?? 'saved',
    })
    .returning();

  if (tagRecords.length > 0) {
    await db.insert(linkTag).values(tagRecords.map((t) => ({linkId: created!.id, tagId: t.id})));
  }

  return c.json(
    {
      ...created,
      tags: tagRecords.map((t) => ({id: t.id, text: t.text})),
    },
    201,
  );
});

linksRoutes.patch('/api/links/:id', auth, async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) {
    return c.json({error: 'Invalid link ID'}, 400);
  }
  const body = updateLinkSchema.parse(await c.req.json());

  const {tags: rawTags, ...fields} = body;

  const updateValues: Record<string, unknown> = {
    ...fields,
    updateDate: new Date().toISOString(),
  };

  const [updated] = await db.update(link).set(updateValues).where(eq(link.id, id)).returning();

  if (!updated) {
    return c.json({error: 'Link not found'}, 404);
  }

  let tagRecords: Array<{id: number; text: string}> = [];

  if (rawTags !== undefined) {
    // replace tags: delete existing, insert new
    await db.delete(linkTag).where(eq(linkTag.linkId, id));

    const normalizedTags = resolveTags(rawTags);
    tagRecords = await upsertTags(normalizedTags);

    if (tagRecords.length > 0) {
      await db.insert(linkTag).values(tagRecords.map((t) => ({linkId: id, tagId: t.id})));
    }
  } else {
    // fetch existing tags
    const rows = await db
      .select({id: tag.id, text: tag.text})
      .from(linkTag)
      .innerJoin(tag, eq(linkTag.tagId, tag.id))
      .where(eq(linkTag.linkId, id));
    tagRecords = rows;
  }

  return c.json({...updated, tags: tagRecords});
});

linksRoutes.delete('/api/links/:id', auth, async (c) => {
  const id = Number(c.req.param('id'));
  if (Number.isNaN(id)) {
    return c.json({error: 'Invalid link ID'}, 400);
  }

  const [deleted] = await db.delete(link).where(eq(link.id, id)).returning();

  if (!deleted) {
    return c.json({error: 'Link not found'}, 404);
  }

  return c.json({deleted: true});
});

// --- helpers ---

function resolveTags(rawTags: string[] | undefined): string[] {
  if (!rawTags) return [];
  const normalized = rawTags.map(normalizeTag).filter((t): t is string => t !== null);
  return [...new Set(normalized)];
}

async function upsertTags(tags: string[]): Promise<Array<{id: number; text: string}>> {
  if (tags.length === 0) return [];

  await db
    .insert(tag)
    .values(tags.map((text) => ({text})))
    .onConflictDoNothing();
  const rows = await db.select().from(tag).where(inArray(tag.text, tags));

  return rows.map((r) => ({id: r.id, text: r.text}));
}
