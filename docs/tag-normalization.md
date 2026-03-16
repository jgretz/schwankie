# Tag Normalization Strategy

## Problem Statement

Tags in Schwankie are user-provided strings stored in a `tag` table with unique `text` column (varchar 200). Currently, no normalization occurs — tags arrive as-is and get upserted by text match. This causes trivial variations to create duplicate tags: "JavaScript", "javascript", "js", "JS", "java-script" all become separate rows pointing to the same concept.

**Goal:** Deterministic + semantic normalization to merge trivially different and semantically equivalent tags.

---

## Architecture: Two-Layer Normalization

### Layer 1 — Deterministic (Synchronous, on link save)

Applied before tag upsert. Pure function, no external dependencies. Runs inline during link creation/update.

**Rules (in order):**

1. `trim()` — strip leading/trailing whitespace
2. `toLowerCase()` — case-fold to lowercase
3. Replace whitespace runs with single hyphen (` +` → `-`)
4. Strip non-alphanumeric except hyphens (`[^a-z0-9-]` → removed)
5. Collapse consecutive hyphens (`--+` → `-`)
6. Strip leading/trailing hyphens
7. Reject empty string after normalization (throw or skip)

**Examples:**

- `"  React JS  "` → `"react-js"`
- `"C++"` → `"c"`
- `"machine_learning"` → `"machine-learning"`
- `"  --Python--  "` → `"python"`
- `"@#$%"` → rejected (empty after rules)

Result: slug-style canonical form. Every tag stored in the DB goes through this function.

### Layer 2 — Semantic Normalization (Asynchronous, task runner + Ollama)

Post-save background task. Polls for unprocessed tags and classifies them against existing canonical tags using a local LLM.

**Workflow:**

1. Task runner polls tags where `normalized_at IS NULL`
2. For each tag, call Ollama with existing canonical tags list
3. Ollama classifies: should this tag merge into an existing one?
4. If merge approved: redirect all `link_tag` rows to canonical tag, insert audit trail in `tag_alias`, delete alias tag, set `normalized_at`
5. If no merge: mark processed with `normalized_at = now()`

**Ollama Prompt Template:**

```
Given these canonical tags: ["javascript", "python", "react", "machine-learning", ...]

Should the new tag "{TAG}" be merged into one of these existing tags?

Respond with JSON (only): { "merge": true, "canonical": "javascript" } or { "merge": false }
```

**Model:** Use small classification model (e.g., `llama3.2:3b` or `mistral:7b`) — not a generation task.

---

## Schema Changes

### Modify `tag` table

Add column:

```sql
ALTER TABLE tag ADD COLUMN normalized_at TIMESTAMP WITH TIME ZONE;
-- null = unprocessed by Ollama, timestamp = processed
```

### Create `tag_alias` table

Audit trail for semantic merges:

```sql
CREATE TABLE tag_alias (
  id SERIAL PRIMARY KEY,
  alias_text VARCHAR(200) NOT NULL,
  canonical_tag_id INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('ollama', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_tag_alias_canonical ON tag_alias(canonical_tag_id);
CREATE INDEX idx_tag_alias_source ON tag_alias(source);
```

---

## Rejected Alternatives

1. **Single-pass normalization via Ollama at save time**: Too slow (LLM call blocking user flow) and context-dependent (requires all existing tags loaded each time).

2. **Heuristic-based semantic matching (edit distance, keyword overlap)**: Fragile and unmaintainable; LLM avoids hardcoding rules.

3. **Manual merge UI + crowd-sourcing**: Doesn't scale; automation handles the common cases.

4. **Store both raw + normalized**: Doubles storage, complicates queries. Keep normalized form only.

---

## Implementation Roadmap

### Phase 1: Deterministic Normalization (Sync Layer)

1. Write pure function `normalizeTag(input: string): string | null`
2. Add unit tests (edge cases: empty, special chars, unicode, length limits)
3. Integrate into link create/update routes (normalize before upsert)
4. No DB changes needed yet

### Phase 2: Schema + Async Infrastructure

1. Run Drizzle migration: add `normalized_at` to `tag` table
2. Run Drizzle migration: create `tag_alias` table
3. Implement task: poll unprocessed tags (`normalized_at IS NULL`)
4. Integrate task into task runner

### Phase 3: Semantic Normalization (Async Layer)

1. Call Ollama with tag list + candidate tag
2. Parse response, apply merge logic
3. Update `link_tag` rows to point to canonical tag
4. Insert audit row into `tag_alias`
5. Delete alias tag (if no orphaned links remain)
6. Set `normalized_at = now()`

### Phase 4: Monitoring + Tuning

1. Log classification decisions (merge approved/rejected)
2. Audit `tag_alias` table for outliers
3. Adjust Ollama model or prompt based on false positives
4. Document common merge patterns for manual intervention

---

## Notes for Developers

- Normalization is **idempotent**: applying rules twice = same result. Safe to reprocess.
- `tag_alias` is **immutable** after insert (audit trail). Do not update or delete.
- Ollama inference can fail (network, model crash) — catch exceptions and re-queue tag.
- For very new tags with few existing canonical tags, Ollama may abstain (merge: false). That's correct; let human feedback refine over time.
- Manual merges can go into `tag_alias` with `source = 'manual'` for audit trail.
