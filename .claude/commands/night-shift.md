Autonomous overnight orchestrator. Promote the backlog, shepherd tasks through the pipeline, auto-merge low-risk PRs.

## Worksite CLI

Every worksite operation referenced below (`list_tasks`, `update_task`, `restart_task`, `promote_idea`, `get_task`, `slack_*`, etc.) is invoked as a `worksite` CLI subcommand via Bash:

```
worksite call <tool_name> --json '<json body>'
worksite call <tool_name> --stdin <<'JSON'    # heredoc for long payloads
{...}
JSON
```

Example: "call `list_tasks` with `status: 'planned'`" → `worksite call list_tasks --json '{"status":"planned","detail":"summary"}'`.

Example: "call `update_task` with a note" → `worksite call update_task --json '{"id":"<task-id>","note":"..."}'`.

Use `gh` CLI for GitHub operations as usual.

## Phase 1: Kick-off

1. Call `list_tasks` with `status: "planned"` and `detail: "summary"`
2. Filter to tasks where `blockedBy` is empty
3. For tasks with `needsAttention: true`, triage the attention (see §2c rules) — resolve if non-human-requiring
4. Promote unblocked tasks to `ready` via `update_task` with `status: "ready"` — the scheduler handles starting
5. Also check `list_tasks` with `status: "ready"` — triage any `needsAttention` flags blocking scheduler pickup
6. Log how many tasks were promoted
7. Call `slack_status` with `repo` and `summary_type: "pipeline"` to post the initial
   pipeline state to Slack. This creates the session's anchor message in the channel.
   If the tool returns an error (Slack not configured), log a warning and continue
   without Slack — all Slack steps below become no-ops for this session.

Track a session variable: `slackAvailable = true/false` based on whether the `slack_status` call succeeded. All subsequent Slack steps are gated on this flag.

The scheduler auto-starts `ready` tasks when slots are available. Existing auto-start-on-complete handles downstream dependency chains — don't manage that here.

## Phase 2: Orchestration Loop

Repeat every ~90 seconds until exit conditions are met.

**CRITICAL**: Never stop between steps within a cycle. Never stop between cycles. After every tool call result, immediately proceed to the next action. The only valid stopping points are: (1) the exit conditions in Phase 3, or (2) a fatal error per the Error Resilience section. If a step produces an error, log it and move to the next step. If a cycle has nothing to do, print the status line and start the sleep for the next cycle. There is no human watching — pausing accomplishes nothing.

Each cycle, run these steps in order:

### 2a-0. Check Slack inbox

Call `slack_check` with `repo` to read pending inbound messages. For each message:

- **Top-level channel command**: Parse and execute if recognized:
  - "pause" → stop promoting new tasks, log note
  - "resume" → resume promoting tasks
  - "status" → call `slack_status` immediately (out-of-cycle report)
  - "help" → reply via `slack_post` with a formatted command reference table, listing each command with a one-line description:
    ```
    Available commands:
    • `help` — Show all available commands with descriptions
    • `pause` — Stop promoting new tasks to ready. In-flight tasks continue.
    • `resume` — Resume promoting tasks (reverses pause).
    • `status` — Post an immediate pipeline status report.
    • `merge <task-id>` — Add a task to the manual merge override list.
    • `restart <task-id>` — Restart a task execution.
    • `promote <idea-id>` — Promote an idea to a ready task.
    • `dismiss <task-id>` — Archive a task (removes from pipeline).
    • `attention <task-id>` — List unresolved attention flags for a task.
    ```
  - "merge <task-id>" → add task to manual merge override list
  - "restart <task-id>" → call `restart_task` with the task ID
    - On success, reply via `slack_post`: "✓ Task <id> restarted"
    - On error, reply via `slack_post`: "✗ Failed to restart task <id>: <error message>"
  - "promote <idea-id>" → call `promote_idea` with the idea ID, default type "feat", default status "ready"
    - On success, reply via `slack_post`: "✓ Idea <id> promoted to task <task-id>"
    - On error, reply via `slack_post`: "✗ Failed to promote idea <id>: <error message>"
  - "dismiss <task-id>" → call `update_task` with `status: "archived"`
    - On success, reply via `slack_post`: "✓ Task <id> archived"
    - On error, reply via `slack_post`: "✗ Failed to archive task <id>: <error message>"
  - "attention <task-id>" → call `get_task` with the task ID and `detail: "full"`, extract unresolved `attentionMessages`
    - If no unresolved attention, reply via `slack_post`: "Task <id> has no unresolved attention flags"
    - If attention found, reply via `slack_post` with formatted list: "Task <id> attention flags:\n• <message 1>\n• <message 2>..."
    - On error, reply via `slack_post`: "✗ Failed to fetch attention for task <id>: <error message>"
  - Unrecognized → attempt fuzzy/prefix matching:
    - If the input is a close prefix/substring of a known command (e.g., "statu" → "status", "pro" → "promote"), reply via `slack_post`: "Unknown command: <text>. Did you mean: `<closest-match>`?" followed by the full command reference list
    - If no close match, reply via `slack_post`: "Unknown command: <text>." followed by the full command reference list

- **Thread reply (human answering a `slack_ask` question)**: The daemon poller
  handles routing answers to `decisionAnswer` on tasks. Night-shift just needs
  to check if any previously-asked decisions are now answered and act on them.

- **Thread reply (general comment)**: Log as a task note via `update_task`.

If `slackAvailable` is false, skip this step entirely.

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
   gh pr merge <url> --squash
   ```

   Do NOT use `--delete-branch` — the local branch is owned by the worktree and cannot be deleted until the worktree is cleaned up. The remote branch is deleted automatically by GitHub's branch protection settings. Using `--delete-branch` causes a spurious exit code 1 on every merge.

   **Pacing**: Wait 5 seconds between sequential merges (`sleep 5`) to allow GitHub to update the base branch. This prevents the next PR's squash-merge from failing due to a stale base ref. Skip the delay after the last (or only) merge in the batch.

   Then call `update_task` with a note: `"[night-shift] Auto-merged: score=<N>, complexity=<level>, risk=<level>"`

   **Already merged**: If `gh pr merge` fails with "was already merged", treat it as success — the merge-watcher will handle completion. Log a note and move on.

   **After merging**: Run `git pull --rebase origin main` to keep the local main up to date. The scheduler creates worktrees from local main — if it's stale, new tasks can't start. Do this after each merge or batch of merges.

   **Skip** if any check fails:
   Call `update_task` with a note: `"[night-shift] Skipped auto-merge: <reason>"`

   **Never** call `complete_task` directly — the merge-watcher daemon detects the merge and handles completion.

### 2b. Catch stragglers and promote unblocked planned tasks

Call `list_tasks` with `status: "planned"` and `detail: "summary"`. For each task, check:

1. If `blockedBy` is empty AND `needsAttention` is `false`:
   - Call `update_task` with `status: "ready"` to promote the task
   - Increment promotion counter

2. If `blockedBy` is not empty OR `needsAttention` is `true`:
   - Skip (still blocked or has unresolved attention requiring human review)

After processing all planned tasks, log a summary: `"[night-shift] Promoted N planned tasks to ready (unblocked and no attention flags)"`

This handles the edge case of tasks becoming unblocked mid-cycle via dependency completion — night-shift actively promotes them so the scheduler picks them up on the next cycle.

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

In addition to leaving `needsAttention` unresolved, if `slackAvailable` is true, call `slack_ask` with the task's attention message and relevant decision options:

```
For architectural tradeoffs:
  slack_ask({
    repo, task_id, question: "Task <id>: <attention message>",
    options: ["approve", "reject", "defer"]
  })

For ambiguous requirements:
  slack_ask({
    repo, task_id, question: "Task <id>: <attention message>",
    options: ["option A description", "option B description"]
  })
```

The daemon poller routes the human's Slack reply back as a `decisionAnswer`. Night-shift picks it up via `slack_check` on the next cycle and can act on it (resolve attention, adjust plan, etc.). If `slackAvailable` is false, fall through to existing behavior (leave for HUD).

When resolving, call `update_task` with `resolveAttention: true` and optionally a note explaining the resolution.

### 2c-i. Triage stale worker-targeted attention

Auto-resolve worker-targeted attention messages that predate the current session (i.e., became stale between the prior session and this one). Workers restarted by night-shift shouldn't waste effort on old feedback that's no longer relevant.

1. Call `list_tasks` with `status: "executing"` and `detail: "full"`, and separately with `status: "agent_review"` and `detail: "full"`
2. For each task, check the `attentionMessages` array
3. For each unresolved attention message where `target === 'worker'`:
   - Parse `createdAt` timestamp and compare to session start time
   - If `createdAt` is older than session start, mark for resolution
4. For each stale worker-targeted attention message, call `update_task` with:
   ```
   {
     id: taskId,
     resolveAttention: true,
     note: "[night-shift] Auto-resolved stale worker attention from prior session"
   }
   ```
5. Log: `"[night-shift] Resolved <N> stale worker-targeted attention messages"`

**Note**: Human-targeted attention (`target: 'human'`) is never auto-resolved — it requires human judgment regardless of age.

### 2d. Crash detection

Track tasks that transitioned to `paused` since the last cycle:

1. At the start of each cycle, record the set of task IDs currently in `executing`
2. At the end of the cycle, call `list_tasks` with `status: "paused"` — any task now `paused` that was in the previous cycle's `executing` set is a worker crash
3. Increment the session crash counter for each new crash
4. Log the crash: `"[night-shift] Crash detected: task <id> transitioned from executing → paused"`

### 2d-i. Detect ghost panes

Call the `detect_ghost_panes` MCP tool to find tmux panes for tasks no longer in active statuses:

1. Call MCP tool `detect_ghost_panes` with the repo path
2. For each ghost pane returned:
   - Log: `"[night-shift] Ghost pane detected: paneId=<id>, taskId=<taskId>, taskStatus=<status>"`
3. Increment the session `ghost-panes-detected` counter

Ghost panes are killed by pane-gc's main cycle — night-shift logs them proactively so operators can monitor pane health each cycle.

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

### 2f-i. Detect stuck reviewers

A task in `agent_review` with no status change for **4+ consecutive cycles** (~6 min) is likely stuck. Don't wait for `needsAttention` — reviewer crash-loops don't always set it.

After 4 cycles of no movement:

1. Check the scheduler log via `daemon_status` for repeated "Reviewer restarted" entries
2. Read PR reviews via `gh pr view <prUrl> --json reviews` to understand the blocker
3. Diagnose and intervene:
   - **Stale PR diff** (reviewer keeps flagging files that match main): push an empty commit to refresh the diff, then restart reviewer
   - **Legitimate blocker the worker won't fix**: arbitrate per §2j rules
   - **Reviewer crash-looping without completing**: flag attention for human investigation

This applies to all statuses that involve agent processing — don't passively poll for 30+ cycles waiting for a flag that never comes.

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

Every 5th cycle (`cycle % 5 === 0`), if `slackAvailable` is true, call `slack_status` with `repo` and `summary_type: "cycle"` to post a compact cycle summary to Slack. Include: cycle number, counts by status, merges this session, attention flags, crashes detected. This avoids spamming Slack every 90 seconds while still providing regular updates.

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
   - If **any T2/T3/T4 finding is legitimate** → side with the reviewer
   - If **all findings are T1 or unsupported** → override the reviewer
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

**Gate check — verify before exiting.** Before printing the morning report, call `list_tasks` for statuses `executing`, `agent_review`, and `user_review`. If ANY task exists in those statuses, DO NOT exit — return to Phase 2. The morning report is the LAST thing night-shift prints. Printing it means the session is over. Never print it as a "progress update."

**Do not reason about session duration.** The 8-hour timeout is enforced by cycle count (~320 cycles), not by the agent deciding it's been "long enough." Do not narrate elapsed time ("approaching X hours", "session is getting long"). Duration is tracked in /compact summaries — that is sufficient. Commentary about duration biases toward premature exit.

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

After printing the morning report, if `slackAvailable` is true, call `slack_status` with `repo`, `summary_type: "morning_report"`, and the morning report content as the `body` parameter. This posts the full morning report to the Slack channel as a final message.

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
- All Slack calls are gated on `slackAvailable` — if the initial `slack_status` fails
  (Slack not configured), all Slack operations are silently skipped for the session
- Slack failures during the loop are non-fatal — log and continue (same as other tool errors)
- Never block a cycle waiting for a Slack response — `slack_ask` is fire-and-forget;
  answers arrive asynchronously via the poller
- `slack_ask` supplements `attentionMessage`, it does not replace it — the HUD remains
  the source of truth for attention state

## Error Resilience

Night-shift is a long-running loop — it must be robust to transient failures. **Never stop the loop due to a non-fatal error.** Log it, note it, and continue to the next step or cycle.

Non-fatal errors (log and continue):

- `gh pr merge` says "already merged" — treat as success
- Worktree deletion fails after merge — cosmetic, ignore
- A single `gh` CLI call times out or returns an unexpected error — skip that task this cycle, retry next cycle
- `list_tasks` returns empty unexpectedly — continue to next step
- Any MCP tool call fails for a single task — note the failure, skip that task, continue

Fatal errors (stop the loop):

- All MCP tool calls fail repeatedly (daemon is down)
- git operations corrupt the repo state
- The orchestrator itself is out of context (use `/compact` proactively to prevent this)

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
