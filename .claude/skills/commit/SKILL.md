---
name: commit
description: Split changes into atomic commits with conventional commit messages. Use when the user asks to commit, says "let's commit", "commit this", or is wrapping up implementation work.
---

Help the user commit their changes as clean, atomic commits.

When triggered:

1. Run `git status` and `git diff --staged` and `git diff` to understand all changes (staged and unstaged).
2. Run `git log --oneline -5` to see recent commit message style.
3. Analyze the changes and propose a commit plan:
   - Group related changes into atomic commits (one logical change per commit).
   - For each proposed commit, list:
     - The files to include
     - The commit message in conventional format: type(scope): description
   - If all changes are one logical unit, propose a single commit.
4. Show the proposed commit list and wait for user approval.
5. Once approved, execute all commits without asking again per commit.

Rules:
- Commit format: type(scope): description — e.g., feat(auth): add login endpoint
- One logical change per commit. Don't bundle unrelated changes.
- Never commit files that look like secrets (.env, credentials, tokens).
- Never use --amend unless the user explicitly asks.
- Never push — only commit locally. The user will push when ready.
- Run `git status` after all commits to confirm clean state.

Example commit plan:

```
Proposed commits (2):

1. feat(api): add user profile endpoint
   Files: src/api/profile.ts, src/api/profile.test.ts

2. fix(auth): handle expired token refresh
   Files: src/auth/token.ts, src/auth/token.test.ts
```
