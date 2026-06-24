---
name: run-demo-issue-tracker
description: Build, run, and drive the demo-issue-tracker kanban app. Use when asked to start the app, take a screenshot of the UI, add an issue, verify a UI change, or interact with the running issue tracker.
---

A minimal Next.js 15 kanban board served at `http://localhost:3003`. Drive it with the Playwright-based script at `.claude/skills/run-demo-issue-tracker/driver.mjs` — `chromium-cli` is not available in this environment.

## Prerequisites

Node.js and npm must be available. No additional system packages are needed — Playwright's Chromium is installed via npm.

```bash
npm install
npx playwright install chromium
```

## Run (agent path)

Start the dev server in the background, wait for it to be ready, then run the driver:

```bash
# Start server (skip if already running)
npm run dev > /tmp/dev-server.log 2>&1 &
echo $! > /tmp/dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3003 >/dev/null; do sleep 1; done'

# Take a screenshot of current state
node .claude/skills/run-demo-issue-tracker/driver.mjs

# Add a new issue and screenshot
node .claude/skills/run-demo-issue-tracker/driver.mjs add "My new issue"

# Stop the server when done
kill $(cat /tmp/dev.pid)
```

Screenshots land in `/tmp/shots/` as timestamped PNGs.

## Run (human path)

```bash
npm run dev   # → http://localhost:3003 in your browser. Ctrl-C to stop.
```

## Gotchas

- **Port is 3003, not 3000.** The `package.json` dev script explicitly sets `--port 3003`.
- **`chromium-cli` is not available.** Use `driver.mjs` (Playwright) instead — same interaction model, different syntax.
- **`--no-sandbox` is required.** Without it, Chromium refuses to launch in this environment.
- **First `nav` can take 10s+.** Next.js compiles routes on demand. `driver.mjs` uses `waitForSelector` which handles this; raw `sleep` doesn't.
- **In-memory state resets on server restart.** All issues are lost when the dev server process dies.

## Troubleshooting

- **`EADDRINUSE` on port 3003**: Another dev server is still running. Run `kill $(cat /tmp/dev.pid)` or `pkill -f 'next dev'`, then restart.
- **`Could not connect to server`**: The dev server hasn't finished starting. Re-run the `timeout ... curl` poll loop.
- **`playwright install chromium` output is empty**: Already installed — this is fine, proceed normally.
