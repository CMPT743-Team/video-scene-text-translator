Generate a project CLAUDE.md file based on the template below.

Step 1: Detect what you can automatically.
- Read package.json, pyproject.toml, Cargo.toml, go.mod, or similar to detect the stack.
- Read existing scripts/commands (package.json scripts, Makefile, etc.) to fill in dev/test/lint/build.
- Scan the top-level directory structure to fill Key Directories.
- Check if .gitignore, .eslintrc, tsconfig.json, biome.json, or similar exist to infer conventions.
- Check if git is initialized.

Step 2: Ask me only for what you cannot detect.
- Project name and one-liner description (always ask — don't guess the purpose).
- Any conventions that aren't inferable from config files.
- Known gotchas (or leave the section with format examples if none yet).

Important: This is a context-setup stage only. CLAUDE.md should contain project metadata, conventions, and workflow — NOT implementation plans, architecture details, or feature designs. Those belong in docs/architecture.md (via /architect) and plan.md (via /plan). Keep sections concise.

Step 3: Generate CLAUDE.md using this template, replacing placeholders with detected or provided values.

Step 4: Show me the generated file and ask for confirmation before writing to ./CLAUDE.md.

Step 5: After writing CLAUDE.md, also scaffold the supporting structure:
- Create .claude/local.md if it doesn't exist (from the local template below).
- Create docs/sessions/ directory if it doesn't exist.
- Add .claude/local.md to .gitignore if not already there.
- If git is not initialized, run git init and create a .gitignore for the detected stack.

---

PROJECT CLAUDE.MD TEMPLATE:

# {Project Name}
{One-liner: what this project does and who it's for.}

## Workflow

### Session
1. At session start, run /load-context to load context from the previous session.
   Older session history is in docs/sessions/ — read when you need context beyond the last session.
2. At session end when I ask, run /session-summary to archive the session.

### Development
When starting a new feature:
1. Create a feature branch: feat/, fix/, chore/
2. Run /architect if the project has no docs/architecture.md yet.
3. Run /plan to brainstorm and write plan.md for this feature. Wait for approval.
   If plan.md already exists for this feature, load it and continue from where it left off.
4. If a design decision needs research, delegate to @researcher.

When implementing:
5. For scoped module work, delegate to @coder with the specific plan step.
6. If @coder reports unresolved test failures, delegate to @debugger with the error output.
7. After completing each plan step, mark it as [x] in plan.md Progress and note any changes.

When wrapping up:
8. Delegate to @reviewer for code review.
9. Commit changes — the commit skill will propose atomic splits for approval.
10. When merging a feature branch to main, check if docs/architecture.md needs updating to reflect what was actually built.

## Commands
dev:    {detected or ask}
test:   {detected or ask}
lint:   {detected or ask}
build:  {detected or ask}

## Stack
{auto-detected from config files, listed as bullet points}

## Key Directories
{auto-detected from folder structure, listed as: path — description}

## Conventions
{inferred from config files (e.g., "TypeScript strict mode" from tsconfig strict:true)}
{ask for any that can't be detected}
- Domain-specific rules auto-load from .claude/rules/ when working in matching paths

## Gotchas
- Never [action] — [why it breaks]
- Always [action] before [other action] — [what goes wrong otherwise]

## Git
- If git is not initialized, run git init and create a .gitignore for the project stack.
- Never push directly to main
- Commit format: type(scope): description — e.g., feat(auth): add login endpoint

## Reference Docs
{list any docs/ files found, or use these defaults:}
- For API patterns, see docs/api-conventions.md
- For architecture decisions, see docs/architecture.md

---

LOCAL TEMPLATE (for .claude/local.md):

## Current Focus
- [ ] [Current task or feature you're working on]
- [ ] [Next priority]

## My Preferences
- [e.g., Always explain your reasoning before making changes]

## Local Setup
- [e.g., My local DB runs on port 5433, not default 5432]
