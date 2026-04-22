Conduct a senior developer/architect code review.

If `~/.claude/rules/review-criteria.md` exists, read it for evaluation criteria and grading scale.
Otherwise use these default categories: Architecture, Code Quality, Design Patterns, Testing, Naming & Docs (grading scale A–F).

## Arguments: $ARGUMENTS

Parse arguments:

- Scope:
  - (empty or "diff") -> git diff --cached or git diff if nothing staged
  - "codebase" -> all source files in apps/ and packages/ (or src/ if no monorepo)
  - specific path -> that path only
- Flags (codebase scope only):
  - "fresh" -> ignore cached state, force full re-review
  - "rules" -> after Phase 5 analysis, auto-create ideas for each rule gap using create_idea
- Output:
  - (default) -> inline findings, work through issues interactively
  - "report" -> generate .claude/reviews/YYYY-MM-DD-HHmm.md summary

## Review Process (diff / path scope)

1. Gather code based on scope
   1.5. React detection: check if any files in scope are `.tsx`, `.jsx`, or contain React imports. If so, invoke `Skill(skill: "vercel-react-best-practices")` to load Vercel's React performance guidelines into context.
2. Evaluate against each category in review-criteria.md (plus React Performance if React detected)
3. Assign letter grade (A-F) per category
4. Calculate overall grade (weighted average)
5. List specific findings with file:line references

## Codebase Strategy (codebase scope only)

### Phase 1: Discover & Partition

- List all apps/ and packages/ directories
- Count source files per component (exclude node_modules, generated, tests)
- Classify: Large (50+ files), Medium (10-49), Small (<10)
- Priority order: shared packages first (highest leverage), then apps by size, utilities last

### Phase 1.5: Incremental Detection (codebase scope only)

- Check for `.claude/reviews/current.md`
- If missing or `fresh` flag: proceed to full Phase 2 (all components)
- If present:
  1. Parse git SHA from `<!-- review-meta: sha=... -->` comment on line 1
  2. Run `git diff --name-only <sha>..HEAD` to get changed files
  3. Map changed files to components (apps/X, packages/X)
  4. **Changed components** → queue for Phase 2 re-review
  5. **Unchanged components** → carry forward prior grades and findings verbatim
  6. If no files changed → report "No changes since last review (sha)" and stop

### Phase 2: Component Reviews (parallel)

- Use subagents (Task tool, subagent_type=general-purpose) to review components in parallel
- Each subagent gets: component path, review-criteria categories, instruction to read key files and grade
- Each subagent should check if its component contains `.tsx`, `.jsx`, or React imports; if so, invoke `Skill(skill: "vercel-react-best-practices")` and include a **React Performance** row in its grade table
- Each produces: component grade table + findings list
- Batch subagents by tier (packages, then large apps, then small) — collect all results before Phase 3

### Phase 3: Cross-Cutting Analysis (always runs fresh)

After component reviews, evaluate codebase-level concerns that diff reviews can't catch:

1. **Dependency Flow** — apps import only from packages? No circular deps? Domain has zero app imports?
2. **Pattern Consistency** — Same problems solved same way across apps? (error handling, auth, API clients)
3. **Duplication** — Identical/near-identical code across apps that should be shared
4. **Architecture Boundaries** — Business logic in domain, not apps? Protocol concerns out of packages?
5. **Testing Distribution** — Which components have coverage? Are gaps in high-risk areas?

### Phase 4: Persist State (codebase scope only)

After generating final output, overwrite `.claude/reviews/current.md` with:

- Line 1: `<!-- review-meta: sha=<HEAD SHA> date=<ISO timestamp> -->`
- Merged component grades (re-reviewed + carried forward)
- Fresh cross-cutting findings from Phase 3
- Updated top issues list
- Use the same output format as the codebase scope output below

This happens for every codebase review (full or incremental). When `report` is also passed, write both the state file and the timestamped report.

### Phase 5: Rule Gap Analysis (codebase scope only)

After Phase 4, scan findings for recurring patterns that lack a corresponding rule:

1. Collect all findings with severity medium or higher from Phase 2 and Phase 3
2. List all rule files in `.claude/rules/` (use `Bun.Glob` with `dot: true` or equivalent to catch hidden directories)
3. For each medium+ finding, determine if an existing rule addresses the pattern:
   - Match by topic: e.g., "unstable callback passed as prop" → look for a rule about callback stability or React render behavior
   - If a rule covers it: no action needed
   - If no rule covers it: tag as a "rule gap"
4. Group rule gaps by theme (e.g., "callback stability", "test coverage expectations", "component size limits")
5. For each theme, propose one of:
   - **New rule file**: `.claude/rules/<theme>.md` with a summary of key points to encode
   - **Update to existing rule**: name the file and describe the specific addition
6. Output the "Rule Gaps" section (see output format below)
7. If the `rules` flag is present:
   - For each rule gap, run `worksite call create_idea --json '{"prompt":"Add rule: <theme> — <key points summary>"}'`
   - Report how many ideas were created at the end of the Rule Gaps section

## Output Format — diff / path scope

## Code Review - [scope]

**Overall Grade: [X]**

Note: include the React Performance row only when `.tsx`/`.jsx` or React imports are in scope; omit it entirely otherwise.

| Category          | Grade | Notes |
| ----------------- | ----- | ----- |
| Architecture      |       |       |
| Code Quality      |       |       |
| Design Patterns   |       |       |
| Testing           |       |       |
| Naming & Docs     |       |       |
| React Performance |       |       |

### Findings

#### [Category] - [Grade]

- file:line - [issue description]

## Output Format — codebase scope

## Codebase Review

**Overall Grade: [X]**

### Component Grades

Note: populate React Perf\* for components with `.tsx`/`.jsx`/React imports; use "n/a" for all others.

| Component       | Arch | Quality | Patterns | Testing | Naming | React Perf\* | Overall |
| --------------- | ---- | ------- | -------- | ------- | ------ | ------------ | ------- |
| packages/domain |      |         |          |         |        |              |         |
| apps/api        |      |         |          |         |        |              |         |
| ...             |      |         |          |         |        |              |         |

### Cross-Cutting Findings

| Category                | Grade | Findings |
| ----------------------- | ----- | -------- |
| Dependency Flow         |       |          |
| Pattern Consistency     |       |          |
| Duplication             |       |          |
| Architecture Boundaries |       |          |
| Testing Distribution    |       |          |

### Top Issues (prioritized, max 10)

| #   | Component | Category | Issue | Severity |
| --- | --------- | -------- | ----- | -------- |
| 1   |           |          |       |          |
| ... |           |          |       |          |

### Rule Gaps

Findings with no matching rule in `.claude/rules/`. Default behavior: report only. With `rules` flag: ideas auto-created via `create_idea`.

| Theme                    | Suggested Rule File          | Key Points                                                                                  |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------- |
| e.g., callback stability | `.claude/rules/callbacks.md` | Never pass inline arrow functions as stable refs; use useCallback or module-level functions |
| ...                      |                              |                                                                                             |

_(Omit this section entirely if all medium+ findings are covered by existing rules.)_

## Examples

- /review -> review staged/unstaged diff, inline
- /review codebase -> incremental review (only changed components), inline
- /review codebase fresh -> full re-review ignoring cached state, inline
- /review codebase report -> incremental review, save report + update state
- /review codebase fresh report -> full re-review, save report + update state
- /review codebase rules -> incremental review + Rule Gaps section; auto-create ideas for each gap
- /review codebase fresh rules -> full re-review + Rule Gaps section with ideas
- /review codebase fresh report rules -> full re-review, save report, auto-create rule gap ideas
- /review packages/auth -> review specific path (no state interaction)
