#!/usr/bin/env node
/**
 * Driver for demo-issue-tracker.
 * Usage:
 *   node driver.mjs                      → screenshot of current state
 *   node driver.mjs add "My issue title" → add a new issue, then screenshot
 *
 * Screenshots land in /tmp/shots/ as timestamped PNGs.
 * Dev server must be running on http://localhost:3003 before calling this.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3003';
const SHOTS_DIR = '/tmp/shots';

mkdirSync(SHOTS_DIR, { recursive: true });

const [, , cmd, ...args] = process.argv;

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext()).newPage();

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

await page.goto(BASE_URL);
await page.waitForSelector('text=Backlog');

if (cmd === 'add') {
  const title = args[0];
  if (!title) { console.error('Usage: driver.mjs add "<title>"'); process.exit(1); }
  await page.fill('input[placeholder*="new issue"]', title);
  await page.click('button:has-text("Add")');
  await page.waitForSelector(`text=${title}`);
  console.log(`Added issue: ${title}`);
}

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const shotPath = join(SHOTS_DIR, `screenshot-${ts}.png`);
await page.screenshot({ path: shotPath, fullPage: true });
console.log(`Screenshot: ${shotPath}`);

if (errors.length > 0) {
  console.error('Console errors:', errors);
  process.exitCode = 1;
}

await browser.close();
