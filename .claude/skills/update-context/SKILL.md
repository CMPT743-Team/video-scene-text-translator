---
name: update-context
description: >
  Update project context files with new content. Use when the user asks to remember something,
  add a preference, store a new convention, or when a recurring project-level problem is solved
  and the fix should be documented to prevent it from happening again.
---

Add the following content to the project context.

$ARGUMENTS

Steps:
1. Read both CLAUDE.md and .claude/local.md (if it exists).
2. Decide where the content belongs:
   - **CLAUDE.md** — project-level knowledge: conventions, gotchas, workflow rules, architecture decisions. Shared with the team via git.
   - **.claude/local.md** — personal preferences, local environment setup, current focus. Gitignored, private to the user.
   If unclear, explain the tradeoff and ask the user which file to use.
3. Identify all existing sections in the chosen file and their purposes.
4. Determine which existing section best fits the new content.
5. If the content fits an existing section, show where you plan to place it and ask for confirmation.
6. If no existing section is a good fit, propose a new section name and location. Explain why existing sections don't fit and ask for my approval before creating it.
7. Write the content in a style consistent with the rest of the file.
8. Show the change and ask for confirmation before writing.
