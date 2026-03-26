---
name: add-gotcha
description: Add a gotcha entry to the project CLAUDE.md. Use when the user mentions a mistake, a trap, something that broke unexpectedly, or a lesson learned that should be documented.
---

Add a new gotcha to the project CLAUDE.md file.

Ask me:
1. What went wrong or what's the trap?
2. What should be done instead?

Format the entry as one of:
- Never [action] — [why it breaks]
- Always [action] before [other action] — [what goes wrong otherwise]

Show me the formatted entry and ask for confirmation before writing.
Then append the entry to the ## Gotchas section in CLAUDE.md.
After writing, confirm the entry was added.

Example interaction:

User says: "Claude kept refactoring the auth retry logic and broke it"

Formatted entry:
- Never modify src/auth/retry.ts without reading the inline comments first — it has custom backoff logic that tests don't fully cover

[Ask for confirmation, then append to ## Gotchas in CLAUDE.md]
