# Drizzle ORM Patterns

## .$dynamic() for Conditional Query Composition

Drizzle's query builder locks the return type at each chain step. After `.from().innerJoin()...`, TypeScript freezes the type signature — adding `.where()` to a reassigned `let query` causes a type error because the builder types don't match.

`.$dynamic()` is the escape hatch. Call it after building the base query chain to opt into a looser type that permits conditional chaining:

```ts
let query = db
  .select({...})
  .from(table)
  .innerJoin(...)
  .innerJoin(...)
  .$dynamic();  // ← unlocks conditional chaining

if (condition) {
  query = query.where(eq(col, value));
}

return query.groupBy(...).orderBy(...);
```

**When to use**: Multi-join queries where `.where()`, `.orderBy()`, `.having()`, or additional `.innerJoin()` calls are conditional.

Example: `packages/domain/src/queries/get-tags-with-count.ts` — filters by link status only if provided.

## Conditions Array Pattern

When only `.where()` conditions vary (no conditional joins), avoid `.$dynamic()`. Instead, build a `conditions[]` array and pass it to a single `.where(and(...conditions))`:

```ts
const conditions = [];
if (needs_enrichment) conditions.push(isNull(link.content));
if (status) conditions.push(eq(link.status, status));
if (q) conditions.push(or(ilike(link.title, `%${q}%`), ...));

const where = conditions.length > 0 ? and(...conditions) : undefined;
return db.select().from(link).where(where)...;
```

This is simpler, preserves full type safety, and scales better than `.$dynamic()`.

Example: `packages/domain/src/queries/list-links.ts` — many optional filters, one `.where()` call.

## Rule

- Use `.$dynamic()` only when you need to conditionally chain clauses beyond `.where()` (e.g. `.innerJoin()`, `.having()`, `.groupBy()`).
- For conditional `.where()` only, use the conditions array pattern — it's clearer and type-safe.
