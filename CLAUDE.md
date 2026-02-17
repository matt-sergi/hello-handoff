# hello-handoff

## Agent Workflow

This project uses the [handoff plugin](https://github.com/joe-thirtytwonineteen/handoff) for agent-assisted development. Configuration is in `.agents/`. Read `HANDOFF-MANUAL.md` for the full operations guide.

## Quick Reference

### Autonomy Levels

Default: **full**

| Label                 | Task Selection        | Plan                       | Merge        |
| --------------------- | --------------------- | -------------------------- | ------------ |
| `autonomy:full`       | Agent proceeds        | Posts for record, proceeds | Human merges |
| `autonomy:plan`       | Agent proceeds        | Posts and **waits**        | Human merges |
| `autonomy:supervised` | Reports and **waits** | Posts and **waits**        | Human merges |

Set on issues via labels. No label = project default.

### Quality Gates (ALL must pass before PR)

| Gate       | Command                  | Required |
| ---------- | ------------------------ | -------- |
| Unit Tests | `npm test`               | Yes      |
| ESLint     | `npx eslint .`           | Yes      |
| Prettier   | `npx prettier --check .` | Yes      |

### Commit Format

Conventional commits: `feat(scope): description`, `fix(scope): description`, etc.

### Agents

| Agent   | Label                | Worktree                              |
| ------- | -------------------- | ------------------------------------- |
| agent-1 | `matt-sergi:agent-1` | `../hello-handoff-matt-sergi-agent-1` |

Manage agents: `/simplewins:handoff agent`, `/simplewins:handoff agent add <name>`, `/simplewins:handoff agent remove <name>`

### Status Lifecycle

```
Backlog -> Ready -> In Progress -> In Review -> In Human Review -> Done
                       ^              |
                       +-- Needs Revision
```

**NEVER move an issue's status without posting a handoff comment first.** Every status transition requires a call to `post-issue-comment.sh` explaining: what was done, what needs attention, and what's next. This is institutional memory for stateless agents and the audit trail for humans.

**ALWAYS use `check-and-set-status.sh` for status transitions** to prevent race conditions. If the status has changed since you last read it, abandon the issue and pick the next one.

### Work Priority Order

1. Review PRs in "In Review" (unblock colleagues)
2. Address "Needs Revision" (fix feedback)
3. Pick up "Ready" (new work, top = highest priority)

### Before Every Work or Review Cycle

Use the sync script to start clean from your agent's base branch (never `main` -- it's checked out in the primary worktree):

```bash
.agents/scripts/handoff/sync-agent-branch.sh <AGENT_ID>
```

Each agent has a base branch named `<human>/<agent-name>` (e.g., `matt-sergi/agent-1`) that tracks main. Task branches are created from this base branch.

### Human Gates (vary by autonomy level)

Under `autonomy:full`: No intermediate gates. Agent works end-to-end. Human merges PR.
Under `autonomy:plan`: Agent posts implementation plan as issue comment and waits for approval before coding. Human merges PR.
Under `autonomy:supervised`: Agent reports task selection AND posts plan, waiting for approval at both steps. Human merges PR.

**Regardless of autonomy level:**

- Agents NEVER approve PRs -- only `--comment` or `--request-changes`. Human merges to main.
- Guardrails always run before creating a PR.
- Handoff comments are always posted on every status transition.

### Script Operations

All workflow operations use pre-approved scripts. Pass dynamic values as arguments:

```bash
.agents/scripts/handoff/query-by-status.sh "Ready"
.agents/scripts/handoff/check-and-set-status.sh 42 "Ready" "In Progress"
.agents/scripts/handoff/get-issue-autonomy.sh 42 "full"
.agents/scripts/handoff/post-issue-comment.sh 42 "Comment body here"
.agents/scripts/handoff/sync-agent-branch.sh matt-sergi/agent-1
```

Do NOT compose complex inline bash for workflow operations. Use the scripts.

### Workflow Commands

```
/simplewins:handoff setup           # Configure project (run once)
/simplewins:handoff guardrail       # Define quality gates (required before work)
/simplewins:handoff plan [desc|#N]  # Interactively plan an epic, create sub-issues
/simplewins:handoff agent           # List / add / remove agents
/simplewins:handoff work            # Find and work on highest priority task
/simplewins:handoff do #N           # Work on specific issue #N
/simplewins:handoff review [#N]     # Review a PR
/simplewins:handoff manual          # Regenerate HANDOFF-MANUAL.md
/simplewins:handoff tune            # Adjust autonomy defaults
/simplewins:handoff permissions     # Scan and consolidate agent tool permissions
```

### Project Board

https://github.com/users/matt-sergi/projects/1

### Research

Agent-to-agent knowledge base: `.agents/research/`
Agents write findings during work. Humans curate.
