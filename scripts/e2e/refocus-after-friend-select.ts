// Standalone Playwright e2e test: after selecting a friend from the suggestion
// popover on the Create screen, the input should remain focused and the player
// should be added to the list.
//
// Two run modes:
//
// 1) Hermetic (default) — launches a fresh headless Chromium and seeds a
//    friend into localStorage before running. Good for CI.
//      pnpm tsx scripts/e2e/refocus-after-friend-select.ts
//
// 2) Connected to your running Chrome (uses your real localStorage) — start
//    Chrome with a remote debugging port, then run the test against it:
//      /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
//        --remote-debugging-port=9222 \
//        --user-data-dir=/tmp/grim-chrome-profile
//      E2E_CDP_URL=http://localhost:9222 pnpm tsx scripts/e2e/refocus-after-friend-select.ts
//
// In both modes the test exercises the same flow on two device profiles:
//   - desktop (mouse)  — typical browser, no touch
//   - mobile  (touch)  — iPhone 12 emulation with hasTouch + isMobile, which
//                        is what DevTools "Toggle device toolbar" turns on.
//                        Width/height alone is not enough — the touch input
//                        type is what changes Pressable's event flow on web.

import { expect } from '@playwright/test';
import { type BrowserContext, chromium, devices, type Page } from 'playwright';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8081';
const CDP_URL = process.env.E2E_CDP_URL;
const STORE_KEY = 'grim-keeper-game-store-v1';
const FRIEND_NAME = 'Aaron';

function buildSeed() {
  return {
    state: {
      appUserName: 'You',
      games: [],
      friends: [
        { id: 'friend-aaron', name: FRIEND_NAME, createdAt: '2026-01-01T00:00:00.000Z' },
      ],
      roleCatalog: [],
      savedNotes: [],
      scripts: [],
    },
    version: 5,
  };
}

async function seedAndGotoCreate(page: Page, useTap: boolean) {
  await page.goto(BASE_URL);
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [STORE_KEY, JSON.stringify(buildSeed())],
  );
  await page.goto(`${BASE_URL}/create`);
  await focusInputAndShowPopover(page, useTap);
}

async function focusInputAndShowPopover(page: Page, useTap: boolean) {
  // Use tap on touch contexts, click on mouse contexts. Both end up triggering
  // the React onFocus event we need to show the popover.
  const input = page.getByRole('textbox');
  if (useTap) {
    await input.tap();
  } else {
    await input.click();
  }
  await expect(page.getByRole('button', { name: new RegExp(FRIEND_NAME) })).toBeVisible();
}

async function selectFriend(page: Page, useTap: boolean) {
  const friendButton = page.getByRole('button', { name: new RegExp(FRIEND_NAME) });
  if (useTap) {
    await friendButton.tap();
  } else {
    await friendButton.click();
  }
}

type RunOptions = { label: string; useTap: boolean };

async function runOnce(context: BrowserContext, options: RunOptions): Promise<string[]> {
  const failures: string[] = [];
  const page = await context.newPage();

  try {
    if (CDP_URL) {
      // In connected mode the user has their own data. Just navigate and focus.
      await page.goto(`${BASE_URL}/create`);
      await focusInputAndShowPopover(page, options.useTap);
    } else {
      await seedAndGotoCreate(page, options.useTap);
    }

    const focusedBefore = await page.evaluate(
      () =>
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA',
    );
    if (!focusedBefore) failures.push('Input was not focused before selecting a friend.');

    await selectFriend(page, options.useTap);

    // Wait for the list to settle after the click. If a press-up fires after
    // the press-down, a second Aaron row will appear within a couple of frames.
    await page.waitForTimeout(500);

    // Count the Aaron rows in the list. A single tap on a friend should add
    // exactly one row. If the trailing onPress fires too, we get two.
    const aaronRowCount = await page
      .getByRole('button', { name: new RegExp(`^\\d+\\s+${FRIEND_NAME}\\s*$`) })
      .count();
    if (aaronRowCount === 0) {
      failures.push(`Player "${FRIEND_NAME}" was not added to the list after selecting.`);
    } else if (aaronRowCount > 1) {
      failures.push(
        `Player "${FRIEND_NAME}" was added ${aaronRowCount} times — the press-up event fired after the press-down.`,
      );
    }

    const focusedAfter = await page.evaluate(
      () =>
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA',
    );
    if (!focusedAfter) {
      failures.push('Input lost focus after selecting a friend.');
    }
  } finally {
    await page.close();
  }

  return failures;
}

async function run() {
  const browser = CDP_URL
    ? await chromium.connectOverCDP(CDP_URL)
    : await chromium.launch();
  const ownsBrowser = !CDP_URL;
  const allFailures: string[] = [];
  const labels: string[] = [];

  try {
    // Desktop: no touch, no mobile flag.
    {
      const context = await browser.newContext();
      const failures = await runOnce(context, { label: 'desktop', useTap: false });
      allFailures.push(...failures.map((f) => `[desktop] ${f}`));
      labels.push('desktop');
      await context.close();
    }

    // Mobile: iPhone 12 device descriptor enables hasTouch + isMobile.
    {
      const context = await browser.newContext({ ...devices['iPhone 12'] });
      const failures = await runOnce(context, { label: 'mobile', useTap: true });
      allFailures.push(...failures.map((f) => `[mobile] ${f}`));
      labels.push('mobile');
      await context.close();
    }
  } finally {
    if (ownsBrowser) await browser.close();
  }

  if (allFailures.length > 0) {
    console.error('FAIL');
    for (const f of allFailures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log(`PASS: friend selected, input still focused, player added to list (${labels.join(' + ')}).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
