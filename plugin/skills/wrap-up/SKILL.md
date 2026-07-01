---
name: Wrap up an issue
description: |
  Use when the user signals they've finished work on an issue and want to
  close it out — phrases like "wrap up <issue>", "I'm done with #3", "finish
  the board-layout ticket", "close that one out". Performs the team's full
  wrap-up ritual so the user doesn't have to remember the steps.
---

The board's REST API is at `http://localhost:3003/api/issues`.

When the user is wrapping up an issue:

1. **Resolve the issue.** `curl -s http://localhost:3003/api/issues` and find
   the one they mean — by id if they gave a number, otherwise by closest
   title match. State which issue you matched in one line.

2. **Summarise the change.** Look at the working tree / recent diff and write
   a single plain-English sentence describing what changed.

3. **Apply all three updates in one PATCH:**
   ```bash
   curl -s -X PATCH http://localhost:3003/api/issues/<id> \
     -H 'content-type: application/json' \
     -d '{"status":"done","assignee":null,"description":"<existing>\n\nResolved: <summary>"}'
   ```
   Move the card to Done, clear the assignee, and append the summary to the
   existing description — all in the same request, so the board never shows
   an inconsistent in-between state.

4. Report which card moved and what summary was recorded. Do not pause for
   confirmation between steps — the whole point of this skill is that it's
   one motion.
