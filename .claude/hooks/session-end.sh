#!/bin/bash
# Session end hook — checks if a session summary exists for today
# This is a safety net. The preferred method is running /session-summary manually.
#
# To enable: in .claude/settings.json, rename "_SessionEnd" to "SessionEnd"

TODAY=$(date +%Y-%m-%d)
SESSION_DIR="docs/sessions"

# Create session dir if it doesn't exist
mkdir -p "$SESSION_DIR"

# Check if a summary for today already exists (dedup with manual /session-summary)
if ls "$SESSION_DIR"/*"$TODAY"* 1>/dev/null 2>&1; then
  echo "Session summary for $TODAY already exists. Skipping."
  exit 0
fi

echo "No session summary found for $TODAY. Consider running /session-summary before ending."
