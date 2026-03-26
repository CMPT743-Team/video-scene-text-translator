Resume context from the previous session.

Step 1: Check for plan.md in the project root.
- If it exists, read it and note the current goal and progress.
- If it doesn't exist, note that there's no active plan.

Step 2: Find the most recent file in docs/sessions/.
- Sort by filename (they contain dates). Pick the latest one.
- If no session files exist, note that this appears to be the first session.

Step 3: Print a brief summary using this format:

## Resuming

**Last session:** [date from session filename]
[2-3 lines from the Completed and Current State sections]

**Active plan:** [goal from plan.md, or "None"]
**Progress:** [list checked/unchecked items from plan.md Progress section]

**Next up:** [from plan.md or session file's Next Steps, whichever is more recent]

Keep the summary under 15 lines. Don't repeat full file contents — just the key context I need to start working.
