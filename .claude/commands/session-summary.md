Write a session summary to docs/sessions/.

Determine the filename:
1. If a feature name is provided as argument, use: [feature]-YYYY-MM-DD.md
2. If no argument, read plan.md and extract the feature name from its title. Convert to kebab-case.
3. If plan.md doesn't exist, use: YYYY-MM-DD.md
4. If the file already exists, append a counter: [name]-YYYY-MM-DD-2.md

Use this format:

# Session: [feature name] — YYYY-MM-DD

## Completed
- [What was finished this session]

## Current State
- [What the codebase looks like now — key changes, any work in progress]

## Next Steps
- [Ordered list of what to do next]

## Decisions Made
- [Key decisions and the reasoning — prevents re-debating next session]

## Open Questions
- [Unresolved items that need human input]

Keep each section concise. Aim for 20-40 lines total.
After writing, confirm the file path and a one-line summary of what was accomplished.
