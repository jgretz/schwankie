Introspective evaluation of worksite's knowledge corpus — rules, docs, memories, and skills.

Systematically assess health, consistency, and quality of the project's accumulated knowledge,
then surface actionable findings. This is the "measure and refine" loop for the project's
institutional memory.

## Arguments: $ARGUMENTS

Parse arguments:

- Scope:
  - (empty or "all") -> run all phases
  - "links" -> Phase 1 only (link validation)
  - "budget" -> Phase 2 only (prompt budget)
  - "memories" -> Phase 3 only (memory hygiene)
  - "rules" -> Phase 4 only (rule quality)
  - "docs" -> Phase 5 only (doc freshness)
  - "skills" -> Phase 6 only (skill quality)
  - "timing" -> Phase 7 only
  - "plans" -> Phase 8 only (macro phase timing)
  - "attention" -> Phase 9 only (attention pattern analysis)
  - "access" -> Phase 10 only (file access frequency)
  - "patterns" -> Phase 11 only (uncovered pattern analysis)
- Flags:
  - "fix" -> auto-fix what can be fixed (consolidate memories, log ideas for manual fixes)
  - "report" -> write findings to `.claude/reviews/introspect-YYYY-MM-DD.md`

---

## Phase 1: Link Validation (deterministic)

Call `evaluate_context` with `includeDocs: true`.

Parse the result. Report:

- Total links checked, files scanned
- Broken links with source file, line, and target
- Status: pass / warn / fail

This is the cheapest check. If it fails, the knowledge corpus has rot.

---

## Phase 2: Prompt Budget (deterministic)

Already included in `evaluate_context` results from Phase 1.

Report:

- Overhead tokens estimate vs threshold
- Rule file count
- Status: pass / warn / fail

If warn or fail: list the largest rule files by character count (read each `.claude/rules/*.md`,
sort by size descending, show top 5). These are candidates for splitting or trimming.

---

## Phase 3: Memory Hygiene

### 3a. Memory-Rule Overlap

Call `recall` with broad queries matching each rule file's topic. For each rule file in
`.claude/rules/`:

1. Extract the filename stem as the query (e.g., "testing-local" -> "testing local")
2. Call `recall` with that query and `limit: 5`
3. For each returned memory, read the rule file content and assess:
   - Does this memory duplicate information already in the rule file?
   - Is the memory a superset (has info not in the rule)? -> candidate for rule promotion
   - Is the memory a subset (fully covered by the rule)? -> candidate for deletion

Report a table:

| Memory ID (short) | Content (truncated)        | Overlapping Rule | Recommendation         |
| ----------------- | -------------------------- | ---------------- | ---------------------- |
| abc123            | "Always use .nothrow()..." | bun-local.md     | Delete (fully covered) |
| def456            | "Worktree setup needs..."  | monorepo-cwd.md  | Promote (has new info) |

### 3b. Memory Stats

Call `recall` with an empty/broad query to get a sample. Report:

- Total active memories (from the count in the result)
- Breakdown by source type (learning, review_summary, plan_chunk, note)
- Age distribution: how many are older than 90 days?
- Any memories flagged for review?

### 3c. Consolidation Check

If `fix` flag is present: call `consolidate_memories` and `decay_memories`.
Report how many were merged and how many were decayed.

---

## Phase 4: Rule Quality Assessment

Scan two sets of files and grade each with appropriate criteria:

**Set 1 — `.claude/rules/*.md`** (prescriptive rules, `docType: 'rule'`):

1. Read the file
2. Evaluate against these criteria (from the Anthropic skill-creator blog):
   - **Actionability**: Does every rule give a concrete do/don't? Flag vague directives ("be careful", "consider", "try to")
   - **Testability**: Could a reviewer verify compliance? Rules that can't be checked are noise
   - **Non-redundancy**: Does this rule duplicate another rule file or a global rule in `~/.claude/rules/`?
   - **Currency**: Does the rule reference files, functions, or patterns that still exist in the codebase? Spot-check 2-3 specific claims by grepping
   - **Scope clarity**: Is it clear when this rule applies and when it doesn't?

**Set 2 — `docs/*.md`** (domain docs, `docType: 'doc'`, skip `docs/research/` and `docs/decisions/`):

1. Read the file
2. Evaluate against doc-appropriate criteria (descriptive, not prescriptive):
   - **Discoverability**: Is the doc linked from CLAUDE.md? Orphaned docs rot.
   - **Currency**: Does it reference files and patterns that still exist? Spot-check 2-3 claims by grepping
   - **Conciseness**: Excessive vague language (3+ phrases) suggests low-signal prose
   - **Examples**: Code blocks help illustrate architectural intent

Grade each file: A (exemplary), B (solid), C (has issues), D (needs rework).

Report a combined table:

| File                              | Type | Lines | Grade | Issues                               |
| --------------------------------- | ---- | ----- | ----- | ------------------------------------ |
| .claude/rules/verification.md     | rule | 24    | A     | None                                 |
| .claude/rules/react-components.md | rule | 142   | B     | Long; could split SSR vs composition |
| docs/architecture.md              | doc  | 45    | A     | None                                 |
| docs/worktrees.md                 | doc  | 60    | C     | Not linked from CLAUDE.md            |
| ...                               |      |       |       |                                      |

If `fix` flag is present: for each D-grade file, call `create_idea` with a description
of what needs fixing.

---

## Phase 5: Documentation Freshness

### 5a. Staleness Check

For each file linked from CLAUDE.md's "Domain Knowledge" section:

1. Check the file exists (already covered by Phase 1, but enumerate here)
2. Run `git log -1 --format='%ai' -- <file>` to get last modified date
3. If older than 90 days, flag as potentially stale
4. For research and decision docs: check if the recommendation has been implemented
   by grepping for key terms from the doc in the source code

Do NOT flag research docs as stale — they are point-in-time artifacts.
Only flag architecture, guide, and workflow docs.

### 5b. Failure Correlation

After identifying stale docs in 5a, call `analyze_failure_correlation` with the stale files to compute per-file failure correlation indicators.

**Scope rules (apply before calling the tool):**

- **Exclude**: `docs/research/` and `docs/decisions/` — point-in-time artifacts
- **Include**: `.claude/rules/` files — govern worker behavior directly
- **Include**: `docs/*.md` (excluding research/ and decisions/) — active domain docs

**Outcome weight categories:**

Classify each task with attention messages by outcome severity:

| Category  | Condition                                                                                                                                                                                                                           | Weight |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Crashed   | Has attention messages AND (2+ transitions INTO `executing` in status_change events, OR `status` is `executing` with no status_change event in the last 24 hours)                                                                   | `1.5`  |
| Stalled   | Has attention messages AND (`status` is `paused`, `cancelled`, `todo`, `planned`, `ready`, or `awaiting_review`) OR (`status` is NOT `done`/`archived` AND has unresolved attention where `resolved === false` and target is human) | `1.0`  |
| Recovered | Has attention messages AND `status` is `done` or `archived` — attention flagged but task completed                                                                                                                                  | `0.3`  |

**Category precedence (highest wins):** Crashed (1.5×) > Stalled (1.0×) > Recovered (0.3×). When a task matches multiple categories (e.g., restarted 2× but eventually reached `done`), assign the highest-weight matching category.

Weight rationale: crashed tasks (1.5×) represent ~5× more critical doc failures than recoverable friction (0.3×). Stalled tasks (1.0×) are the neutral baseline.

**Restart detection heuristic:**

A task is "crashed" if:

- `status_change` events show 2+ transitions INTO `executing` (restarted), OR
- `status` is `executing` with no milestone event in the last 24 hours (zombie)

Query: `list_events({taskId, eventType: 'status_change'})` → count entries where `payload.to === 'executing'`

**Steps:**

1. From the stale files identified in 5a (files older than 90 days, in scope), build a `staleFiles` array: `[{ path, lastModified, ageDays }]`.

2. Call `analyze_failure_correlation` with the stale files array. The tool returns:
   - `globalAttentionRate` — baseline attention rate across all tasks
   - `totalTasks`, `totalAttentionTasks` — raw counts
   - `entries[]` — per-file results with `indicator`, `ratio`, `matchingTasks`, `status`

3. Render the table from the returned `entries`. Correlation indicator values:
   - `⚠ high` — ratio ≥ 2.0× (strong signal this doc is causing failures)
   - `⚡ elevated` — 1.5× ≤ ratio < 2.0× (worth investigating)
   - `—` — ratio < 1.5× (no signal)
   - `n/a` — fewer than 3 matching tasks (insufficient data)

**Report a table:**

| Doc File                   | Last Modified | Age (days) | Failure Correlation    | Outcome Mix            | Status             |
| -------------------------- | ------------- | ---------- | ---------------------- | ---------------------- | ------------------ |
| .claude/rules/frontend.md  | 2025-10-01    | 160d       | 2.4× weighted (⚠ high) | 1 recovered, 2 stalled | Stale + correlated |
| .claude/rules/typecheck.md | 2026-02-15    | 22d        | —                      | —                      | Current            |
| docs/worktrees.md          | 2025-11-01    | 125d       | n/a (1 task)           | —                      | Stale (no data)    |
| docs/architecture.md       | 2026-01-15    | 50d        | —                      | —                      | Current            |

**Status values:**

- `Current` — not stale
- `Stale (no data)` — stale but fewer than 3 matching tasks
- `Stale` — stale, ratio < 1.5×
- `Stale + correlated` — stale AND ratio ≥ 1.5× (high priority refresh)

**Action items** distinguish severity:

- Stale + correlated (≥ 1.5×): "High priority refresh — stale doc correlated with elevated weighted failure rate"
- Stale only: "Review for freshness — last modified >90 days ago"

---

### 5c. Rule Compliance Correlation

Analyze whether `.claude/rules/` enforcement patterns correlate with worker failures,
regardless of doc staleness.

**Steps:**

1. Call `analyzeRuleCompliance` (from `@worksite/engine` — but since this runs in an
   introspect session, implement the logic inline using the same algorithm):
   - Read each `.claude/rules/*.md` file
   - Extract frontmatter tags and file path references
   - Cross-reference with task history (same data gathered in 5b)
   - Compute per-rule attention ratio vs global baseline

2. Report table:

| Rule File        | Tags          | Governed Paths           | Matching Tasks | Attention Rate | Ratio | Signal            |
| ---------------- | ------------- | ------------------------ | -------------- | -------------- | ----- | ----------------- |
| security.md      | feat,fix      | packages/store, apps/mcp | 8              | 50%            | 2.3×  | ⚠ high            |
| testing-local.md | feat,fix,test | packages/store/tests     | 12             | 25%            | 1.1×  | —                 |
| typecheck.md     | feat,fix      | apps/mcp, apps/hud       | 15             | 13%            | 0.6×  | ✓ well-understood |

3. Signal values:
   - `⚠ high` (ratio ≥ 2.0×): Rule is frequently violated — consider rewriting for clarity
   - `⚡ elevated` (1.5–2.0×): Worth investigating
   - `—` (0.5–1.5×): No signal
   - `✓ well-understood` (< 0.5× with ≥ 5 tasks): Rule is effective
   - `n/a` (< 3 tasks): Insufficient data

4. Action items:
   - High/elevated rules: "Rewrite for clarity or add code examples — workers frequently violate this rule"
   - Well-understood rules: No action needed (positive signal)

---

## Phase 6: Skill & Command Quality

For each file in `.claude/commands/`:

1. Read the file
2. Evaluate against skill-creator criteria:
   - **Trigger clarity**: Is it obvious when to use this command vs another?
   - **Completeness**: Does it handle edge cases (empty input, errors, partial state)?
   - **Output specification**: Is the expected output format defined?
   - **Testability**: Could you write a test prompt that verifies the skill works?
   - **Description optimization**: Would the description trigger correctly on relevant user prompts and NOT trigger on irrelevant ones? (false positive / false negative analysis)

Grade each: A / B / C / D.

Report a table:

| Command     | Grade | Trigger Issues   | Completeness Issues |
| ----------- | ----- | ---------------- | ------------------- |
| /commit     | A     | Clear            | Handles empty diff  |
| /review     | A     | Clear            | Handles all scopes  |
| /introspect | ?     | Self-referential | N/A                 |
| ...         |       |                  |                     |

---

## Phase 7: Macro Phase Timing

**Data collection**: Make three calls:

1. `list_events({ eventType: 'milestone' })` — all milestone events
2. `list_events({ eventType: 'attention_flagged' })` — all attention events
3. `list_tasks({ status: 'done' })` — the set of completed task IDs

Call `analyzePhaseTimings(milestoneEvents, attentionEvents, doneTaskIds)` to get the report.

**Minimum data threshold**: If `report.insufficientData` is true, report "Insufficient milestone data (N tasks) — skip timing analysis" and move on.

**Report table** (use `report.transitions`):

```
| Transition        | Count | Median | P90 | Min | Bottleneck?    | Attention       |
|---|---|---|---|---|---|---|
| impl → typecheck  | 12    | 8m     | 25m | 3m  | ⚠ Yes (3.1×)  | 4/12 (⚠ high)  |
| typecheck → tests | 12    | 4m     | 7m  | 2m  | No             | 1/12 (none)     |
| tests → committed | 11    | 2m     | 3m  | 1m  | No             | 0/11 (none)     |
| committed → pr    | 11    | 1m     | 2m  | 1m  | No             | 0/11 (none)     |
```

- **Bottleneck?**: show `⚠ Yes (Nx)` if `isBottleneck`, else `No`
- **Attention**: show `attentionCount/count (correlation)`. Prefix with `⚠` if `failureCorrelation` is `high` or `elevated`

**Summary**: After the table, note `report.worstBottleneck` and `report.worstFailurePhase` if non-null.

**Interpretation guidance**:

- High median on `impl → typecheck`: may indicate workers struggling with type errors — check rule coverage in `typecheck.md`
- High median on `typecheck → tests`: may indicate test failures requiring iteration — check `testing-local.md` and `testing-expectations.md`
- **Failure clustering**:
  - High attention rate on a bottleneck transition: that phase is a failure hotspot, not just slow — workers are getting stuck and raising attention flags there
  - High attention rate on a non-bottleneck: tasks get stuck but recover quickly (short duration, but frequent attention)
  - Bottleneck with no attention (rate `none`): slow but successful — may be acceptable if work is inherently complex there

---

## Phase 8: Plan Quality ("plans")

Evaluate task plans against the goal-backward acceptance criteria template.

1. Call `list_tasks` (no status filter to get all non-archived tasks)
2. Filter to tasks with non-empty plans
3. For each task, mentally evaluate the plan against these checks:
   - Has `## Context`, `## Flow`, `## Steps`, `## Acceptance Criteria` sections?
   - Within AC: has Truths, Artifacts, Key Links, Verification sub-sections?
   - Contains specific file paths (not just "the relevant file")?
   - Avoids vague directives ("update as needed", "find the appropriate")?
4. Grade each: A (all sections, specific), B (missing 1 optional), C (missing required), D (missing multiple required), F (stub/empty)

Report a table:

| Task ID | Title         | Status  | Grade | Missing Sections |
| ------- | ------------- | ------- | ----- | ---------------- |
| abc123  | Add feature X | planned | A     | None             |
| def456  | Fix bug Y     | ready   | C     | Flow, Truths     |

Summary: grade distribution, overall health (healthy if 80%+ A/B).

Focus on `planned` and `ready` tasks — these are actionable. Include `done` tasks
only in the aggregate stats for trend analysis.

---

## Phase 9: Attention Pattern Analysis (runtime)

Call `analyze_attention`.

### 9a. Attention Rate by Task Type

Report a table:

| Type | Tasks | Tasks w/ Attention | Total Flags | Rate |
| ---- | ----- | ------------------ | ----------- | ---- |
| feat | 12    | 4                  | 7           | 33%  |
| fix  | 5     | 1                  | 1           | 20%  |

High rates (>40%) indicate the plan templates or rules for that task type
are insufficient — workers keep getting stuck on the same category of work.

### 9b. Hot Tasks

Tasks with >2 unresolved attention messages. These are stuck or
poorly scoped:

| Task ID | Title | Type | Unresolved | Top Reasons |
| ------- | ----- | ---- | ---------- | ----------- |

### 9c. Common Attention Patterns

Recurring reasons workers flag attention — these point to systemic gaps:

| Pattern | Count | Example Tasks |
| ------- | ----- | ------------- |

If a pattern appears 3+ times, it likely warrants a rule or plan template fix.

### 9d. Resolution Stats

- Total attention events: N
- Resolved: N (X%)
- Unresolved: N (Y%)

Low resolution rate suggests the human review loop is backlogged.

If `fix` flag: for each common pattern with count >= 3, call `create_idea`
describing the plan template or rule improvement needed.

---

## Phase 10: File Access Frequency (data-driven)

Call `query_file_access` with default parameters.

For each returned file:

1. Check if the file path appears in CLAUDE.md links or `.claude/rules/` content
2. Classify as: "Covered" (already in docs/rules) or "Not covered" (extraction candidate)

Report:

| File                         | Reads (total) | Tasks | Covered? | Recommendation                   |
| ---------------------------- | ------------- | ----- | -------- | -------------------------------- |
| packages/store/src/schema.ts | 12            | 7     | No       | Extract schema overview to docs/ |
| .claude/rules/typecheck.md   | 8             | 5     | Yes      | Current — no action              |

If no tool_calls data exists yet (no tasks have completed since archiving was added),
report "No tool call data available yet — data accumulates as tasks complete."

If `fix` flag is present: for each uncovered file with taskCount >= 5, call `create_idea`
suggesting a doc/rule extraction.

---

## Phase 11: Uncovered Pattern Analysis (data-driven)

Call `extract_patterns` with default parameters.

If the result has `totalTasksAnalyzed === 0`, report "No completed tasks — pattern analysis requires task history" and move on.

If `uncoveredPatterns` is empty, report "All detected patterns are covered by existing rules — no gaps found."

Otherwise, report:

### 11a. Coverage Summary

- Tasks analyzed: N
- Text chunks scanned: N (attention messages + notes + learnings)
- Keywords covered by existing rules: N
- Uncovered patterns found: N

### 11b. Uncovered Patterns

| Theme                 | Frequency (tasks) | Suggested Rule File | Example Reasons                              |
| --------------------- | ----------------- | ------------------- | -------------------------------------------- |
| context window crash  | 5                 | context-budgets.md  | "Worker ran out of context mid-typecheck..." |
| worktree cleanup fail | 3                 | worktree-cleanup.md | "Dirty worktree blocked checkout..."         |

Show all returned patterns (up to 20, pre-capped by the tool).

**Interpretation:**

- Frequency ≥ 5: strong signal — likely warrants a new rule file
- Frequency 3–4: moderate signal — worth reviewing examples before creating a rule
- Frequency 2: weak signal — monitor, may consolidate with other patterns over time

If `fix` flag: for each pattern with frequency ≥ 3, call `create_idea` with:
`"[introspect] Create rule {suggestedRuleFile} — {theme} (seen in {frequency} tasks). Examples: {first example reason truncated to 80 chars}"`

---

## Output Format

```markdown
# Introspection Report — YYYY-MM-DD

## Summary

| Phase     | Status                           | Key Finding                         |
| --------- | -------------------------------- | ----------------------------------- |
| Links     | pass/warn/fail                   | N broken links                      |
| Budget    | pass/warn/fail                   | ~N tokens overhead                  |
| Memories  | healthy/attention                | N overlaps, N stale                 |
| Rules     | A-D                              | N rules need work                   |
| Docs      | current/stale/stale+correlated   | N docs older than 90d, M correlated |
| Skills    | A-D                              | N skills need work                  |
| Timing    | pass/warn/attention              | N transitions, M bottlenecks        |
| Plans     | healthy/needs attention/degraded | N plans analyzed, M need work       |
| Attention | healthy/elevated/high            | N attention events, M hot tasks     |
| Access    | data/no data                     | N files, M extraction candidates    |
| Patterns  | covered/gaps found/no data       | N patterns, M high-frequency        |

**Overall Health: [healthy / needs attention / degraded]**

## Phase Details

[Include each phase's detailed tables and findings]

## Action Items

Prioritized list of recommended actions:

1. [Highest impact fix]
2. [Next fix]
3. ...

If `fix` flag was used, note which actions were auto-applied and which need manual attention.
```

If `report` flag: write to `.claude/reviews/introspect-YYYY-MM-DD.md`.

---

## Efficiency Notes

- Phase 1+2 are a single `evaluate_context` call — always run together
- Phase 3 requires N recall calls (one per rule file) — batch mentally, ~15 calls
- Phase 4 requires reading ~15 rule files + ~20 docs/\*.md files + spot-check greps — moderate context cost
- Phase 5 requires N git log calls + 1 `list_tasks` call (for failure correlation) — moderate context cost
- Phase 6 requires reading ~3-4 command files — cheap
- Phase 7 requires 2 list_events calls + 1 list_tasks call — cheap
- Phase 8 requires 1 list_tasks call + plan text analysis (no extra calls) — cheap
- Phase 9 requires 1 analyze_attention call — cheap
- Phase 10 requires 1 query_file_access call — cheap (single MCP tool call)
- Phase 11 requires 1 extract_patterns call — cheap (single MCP tool call, computation is server-side)

For single-phase runs, skip the summary table and just show that phase's detail.

---

## Examples

- /introspect -> full evaluation, all phases, inline output
- /introspect links -> just check broken links
- /introspect memories fix -> evaluate memories and auto-consolidate/decay
- /introspect rules -> evaluate rule file quality
- /introspect all report -> full evaluation, save report
- /introspect all fix report -> full evaluation, auto-fix, save report
- /introspect timing -> phase duration analysis across completed tasks
- /introspect attention -> attention pattern analysis across all tasks
- /introspect attention fix -> analyze attention patterns and log ideas for high-frequency patterns
- /introspect access -> file access frequency analysis from archived tool call data
- /introspect access fix -> file access analysis + create ideas for uncovered high-frequency files
- /introspect patterns -> uncovered pattern analysis from task history
- /introspect patterns fix -> analyze patterns and create ideas for high-frequency gaps
