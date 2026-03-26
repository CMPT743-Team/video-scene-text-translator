---
name: add-rule
description: Create a new rule file in .claude/rules/. Use when the user wants to define path-scoped conventions, file-specific guidelines, or domain rules that should auto-load when working in matching paths.
---

Create a new rule file in .claude/rules/.

Ask me:
1. What domain or topic does this rule cover? (e.g., "API routes", "testing", "auth")
2. What file patterns should trigger this rule? (e.g., "src/api/**/*.ts")

Then create the file at .claude/rules/[topic]-rules.md with this structure:

---
description: [Brief description of when this rule applies]
globs:
  - [file patterns from step 2]
---

[Rule content — use "Never X — reason" and "Always Y — reason" format]

After creating, confirm the file path and list the rules added.

Example output file (.claude/rules/api-rules.md):

---
description: Rules for API route handlers
globs:
  - src/api/**/*.ts
  - src/routes/**/*.ts
---

- Always validate inputs with Zod before processing — unvalidated inputs cause runtime crashes
- Always return consistent { data, error, status } response shape — frontend depends on this contract
- Never expose internal error messages to the client — use generic error messages and log details server-side
- Never use raw SQL queries — always go through Prisma to maintain type safety and migration history
