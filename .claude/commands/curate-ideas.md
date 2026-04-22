Curate the ideas backlog — consolidate duplicates, score unscored ideas, prune stale entries.

## Worksite CLI

Every worksite tool below (`list_ideas`, `update_idea`, `delete_idea`, `promote_idea`) is invoked as a `worksite` CLI subcommand via Bash:

```
worksite call <tool_name> --json '<json body>'
```

Example: "call `list_ideas`" → `worksite call list_ideas --json '{}'`.
Example: "call `delete_idea`" → `worksite call delete_idea --json '{"id":"<idea-id>"}'`.

## Arguments

`$ARGUMENTS` controls the mode:

- *(empty)* — full curation: merge, score, and prune
- `score` — only score unscored ideas
- `prune` — only delete stale/implemented ideas
- `dry-run` — analyze and report without making changes

## Phase 1: Fetch

1. Call `list_ideas` to get all ideas
2. Filter to unlinked ideas (`taskId` is null) — linked ideas are already promoted to tasks
3. If no unlinked ideas exist, report "No ideas to curate" and stop

## Phase 2: Analyze

Read each idea's prompt and group them by intent. Two ideas are duplicates when they describe the same change, one subsumes the other, or they address overlapping scope.

For each idea, also assess:

- **Staleness**: Has this already been implemented? Check the codebase — grep for the feature/fix described, check recent git history, check rules/docs. If the work is done, mark it for pruning.
- **Relevance**: Is this still applicable given current architecture? If the system has changed in a way that makes the idea moot, mark for pruning.
- **Actionability**: Is the prompt specific enough to plan from? Vague wishes ("improve performance") score lower than concrete next steps ("add index on task_events.task_id for query optimization").
- **Impact**: How much does this improve the system? Core infrastructure > developer experience > nice-to-have polish.

## Phase 3: Consolidate (skip in `score` and `prune` modes)

For each group of duplicate/overlapping ideas:

1. Pick the most specific and complete prompt as the keeper
2. Merge useful details from other prompts into the keeper via `update_idea`
3. Delete the duplicates via `delete_idea`

## Phase 4: Score (skip in `prune` mode)

For each remaining idea with `impact` of null, assign a score 1-5:

| Score | Meaning |
|-------|---------|
| 5 | Critical — blocks other work or fixes a significant system issue |
| 4 | High — meaningful improvement to core functionality |
| 3 | Medium — useful enhancement, clear value |
| 2 | Low — nice-to-have, minor improvement |
| 1 | Minimal — speculative, vague, or marginal value |

Call `update_idea` with the `impact` score for each.

For ideas that already have an impact score, re-evaluate only if the codebase state has changed the idea's relevance. Don't churn scores without reason.

## Phase 5: Prune (skip in `score` mode)

Delete ideas marked as stale or irrelevant in Phase 2. For each:

1. Verify the assessment — briefly confirm the feature exists or the idea is moot
2. Call `delete_idea`
3. Record the reason for the report

Do NOT prune ideas that are merely low-impact — pruning is for ideas that are no longer valid, not ideas that are low priority.

## Phase 6: Report

Print a markdown summary:

```
## Ideas Curation Report

**Before**: N ideas | **After**: N ideas | **Net**: -N

### Duplicates Merged (N groups)
- Kept: "prompt..." (id) ← merged from: id1, id2
- ...

### Scored (N ideas)
| Impact | Count |
|--------|-------|
| 5      | N     |
| 4      | N     |
| 3      | N     |
| 2      | N     |
| 1      | N     |

### Pruned (N ideas)
- "prompt..." (id) — reason: already implemented in commit abc123
- ...

### Remaining Ideas (by impact)
| Impact | ID | Prompt |
|--------|----|--------|
| 5      | xx | ...    |
| ...    |    |        |
| —      | xx | ...    | ← unscored
```

In `dry-run` mode, prefix the report with `## DRY RUN — no changes made` and use "Would merge", "Would score", "Would prune" language.

## Safety

- Never delete an idea that is linked to a task (`taskId` is not null)
- Never delete an idea just because it has low impact — only prune stale/moot ideas
- In dry-run mode, make zero `update_idea` or `delete_idea` calls
- If uncertain whether an idea is stale, keep it and score it low rather than deleting
