# Handoff Manual: hello-handoff

## What This System Does

This project uses agent-assisted development powered by the [handoff](https://github.com/joe-thirtytwonineteen/handoff) plugin for Claude Code. Agents find work from the project board, implement changes, create PRs, and post structured handoff comments — all following your quality guardrails. You control how much oversight each issue gets.

## Installation & Local Development

### Using the plugin

```bash
# Per-session (no install needed)
claude --plugin-dir /path/to/handoff

# Or install from marketplace
/plugin marketplace add /path/to/handoff
/plugin install handoff@handoff
```

### Customizing the plugin

If you want to modify the plugin's templates, command logic, or scripts:

```bash
# Clone the plugin source
git clone https://github.com/joe-thirtytwonineteen/handoff.git ~/dev/handoff

# Use your local copy per-session
claude --plugin-dir ~/dev/handoff
```

Changes to command files, templates, and scripts take effect immediately — no reinstall needed. To share your modifications, fork the repo and point your team at your fork.

## Day-to-Day Operations

### Starting an agent

From the agent's worktree directory, start Claude with the handoff plugin:

```bash
cd ../hello-handoff-matt-sergi-agent-1
claude --plugin-dir /path/to/handoff
```

Then use `/simplewins:handoff work`, `/simplewins:handoff auto`, or `/simplewins:handoff review` to begin.

### Checking the board

Your project board at https://github.com/users/matt-sergi/projects/1 shows all issues and their statuses. Key columns to watch:

- **In Human Review** — these need your attention (merge or request changes)
- **In Review** — agent is reviewing or waiting for review
- **In Progress** — agent is actively working
- **Needs Revision** — PR got feedback, agent will pick this up next

### What agents do automatically

1. Check for PRs to review (unblock colleagues first)
2. Address revision feedback on rejected PRs
3. Pick up the highest-priority Ready issue
4. Run all quality guardrails before creating a PR
5. Post structured handoff comments on every status transition

### Managing permissions

As agents work, Claude Code accumulates tool approvals in per-worktree `.claude/settings.local.json` files. Periodically consolidate these into the shared `.claude/settings.json`:

```bash
/simplewins:handoff permissions
```

This scans all agent worktrees, presents candidates with frequency counts, normalizes malformed patterns, and lets you approve entries for promotion. Run from the primary worktree (not an agent worktree).

## Planning Epics

Use `/simplewins:handoff plan` to interactively plan large features or initiatives. The agent acts as a senior engineer — it researches the codebase, proposes architecture, and discusses the approach with you before creating anything.

### Starting a planning session

```bash
# From a description
/simplewins:handoff plan add user authentication to the API

# From an existing issue
/simplewins:handoff plan #42

# Or just start talking
/simplewins:handoff plan
```

### What happens during planning

1. **You describe what you want to build** — the agent listens and asks clarifying questions
2. **The agent researches the codebase** — explores relevant code, patterns, and architecture
3. **You discuss the approach together** — the agent proposes concrete approaches, you refine
4. **The agent proposes a decomposition** — numbered sub-issues with dependencies
5. **You choose Ready or Backlog** — whether agents start working immediately (default: Ready)
6. **The agent creates everything** — epic issue, sub-issues, task list, board entries

### How sub-issues get worked

Sub-issues land on the board like any other issue. Agents in `/simplewins:handoff work` or auto-loop mode pick them up automatically. Dependencies are expressed as `Blocked by #N` in sub-issue bodies — agents skip blocked sub-issues until their dependencies close.

When an agent claims the first sub-issue, the parent epic auto-promotes to "In Progress" on the board.

### Closing an epic

You close the epic manually when you're satisfied all sub-issues are complete. GitHub auto-checks task list items as sub-issues close, so you can see progress on the parent issue.

## Autonomy Levels

Every issue can be tagged with a label that controls how much oversight the agent requires. The project default is **full**.

### The three levels

| Label                 | What it means                                                              |
| --------------------- | -------------------------------------------------------------------------- |
| `autonomy:full`       | Agent handles it end-to-end. You just merge the PR.                        |
| `autonomy:plan`       | Agent finds the task, but waits for you to approve the plan before coding. |
| `autonomy:supervised` | Agent asks before claiming the task AND before coding. Full oversight.     |

### When to use each

**Full autonomy** — for issues where you trust the agent to get it right:

- Dependency updates, typo fixes, documentation
- Bugs with clear reproduction steps
- Features with detailed acceptance criteria

**Plan review** — for issues where the approach matters:

- Features requiring design decisions
- Refactoring with architectural impact
- Changes to public APIs

**Supervised** — for issues where you want full control:

- Security-critical changes
- First time working in a new area
- High-risk changes where mistakes are expensive

### How to set autonomy on an issue

**At creation:**

```bash
gh issue create --title "Fix login bug" --label "autonomy:supervised"
```

**On an existing issue:**

```bash
gh issue edit 42 --add-label "autonomy:full"
```

**Via GitHub UI:** Open the issue, click Labels, select the `autonomy:*` label.

**No label?** The project default (full) applies.

## Reading Handoff Comments

Every time work changes hands, the agent posts a structured comment on the issue. Here's what to look for:

```
**Agent: matt-sergi/agent-1** | **Autonomy: full**

## Handoff: Implementation Complete

### What Was Done
- Added input validation to the login form
- Created unit tests for edge cases (empty password, SQL injection attempts)

### What Needs Attention
- The error message format differs from the rest of the app — may want to standardize later
- Coverage is 87% for the new code

### What's Next
- All guardrails passed. PR #42 ready for merge.
```

**What to check by autonomy level:**

- **Full autonomy:** Read "What Needs Attention" carefully — this is your primary review point. The agent handled everything else.
- **Plan review:** You already approved the approach. Check that "What Was Done" matches the plan.
- **Supervised:** You were involved at each step. The handoff is mostly for the record.

## Intervening When Things Go Wrong

### Stopping a running agent

If an agent is running in a terminal, press `Ctrl+C` to stop the Claude process. The issue will remain in whatever status it was in.

### Overriding a plan

If an agent posted a plan and is waiting for approval (`autonomy:plan` or `autonomy:supervised`), comment on the issue with your feedback. The agent reads issue comments to understand your response.

### Reverting agent work

Standard git procedures:

```bash
# Revert a merge commit
git revert -m 1 <merge-commit-sha>

# Or reset to before the merge (if not yet pushed further)
git reset --hard <commit-before-merge>
```

### When an agent gets stuck

If an issue has been "In Progress" for too long with no activity, the agent may have failed. Check:

1. Is the Claude process still running?
2. Check the issue comments — the agent should have posted a handoff moving it to Backlog if it got stuck.
3. If the agent crashed without a handoff, manually move the issue back to "Ready" on the board.

### Race conditions

Two agents claiming the same issue is prevented by optimistic locking (`check-and-set-status.sh`). If it happens anyway (rare TOCTOU edge case), one agent's PR creation will succeed and the other will fail or create a duplicate. Close the duplicate PR and move on.

## Tuning the Process

### Changing the default autonomy level

```bash
# In a Claude Code session:
/simplewins:handoff tune
```

Or edit `.agents/config.yml` directly:

```yaml
autonomy:
  default: 'plan' # full | plan | supervised
```

### Adding or changing guardrails

```bash
/simplewins:handoff guardrail
```

The agent walks you through adding, changing, or removing quality gates.

### Adding more agents

```bash
/simplewins:handoff agent add agent-2
```

This creates the worktree, label, and updates config. Each agent runs independently in its own worktree.

### Removing an agent

```bash
/simplewins:handoff agent remove agent-2
```

Deletes the label. The worktree is preserved (may contain uncommitted work).

### Re-running setup

If your project changes significantly (new repo, new tracker, team restructure):

```bash
/simplewins:handoff setup
```

## Reference

### Commands

| Command                               | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| `/simplewins:handoff setup`           | Configure project (consultative interview)    |
| `/simplewins:handoff guardrail`       | Define quality gates (mandatory testing)      |
| `/simplewins:handoff plan [desc\|#N]` | Interactively plan an epic, create sub-issues |
| `/simplewins:handoff work`            | Find and work on highest priority task        |
| `/simplewins:handoff do #N`           | Work on specific issue                        |
| `/simplewins:handoff review [#N]`     | Review a PR                                   |
| `/simplewins:handoff agent`           | List all agents                               |
| `/simplewins:handoff agent add X`     | Add a new agent                               |
| `/simplewins:handoff agent remove X`  | Remove an agent                               |
| `/simplewins:handoff manual`          | Regenerate this manual                        |
| `/simplewins:handoff tune`            | Adjust autonomy and process settings          |
| `/simplewins:handoff permissions`     | Scan and consolidate agent tool permissions   |

### Status Lifecycle

```
Backlog -> Ready -> In Progress -> In Review -> In Human Review -> Done
                       ^              |
                       +-- Needs Revision
```

### File Layout

```
.agents/
├── config.yml              # Project bindings (tracker, autonomy, agents)
├── guardrails/             # Quality gate definitions
├── scripts/handoff/        # Workflow scripts (auto-synced from plugin)
└── research/               # Agent-to-agent knowledge base

CLAUDE.md                   # Guide for Claude Code sessions
HANDOFF-MANUAL.md           # This file
.claude/settings.json       # Pre-approved permissions
```

### Autonomy Quick Reference

| Want this?                             | Use this label        |
| -------------------------------------- | --------------------- |
| Agent handles everything, I just merge | `autonomy:full`       |
| I approve the plan, agent implements   | `autonomy:plan`       |
| I approve every step                   | `autonomy:supervised` |
| Use the project default (full)         | No label needed       |
