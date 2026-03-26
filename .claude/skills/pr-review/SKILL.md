---
name: pr-review
description: Code review checklist and patterns for reviewing pull requests and uncommitted changes. Loads when reviewing code, running @reviewer agent, or preparing changes for commit.
---

## Review Process
1. Read CLAUDE.md for project conventions and gotchas.
2. Read the diff — understand what changed and why before judging how.
3. Check .claude/rules/ for any path-scoped rules matching changed files.
4. Review against the checklist below.
5. Categorize findings by severity.

## Review Checklist

### Correctness
- Does the code do what the PR/commit description says it does?
- Are edge cases handled — nulls, empty collections, missing fields, error states?
- Are error paths tested, not just happy paths?
- Are async operations properly awaited? Are race conditions possible?
- Do loops terminate? Are off-by-one errors present?

### Design
- Single responsibility — does each function/class do one thing?
- No duplicated logic that should be extracted into a shared utility
- No premature abstraction — is the abstraction justified by 3+ use cases?
- Dependencies flow in one direction — no circular imports
- Public API is minimal — nothing exposed that doesn't need to be

### Security
- No secrets, API keys, or credentials in code or comments
- User input is validated and sanitized before use
- No SQL injection, XSS, or path traversal vectors
- Auth checks present on protected operations
- Sensitive data not logged or exposed in error messages

### Maintainability
- Functions and variables have clear, descriptive names
- No dead code, commented-out blocks, or leftover debug statements
- No hardcoded values that should be configurable (magic numbers, URLs, thresholds)
- Complex logic has comments explaining why, not what
- File/function length is reasonable — split if too long

### Testing
- New functionality has corresponding tests
- Tests verify behavior, not implementation details
- Tests cover both happy path and error cases
- Mocks are minimal and reset between tests
- No flaky test patterns (timing, shared state, order dependency)

### Project Conventions
- Follows conventions from CLAUDE.md
- No violations of Gotchas section rules
- Follows commit message format if applicable
- File/folder placement matches project structure

## How to Give Feedback
- State the file and line: [file:line] description
- Explain why it's an issue, not just what to change
- Suggest a fix when possible
- Distinguish blocking issues from style preferences

## Severity Levels
- Critical — must fix before commit. Bugs, security holes, data loss risks.
- Warning — should fix. Convention violations, missing error handling, code smells.
- Suggestion — consider for later. Style improvements, minor refactors, nice-to-haves.

## Report Format

```
## Code Review

### Critical (must fix before commit)
- [file:line] issue description — why it matters

### Warnings (should fix)
- [file:line] issue description — why it matters

### Suggestions (consider for later)
- [file:line] issue description

### Summary
[One-line verdict: ready to commit, or needs fixes]
```

If no issues found, say "Clean — ready to commit" and list what was checked.

## Common Mistakes Reviewers Miss
- Async code without proper error handling (unhandled promise rejections)
- State mutation in places that expect immutability
- Missing cleanup (event listeners, subscriptions, temp files)
- Boundary conditions in pagination, truncation, or batching
- Inconsistent error response shapes across endpoints
