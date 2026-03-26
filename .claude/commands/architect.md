Think hard about the architecture before writing.

Design or update the high-level architecture for the project.

If a task description is provided as argument, use it as context for the architecture.
If no argument, ask what the app does, who it's for, and key constraints.

If docs/architecture.md already exists, read it first. Ask whether to update the existing architecture or start fresh.
For an existing architecture, skip to the update flow at the bottom.

Stay at the structural level — module boundaries, interfaces, and app-level tech choices.
Do NOT go into per-module implementation details — those belong in /plan.

For a new architecture, follow these two phases:

---

## Phase 1: Discuss

Do NOT write docs/architecture.md during this phase.

1. Scan the codebase to understand the current state. Look for existing structure, patterns, and conventions already in place.
2. Present your findings to the user:
   - Summarize the app's purpose and constraints as you understand them
   - Propose the module breakdown — what modules are needed and why
   - For each major tech stack choice, list 2-3 options with pros/cons and recommend one
   - Identify cross-cutting concerns (auth, error handling, logging, etc.) and propose approaches
3. Present options and analysis as regular chat text. At the end of your response, ask in plain text whether the user is ready to decide or has more questions. Do NOT use AskUserQuestion during this phase. Only use AskUserQuestion in a follow-up turn after the user confirms they're ready to make a decision.
4. Discuss with the user. Go back and forth until the module boundaries, interfaces, and tech choices are settled.
5. Wait for the user to confirm the design direction (e.g., "looks good", "go ahead", "write it").

---

## Phase 2: Write docs/architecture.md

Only start this phase after the user confirms.

Write the architecture to the docs/architecture.md file on disk — do not just show it in chat.

Use this format:

# Architecture: [Project Name]

## Overview
[One-liner: what this app does, who it's for, and key constraints]

## Module Map
| Module | Responsibility | Interfaces |
|--------|---------------|------------|
| [name] | [what it owns] | [which other modules it talks to and how] |

## Cross-Cutting Concerns
- Auth: [approach]
- Error handling: [approach]
- Logging: [approach]
- [other concerns as needed]

## Tech Stack
- [choice]: [why — what was considered and what won]

## Open Questions
- [Anything deferred to module-level planning via /plan]

After writing the file, show the user what was written and wait for approval before any implementation.

---

## Updating an existing architecture

When docs/architecture.md already exists and the user wants to update it:
- Flag which existing modules are affected by the change
- Discuss the impact before modifying
- Update only the affected sections
