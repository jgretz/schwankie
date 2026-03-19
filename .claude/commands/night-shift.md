Autonomous overnight orchestrator. Promote the backlog, shepherd tasks through the pipeline, auto-merge low-risk PRs.

No new tools needed — uses existing MCP tools + `gh` CLI.

## Phase 1: Kick-off

1. Call `list_tasks` with `status: "planned"` and `detail: "summary"`
2. Filter to tasks where `blockedBy` is empty
3. For tasks with `needsAttention: true`, triage the attention (see §2c rules) — resolve if non-human-requiring
4. Promote unblocked tasks to `ready` via `update_task` with `status: "ready"` — the scheduler handles starting
5. Also check `list_tasks` with `status: "ready"` — triage any `needsAttention` flags blocking scheduler pickup
6. Log how many tasks were promoted

The scheduler auto-starts `ready` tasks when slots are available. Existing auto-start-on-complete handles downstream dependency chains — don't manage that here.

## Phase 2: Orchestration Loop

Repeat every ~90 seconds until exit conditions are met.

Each cycle, run these steps in order:

### 2a. Auto-merge candidates

Scan `user_review` tasks for merge-eligible PRs:

1. Call `list_tasks` with `status: "user_review"` and `detail: "full"`
2. For each task with a `prUrl` and `needsAttention: false`:

   **Parse review signals** from the task:
   - Try to parse `handoffContext` as JSON to extract `verdict`, `score`, `complexity`, `risk`
   - Fall back to `reviewScore` and `reviewSummary` if handoffContext is missing or unparseable

   **Check eligibility** — ALL must be true for structured handoff path:
   - `verdict` is `"APPROVED"`
   - `score >= 7`
   - `complexity` is `"low"` or `"medium"`
   - `risk` is NOT `"high"`
   - `needsAttention` is `false`

   **Fallback path** (no structured handoff available):
   - `reviewScore >= 8`
   - PR diff is < 300 lines changed AND < 8 files
   - Check diff size: `gh pr diff <url> --stat | tail -1`

   **Hard blocks** — never auto-merge if ANY is true:
   - `complexity` is `"high"`
   - `risk` is `"high"`
   - `needsAttention` is `true`

   **Check PR status** for eligible tasks:

   ```
   gh pr view <url> --json mergeable,statusCheckRollup,reviewDecision
   ```

   - `mergeable` must be `"MERGEABLE"`
   - All `statusCheckRollup` entries must have `conclusion: "SUCCESS"` (or be empty)
   - `reviewDecision` must NOT be `"CHANGES_REQUESTED"`

   **Merge** if all checks pass:

   ```
   gh pr merge <url> --squash --delete-branch
   ```

   Then call `update_task` with a note: `"[night-shift] Auto-merged: score=<N>, complexity=<level>, risk=<level>"`

   **Skip** if any check fails:
   Call `update_task` with a note: `"[night-shift] Skipped auto-merge: <reason>"`

   **Never** call `complete_task` directly — the merge-watcher daemon detects the merge and handles completion.

### 2b. Catch stragglers

Call `list_tasks` with `status: "planned"` and `detail: "summary"`. Promote any tasks with empty `blockedBy` to `ready` via `update_task` (edge case: tasks became unblocked mid-cycle via dependency completion).

### 2c. Triage attention flags

Check for tasks with `needsAttention: true` across all active statuses. For each flagged task, read the attention message and decide:

**Resolve immediately** (these don't need a human):
- Daemon timeouts on `submit_for_review` or `complete_review` — the operation usually completed despite the timeout
- Stale planner clarification questions — the plan is already written and the task is planned/ready
- Mechanical issues — worker crashed and was auto-recovered, worktree cleanup messages
- Worker self-reported "implementation complete" but couldn't transition — manually transition if appropriate

**Escalate to human** (leave `needsAttention` unresolved):
- Architectural tradeoffs requiring human judgment
- Security concerns
- Ambiguous requirements where multiple valid interpretations exist
- Repeated arbitration failures (same task flagged after prior night-shift intervention)

When resolving, call `update_task` with `resolveAttention: true` and optionally a note explaining the resolution.

### 2d. Crash detection

Track tasks that transitioned to `paused` since the last cycle:

1. At the start of each cycle, record the set of task IDs currently in `executing`
2. At the end of the cycle, call `list_tasks` with `status: "paused"` — any task now `paused` that was in the previous cycle's `executing` set is a worker crash
3. Increment the session crash counter for each new crash
4. Log the crash: `"[night-shift] Crash detected: task <id> transitioned from executing → paused"`

### 2e. Re-engage BLOCKED tasks

For each `user_review` task already fetched in step 2a:

1. Skip tasks without a `prUrl`
2. Parse `handoffContext` as JSON to extract `verdict` and `findings`. If `handoffContext` is missing, empty, or not valid JSON, skip the task — nothing to post.
3. If `verdict` is NOT `"BLOCKED"`, skip
4. **Dedup guard**: if the task already has a note containing `"[night-shift] Posted BLOCKED findings"`, skip — the comment was already posted; wait for the worker to address it
5. Compose the PR comment body:

   ```
   ## Reviewer Findings (BLOCKED)

   The automated reviewer flagged the following issues that need to be addressed:

   - **[<tier>]** <description>    ← for each finding, sorted by tier descending (T4 first)

   Please address these findings and push your changes.
   ```

6. Write the comment body to a temp file and post it:
   ```
   printf '%s' "<composed body>" > /tmp/blocked-findings.md
   gh pr comment <prUrl> --body-file /tmp/blocked-findings.md
   rm /tmp/blocked-findings.md
   ```
7. Call `update_task` with a note: `"[night-shift] Posted BLOCKED findings as PR comment for worker re-engagement"`
8. Increment the session `blocked-reengaged` counter

The pr-monitor daemon will detect the new PR comment and automatically restart the worker — no further action needed here.

### 2f. Detect stuck workers

Track executing tasks across cycles. A worker is "stuck" if:
- It has been in `executing` with `needsAttention: true` for **5+ consecutive cycles** (~7.5 min)
- OR its PR has had **no new commits for 10+ cycles** (~15 min) while still in executing

When a stuck worker is detected:

1. Read the task's unresolved attention messages and handoff context to understand what's blocking
2. Send a precise `directive` message via `send_message` with specific instructions (file paths, exact fix needed)
3. Call `restart_task` to give the worker a fresh context with the directive in its inbox
4. Call `update_task` with `note: "[night-shift] Restarted stuck worker with directive: <summary>"`

Only intervene once per task per session. If the same task gets stuck again after a restart+directive, log it and move on — the health monitor will handle further recovery.

### 2g. Clean up stale worktrees

When a task fails to start due to a stale branch or worktree (error contains "branch already exists" or "worktree already in use"):

1. Remove the stale worktree: `git worktree remove <path> --force`
2. Delete the stale branch: `git branch -D <branch>`
3. The scheduler will retry the task on its next cycle

Only clean up worktrees for tasks that are in `ready` status and failed to start — never touch worktrees for active executing tasks.

### 2h. Status line

Print a compact one-line summary each cycle:

```
[night-shift] cycle N | executing: X | agent_review: X | user_review: X (Y merge-eligible) | attention: X | merged: X | arbitrated: X | crashed: X | blocked-reengaged: X
```

### 2i. Context hygiene

Run `/compact` every 10 cycles with a summary of actions taken so far (cycle count, tasks started, PRs merged/skipped, crashes detected). This prevents context exhaustion during long overnight runs. No need to include arbitrated task IDs — the once-per-task guard in step 2j uses persisted task notes, not conversation context.

### 2j. Arbitrate agent_review disputes

Check for `agent_review` tasks stuck in a worker/reviewer disagreement:

1. Call `list_tasks` with `status: "agent_review"` and `detail: "full"`
2. For each task where `needsAttention: true`:

   **Identify dispute** — look for worker-targeted attention messages (reviewer requested changes).
   Skip tasks where the most recent note is `re-engaged worker to address reviewer feedback`
   (the pr-monitor already handled it — give the worker time to respond).

   **Gather evidence**:
   - Read the PR diff: `gh pr diff <prUrl>`
   - Read reviewer comments: `gh pr view <prUrl> --json comments,reviews`
   - Read the task's `handoffContext` for structured findings (tier, category, description)
   - Read the task's `plan` for acceptance criteria

   **Evaluate each finding**:
   For each reviewer finding (from handoffContext JSON or PR comments):
   - Is the finding supported by evidence in the diff?
   - Does it cite a real code quality issue, bug, or plan violation?
   - Or is it subjective, speculative, or outside the task's scope?

   **Rule**:
   - If **any T3/T4 finding is legitimate** → side with the reviewer
   - If **all findings are T1/T2 or unsupported** → override the reviewer
   - When in doubt, side with the reviewer (safer default)

   **If siding with worker (override reviewer)**:
   1. Post a PR comment: `gh pr comment <prUrl> -b "[night-shift] Arbitration: overriding reviewer. <reasoning for each dismissed finding>"`
   2. Call `update_task` with:
      - `status: "reflection"`
      - `note: "[night-shift] Arbitrated dispute — overrode reviewer: <brief reason>"`
      - `reviewScore: <your assessment 0-10>`
      - `reviewSummary: "APPROVED by night-shift arbitration | score:<N>/10 | <reason>"`
      - `resolveAttention: true`

   **If siding with reviewer (direct worker to fix)**:
   1. Post a PR comment: `gh pr comment <prUrl> -b "[night-shift] Arbitration: directing worker to fix. <reasoning for each finding being upheld>"`
   2. Call `send_message` with `task_id`, `message_type: "directive"`, and content explaining
      which specific findings to address (reference the finding tiers and descriptions)
   3. Call `restart_task` with the task ID — this transitions to `executing` and the worker
      reads the directive from inbox on start
   4. Call `update_task` with `note: "[night-shift] Arbitrated dispute — directed worker to address reviewer findings"` and `resolveAttention: true`

   **Safety**: Only arbitrate once per task. Before arbitrating, check the task's `notes`
   array for any note containing `"[night-shift] Arbitrated dispute"`. If found, this task
   was already arbitrated — call `update_task` with
   `attentionMessage: "Arbitration recurring for task <id> — needs human review"` and
   `attentionTarget: "human"`, then skip. This note-based guard survives `/compact`
   because notes are persisted in the DB, not in conversation context.

## Phase 3: Exit Conditions

Exit the loop when ALL of these are true:

- No tasks in `executing` or `agent_review`
- No merge-eligible tasks in `user_review`
- No startable `planned` tasks (empty `blockedBy`)

OR when 8 hours have elapsed since the command started (hard timeout).

On exit, gather a full session snapshot and print a structured morning report.

**Data gathering** — before printing the report:

1. Call `list_tasks` with `detail: "full"` across statuses: `done`, `user_review`, `executing`, `paused`, `agent_review`
2. Filter to tasks with `[night-shift]` notes to identify session activity
3. Identify tasks that transitioned to `paused` during the session (worker crashes)
4. Identify tasks still stuck in `executing` (stalled workers)

**Report format** (~40 lines max — group if >5 tasks in a category):

```
## [night-shift] Morning Report — YYYY-MM-DD
Duration: Xh Ym | Tasks promoted: N | PRs merged: N | PRs skipped: N

### What Happened
- Promoted: <task titles + IDs>
- Merged: <task titles + IDs, with score/complexity from merge notes>
- Skipped: <task titles + IDs, with skip reason>
- BLOCKED re-engaged: <task titles + IDs, with PR comment posted>
- Arbitrated: <task titles + IDs, with verdict (overrode reviewer / directed worker)>
- Stuck workers restarted: <task titles + IDs, with directive summary>
- Still in flight: <task titles + IDs + current status>

### What Went Well
- <e.g., "3 PRs merged cleanly on first review cycle">
- <e.g., "Dependency chain task-A → task-B → task-C unblocked and completed automatically">

### What Went Poorly
- <e.g., "task-X crashed twice (paused), attention flagged: <reason>">
- <e.g., "task-Y stuck in executing for 6 cycles — possible worker hang">

### Observations
- <systemic patterns worth investigating>
- <recurring attention flags>
- <dependency insights>
```

**Synthesis rule**: "What Went Well", "What Went Poorly", and "Observations" must contain the agent's analysis — not a repeat of raw data from "What Happened". If nothing notable occurred, write "Nothing notable."

## Safety Rails

- Never auto-merge `high` complexity or `high` risk — no exceptions
- Never auto-merge when `needsAttention` is true
- Never call `complete_task` — delegate to merge-watcher
- Every merge/skip decision is appended as a `note` via `update_task` for auditability
- Every BLOCKED PR comment is preceded by a dedup check — never post the same findings twice
- Run `/compact` every ~10 cycles to prevent context exhaustion
- Arbitrate at most once per task (checked via `[night-shift] Arbitrated dispute` note) — if the dispute recurs, log and defer to human
- Post the reasoning as a PR comment for auditability before taking action
- Only clean up worktrees for `ready` tasks that failed to start — never for active tasks

## Relationship to Existing Daemons

Night-shift works alongside all daemons — it replaces nothing:

| Gap                                 | Who fills it               |
| ----------------------------------- | -------------------------- |
| Promote planned tasks to ready      | **Night-shift**            |
| Triage attention flags              | **Night-shift**            |
| Decide to merge PRs                 | **Night-shift**            |
| Detect & unstick stalled workers    | **Night-shift**            |
| Start ready tasks                   | scheduler (unchanged)      |
| Detect merge → complete task        | merge-watcher (unchanged)  |
| Detect PR comments → restart worker | pr-monitor (unchanged)     |
| Detect crashes → restart            | health-monitor (unchanged) |
