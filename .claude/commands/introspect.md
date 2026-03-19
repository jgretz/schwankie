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
  - "violations" -> Phase 4b only (rule violation hot-spots)
  - "docs" -> Phase 5 only (doc freshness)
  - "skills" -> Phase 6 only (skill quality)
  - "timing" -> Phase 7 only
  - "plans" -> Phase 8 only (macro phase timing)
  - "attention" -> Phase 9 only (attention pattern analysis)
  - "access" -> Phase 10 only (file access frequency)
  - "pressure" -> Phase 11 only (context pressure analysis)
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

Call `analyze_rule_quality` (no parameters — uses default repo).

The tool scans `.claude/rules/*.md` (as `rule` type) and `docs/*.md` (as `doc` type,
excluding `docs/research/` and `docs/decisions/`), grades each file with `parseRuleQuality`,
and aggregates via `analyzeRulesReport`.

From the response, extract `reports` (per-file) and `summary` (aggregate).

### Overall Health

Report the summary health classification:

- **Overall Health**: `summary.overallHealth` (healthy / needs-attention / degraded)
- **Grade Distribution**: `summary.gradeDistribution` (counts per grade A/B/C/D)

### Per-File Table

Build from `reports` array:

| File                              | Type | Lines | Grade | Issues                               |
| --------------------------------- | ---- | ----- | ----- | ------------------------------------ |
| .claude/rules/verification.md     | rule | 24    | A     | None                                 |
| .claude/rules/react-components.md | rule | 142   | B     | Long; could split SSR vs composition |
| docs/architecture.md              | doc  | 45    | A     | None                                 |
| docs/worktrees.md                 | doc  | 60    | C     | Not linked from CLAUDE.md            |

- `File`: `report.filePath`
- `Type`: `report.docType` (rule or doc)
- `Lines`: `report.lineCount`
- `Grade`: `report.grade`
- `Issues`: comma-separated `report.findings[].message`, or "None" if empty

### Worst Rules

List entries from `summary.worstRules` with their specific findings:

> **{filePath}** (Grade {grade}): {findings list}

### Fix Mode

If `fix` flag is present: for each D-grade file in `summary.worstRules`, call `create_idea`
with a description of what needs fixing.

---

## Phase 4b: Rule Violation Hot-Spots

Call `analyze_rule_violations` (no parameters — it uses the default repo).

Check `totalMatches === 0`: if yes, report "No violation patterns matched against task history — either rules lack WRONG examples or task history is sparse" and skip remaining steps.

**Report overview table** — one row per rule file with violations, sorted by matchCount descending:

| Rule File | Patterns Extracted | Violations Found | Top Pattern |
| --------- | ------------------ | ---------------- | ----------- |

- `Rule File`: from `byRule[].ruleFile`
- `Patterns Extracted`: from `byRule[].patternsExtracted`
- `Violations Found`: from `byRule[].matchCount`
- `Top Pattern`: the pattern string with the most matches in that rule (truncated to 60 chars)

Only include rules with `matchCount > 0`.

**Report hot patterns table** — patterns matched by 2+ distinct tasks, sorted by matchCount descending:

| Pattern (truncated) | Rule File | Tasks Matched | Category |
| ------------------- | --------- | ------------- | -------- |

- Source: `hotPatterns[]` array from the report
- `Category`: from the underlying pattern's category (`wrong_example` or `banned_practice`)
- If `hotPatterns` is empty: "No hot patterns (no pattern matched 2+ tasks)"

**Report affected tasks table** — for each hot pattern, list the tasks that matched:

| Task ID (short) | Title | Match Source | Matched Text (truncated) |
| --------------- | ----- | ------------ | ------------------------ |

- Source: drill into `byRule[].patterns[].matches[]` for hot pattern entries
- `Match Source`: attention / note / learning
- Limit to top 10 task matches total to avoid context bloat

**Interpretation guidance:**

- Hot `wrong_example` patterns: "Workers are repeating anti-patterns documented in WRONG examples — the rule's guidance may not be prominent enough"
- Hot `banned_practice` patterns: "Workers are violating explicit prohibitions — consider adding WRONG/CORRECT code examples to make the rule more actionable"
- Rules with many patterns extracted but zero matches: "Rule has good coverage of anti-patterns but no violations detected — rule is effective or task history is sparse"

**If `fix` flag:** For each hot pattern with `matchCount >= 3`, call `create_idea`:

```
prompt: "[introspect:violations] {ruleFile}: hot pattern '{pattern}' matched {matchCount} tasks — strengthen guidance or add WRONG/CORRECT examples"
impact: 3
```

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

**Targeted guidance** — include for high-correlation entries:

For each entry where `guidance` is not null, render the full guidance text as a detail line:

> **{file}** ({indicator}, {ratio}×): {guidance}

Example:

> **.claude/rules/frontend.md** (⚠ high, 2.4×): 67% of tasks touching this file flag attention for: missing CSS token reference; component composability issues. Consider updating this doc to address these patterns.

If `fix` flag is present: for each entry with non-null guidance and indicator of `⚠ high` or `⚡ elevated`, call `create_idea` with:

```
prompt: "[introspect:docs] {file}: {guidance}"
impact: 4
```

---

### 5c. Rule Compliance Correlation & Trend Tracking

Analyze whether `.claude/rules/` enforcement patterns correlate with worker failures,
and track whether individual rule compliance is improving or degrading over time.

**Steps:**

1. Call `analyze_rule_compliance` (MCP tool). This tool:
   - Reads each `.claude/rules/*.md` file
   - Extracts frontmatter tags and file path references
   - Cross-references with task history (same data gathered in 5b)
   - Computes per-rule attention ratio vs global baseline
   - Stores a snapshot of current metrics to the database
   - Compares to prior snapshots to compute trend direction

2. Report table with trend column:

| Rule File        | Tags          | Governed Paths           | Matching Tasks | Attention Rate | Ratio | Signal            | Trend       |
| ---------------- | ------------- | ------------------------ | -------------- | -------------- | ----- | ----------------- | ----------- |
| security.md      | feat,fix      | packages/store, apps/mcp | 8              | 50%            | 2.3×  | ⚠ high            | ↑ degrading |
| testing-local.md | feat,fix,test | packages/store/tests     | 12             | 25%            | 1.1×  | —                 | ↓ improving |
| typecheck.md     | feat,fix      | apps/mcp, apps/hud       | 15             | 13%            | 0.6×  | ✓ well-understood | → stable    |

3. Signal and trend values:
   - **Signal** (compliance level):
     - `⚠ high` (ratio ≥ 2.0×): Rule is frequently violated — consider rewriting for clarity
     - `⚡ elevated` (1.5–2.0×): Worth investigating
     - `—` (0.5–1.5×): No signal
     - `✓ well-understood` (< 0.5× with ≥ 5 tasks): Rule is effective
     - `n/a` (< 3 tasks): Insufficient data
   - **Trend** (direction of change vs prior snapshot):
     - `↑ degrading` — ratio increased by ≥ 0.3 since last snapshot (compliance worsening)
     - `↓ improving` — ratio decreased by ≥ 0.3 since last snapshot (compliance improving)
     - `→ stable` — ratio change < 0.3 (consistent)
     - `new` — first snapshot for this rule (no prior data)

4. Action items (prioritize high + degrading):
   - **High + degrading** (⚠ high, ↑ degrading): "Urgent rewrite needed — rule clarity is declining. Update with concrete examples or simplify language"
   - **High only** (⚠ high, not degrading): "Rewrite for clarity — workers frequently violate this rule"
   - **Degrading (any signal)** (↑ degrading): "Rule compliance worsening — review for ambiguity and update if needed"
   - **Improving (any signal)** (↓ improving): "Rule compliance improving — current approach is working; no action needed"
   - **Well-understood** (✓): No action needed (positive signal)

### 5d. Regression Trend Detection

Analyze whether doc/rule quality is worsening, stable, or improving over time using
time-series regression on task attention rates across 90-day sliding windows.

**Steps:**

1. Call `detect_regressions` tool.
   - Loads the last 90 days of tasks
   - Reads all `.claude/rules/*.md`, `docs/*.md`, and `CLAUDE.md` files
   - Performs linear regression on attention rate trends per doc
   - Returns per-doc trend (worsening/stable/improving) with slope coefficient

2. Check if `analyzed === 0`:
   - If yes, report "Insufficient task history for regression analysis — need 3+ days of task data" and skip remaining steps.
   - If no, proceed.

3. Report table sorted by slope (worsening first):

| File                 | Trend     | Slope  | Windows | Attention Rate Trend        |
| -------------------- | --------- | ------ | ------- | --------------------------- |
| .claude/rules/bun.md | worsening | +0.087 | 5       | 10% → 20% → 35% (climbing)  |
| docs/architecture.md | stable    | +0.012 | 4       | 15% → 16% → 15% (flat)      |
| docs/concurrency.md  | improving | -0.042 | 5       | 40% → 30% → 15% (declining) |

4. Interpretation:
   - `worsening` (slope > +0.05): Tasks touching this doc increasingly flagged with attention → deteriorating guidance
   - `stable` (-0.05 to +0.05): Consistent attention rate → doc stable
   - `improving` (slope < -0.05): Tasks touching this doc increasingly resolve → guidance improving

5. Action items:
   - Worsening docs: "Consider rewriting or adding clarification — attention has increased by {X}% over 90 days"
   - Improving docs: No action needed (positive signal)
   - Stable docs: Only investigate if already flagged as stale (Phase 5a) or correlated with high failure (Phase 5b)

6. **Phase 5 Summary addendum**: If worsening count > 0, add to the Phase 5 summary section (before Phase 6):
   - "⚠ {N} docs show worsening regression trends — see Phase 5d details for remediation"

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

**Data collection**: Call `analyze_phase_timings` (no parameters). Returns a `PhaseTimingReport` with `taskCount`, `insufficientData`, `transitions[]`, `worstBottleneck`, `worstFailurePhase`.

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

### 9e. Rule-Attention Correlation

**Purpose:** Identify knowledge gaps (stale or low-quality rule files) correlated
with worker failures. Cross-reference rule quality grades (A–D) with task attention
rates using fileIntents matching.

**Steps:**

1. Call `correlate_rules_attention` (no parameters).
   Returns `RuleCorrelationReport` with:
   - `globalAttentionRate` — baseline attention rate across all tasks
   - `totalTasks` — number of tasks analyzed
   - `rules[]` — per-rule correlation data
   - `problematicRules[]` — filtered subset where low grade + elevated signal

2. Report a table sorted by signal strength (high/elevated first):

| Rule File                  | Grade | Matching Tasks | Local Attention Rate | Signal             | Status               |
| -------------------------- | ----- | -------------- | -------------------- | ------------------ | -------------------- |
| .claude/rules/testing.md   | C     | 12             | 58%                  | ⚠ high (2.4×)      | Low grade + high     |
| .claude/rules/bun-local.md | B     | 8              | 40%                  | ⚡ elevated (1.6×) | Moderate quality fit |
| .claude/rules/git.md       | A     | 15             | 30%                  | —                  | Well-understood      |

**Signal interpretation:**

- `⚠ high` (ratio ≥ 2.0×): Local attention rate is 2× higher than global — strong signal the rule is insufficient or unclear
- `⚡ elevated` (1.5–2.0×): 1.5–2× higher — worth investigating; workers may be struggling with the topic
- `—` (ratio < 1.5×): No signal — rule is well-understood relative to baseline
- `insufficient-data` (< 3 matching tasks): Cannot compute correlation

**Problematic rules** are flagged when:

- Grade is C or D (has issues)
- AND signal is high or elevated (affecting task success)

**Action items:**

- Problematic rules (low grade + high/elevated signal): "Rewrite rule — workers frequently struggle with this guidance"
- High-signal rules with B/A grades: No action (clear guidance, elevated attention may reflect inherent complexity)

If `fix` flag: for each problematic rule, call `create_idea`:
`"[introspect] Rewrite {rulePath} — grade {grade} + {signal} attention signal ({matchingTasks} tasks, {localAttentionRate}% attention rate)"`

---

## Phase 10: File Access Frequency (data-driven)

Call `query_file_access` with default parameters.

The tool output includes a `Covered?` column — files already referenced in CLAUDE.md
links or `.claude/rules/` content are marked Yes. Focus recommendations on uncovered
files with high task counts.

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

## Phase 11: Context Pressure Analysis (data-driven)

Call `analyze_context_pressure` with no parameters.

**If no data** (totalTasksWithSnapshots = 0):

> ⚠ No budget snapshots found. Context budget hook may not be active.

**If data exists**, render:

### Fleet Summary

| Metric                | Value                               |
| --------------------- | ----------------------------------- |
| Tasks with snapshots  | {totalTasksWithSnapshots}           |
| Average peak weighted | {averagePeakWeighted}               |
| Median peak weighted  | {medianPeakWeighted}                |
| Max peak weighted     | {maxPeakWeighted}                   |
| Coverage              | {covered}/{total} ({coverageRate}%) |

### High Pressure Tasks (peak > 150 weighted)

Table: taskId (short), title, type, status, peakWeighted, growthRate

Show top 20 if more exist. Sort by peakWeighted descending.

### Pressure by Task Type

| Type | Task Count | Avg Peak Weighted | High Pressure Count |
| ---- | ---------- | ----------------- | ------------------- |
| feat | 8          | 145               | 2                   |
| fix  | 5          | 130               | 0                   |

### Recommendations

Bullet list of recommendations from the analysis:

- "Low snapshot coverage (X%) — budget hook may not be active on all workers"
- "N high-pressure tasks detected — monitor context consumption closely"
- "Task {id} reached extreme pressure (>200 weighted) — urgent action needed"
- "{type} tasks average X weighted peak — review plan complexity"
- "N task(s) show steep context growth — may need /compact checkpoints"

**Grading**: Phase grade based on fleet health:

- A: No high-pressure tasks, coverage > 80%
- B: ≤2 high-pressure tasks, coverage > 60%
- C: 3-5 high-pressure tasks or coverage 40-60%
- D: >5 high-pressure tasks or coverage < 40%
- F: >10 high-pressure tasks or no snapshot data

---

## Output Format

```markdown
# Introspection Report — YYYY-MM-DD

## Summary

| Phase      | Status                           | Key Finding                         |
| ---------- | -------------------------------- | ----------------------------------- |
| Links      | pass/warn/fail                   | N broken links                      |
| Budget     | pass/warn/fail                   | ~N tokens overhead                  |
| Memories   | healthy/attention                | N overlaps, N stale                 |
| Rules      | A-D                              | N rules need work                   |
| Violations | hot-spots/clean/no data          | N hot patterns, M total violations  |
| Docs       | current/stale/stale+correlated   | N docs older than 90d, M correlated |
| Skills     | A-D                              | N skills need work                  |
| Timing     | pass/warn/attention              | N transitions, M bottlenecks        |
| Plans      | healthy/needs attention/degraded | N plans analyzed, M need work       |
| Attention  | healthy/elevated/high            | N attention events, M hot tasks     |
| Access     | data/no data                     | N files, M extraction candidates    |
| Patterns   | covered/gaps found/no data       | N patterns, M high-frequency        |

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
- Phase 4 requires 1 analyze_rule_quality call — cheap (single MCP tool call)
- Phase 4b requires 1 analyze_rule_violations call — cheap
- Phase 5 requires N git log calls + 1 `list_tasks` call (for failure correlation) — moderate context cost
- Phase 6 requires reading ~3-4 command files — cheap
- Phase 7 requires 1 analyze_phase_timings call — cheap
- Phase 8 requires 1 list_tasks call + plan text analysis (no extra calls) — cheap
- Phase 9 requires 1 analyze_attention call — cheap
- Phase 10 requires 1 query_file_access call — cheap (single MCP tool call)
- Phase 11 requires 1 analyze_context_pressure call — cheap

For single-phase runs, skip the summary table and just show that phase's detail.

---

## Examples

- /introspect -> full evaluation, all phases, inline output
- /introspect links -> just check broken links
- /introspect memories fix -> evaluate memories and auto-consolidate/decay
- /introspect rules -> evaluate rule file quality
- /introspect violations -> rule violation hot-spot analysis
- /introspect violations fix -> analyze violations and log ideas for hot patterns
- /introspect all report -> full evaluation, save report
- /introspect all fix report -> full evaluation, auto-fix, save report
- /introspect timing -> phase duration analysis across completed tasks
- /introspect attention -> attention pattern analysis across all tasks
- /introspect attention fix -> analyze attention patterns and log ideas for high-frequency patterns
- /introspect access -> file access frequency analysis from archived tool call data
- /introspect access fix -> file access analysis + create ideas for uncovered high-frequency files
- /introspect patterns -> uncovered pattern analysis from task history
- /introspect patterns fix -> analyze patterns and create ideas for high-frequency gaps
