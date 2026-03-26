Think hard about the design before writing.

Create or update plan.md for the given task.

If docs/architecture.md exists, read it first to understand the high-level design. Ensure the plan aligns with the architecture.

If a task description is provided as argument, use it as the goal.
If no argument, ask what we're building.

If plan.md already exists, read it first. Ask whether to update the existing plan or start fresh.
For an existing plan, skip to the update flow at the bottom.

For a new plan, follow these two phases:

---

## Phase 1: Discuss

Do NOT write plan.md during this phase.

1. Scan the codebase to understand the current structure. Look for existing functions, utilities, and patterns that can be reused — prefer reusing over creating new code.
2. Present your findings to the user:
   - Summarize the goal as you understand it
   - Identify the key design decisions and tradeoffs
   - For each tradeoff, list 2-3 options with pros/cons and recommend one
3. Present options and analysis as regular chat text. At the end of your response, ask in plain text whether the user is ready to decide or has more questions. Do NOT use AskUserQuestion during this phase. Only use AskUserQuestion in a follow-up turn after the user confirms they're ready to make a decision.
4. Discuss with the user. Go back and forth until the major decisions are settled.
5. Wait for the user to confirm the design direction (e.g., "looks good", "go ahead", "write it").

---

## Phase 2: Write plan.md

Only start this phase after the user confirms.

Before writing, check the current git branch. If on main or a non-feature branch, create a feature branch (feat/, fix/, chore/) based on the plan goal before proceeding.

Write the plan to the plan.md file on disk — do not just show it in chat.

Use this format:

# Plan: [Feature Name]

## Goal
[One-liner: what we're building and why]

## Approach
[How we'll implement it — key design decisions, patterns to follow]
[Capture the decisions made during the discussion phase]

## Files to Change
- [ ] path/to/file.ts — [what changes and why]
- [ ] path/to/file.ts — [what changes and why]
- [ ] (new) path/to/new-file.ts — [what this file does]

## Risks
- [What could go wrong or what we're unsure about]
- [Dependencies, breaking changes, edge cases to watch for]

## Done When
- [ ] [Feature-specific: what proves the implementation works]
- [ ] [Edge cases: specific scenarios that must be handled]
- [ ] All tests pass
- [ ] Code review approved (@reviewer)
- [ ] Changes committed as atomic commits

## Progress
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

After writing the file, show the user what was written and wait for approval before any implementation.

---

## Updating an existing plan

When plan.md already exists and the user wants to update it:
- Mark finished steps as [x] in the Progress section
- Add new steps if scope has changed
- Note any blockers or changes to the approach
