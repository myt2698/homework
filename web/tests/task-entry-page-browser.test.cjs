// Run with Playwright on NODE_PATH; PLAYWRIGHT_CHANNEL can select an installed browser.
// Tests an isolated profile and saves screenshots to a temporary folder.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-entry-page-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-09T18:00:00+08:00'));
    await page.addInitScript(() => {
      if (localStorage.getItem('entry-page-test-seeded')) return;
      localStorage.setItem('entry-page-test-seeded', 'yes');
      localStorage.setItem('homework-ledger-v1', JSON.stringify({ records: {
        '2026-09-09': { ledgerConfirmed: true, tasks: [] }
      }, weekends: {} }));
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#taskEntryLauncher').click();
    assert.equal(await page.locator('#mainPage').isVisible(), false);
    assert.equal(await page.locator('#taskEntryPage').getAttribute('aria-modal'), null);
    assert.equal(await page.locator('#taskEntryPage').getAttribute('role'), null);
    assert.equal(await page.locator('#taskEntryCloseButton').getAttribute('aria-label'), '返回今日任务');
    assert.equal(await page.locator('#taskEntryEmpty').isVisible(), true);
    await page.screenshot({ path: path.join(output, 'empty-390.png'), fullPage: true });
    for (let i = 1; i <= 20; i++) {
      await page.locator('#taskDraft').fill(`第${i}项作业`);
      const before = await page.locator('#taskDraft').boundingBox();
      await page.locator('#addTasksButton').click();
      assert.equal(await page.locator('#taskDraft').inputValue(), '');
      const after = await page.locator('#taskDraft').boundingBox();
      if (i > 1) assert(Math.abs(after.y - before.y) < 1, 'the input row does not move when homework is added');
    }
    assert.equal(await page.locator('[data-pending-task-id]').count(), 20);
    const list = page.locator('#taskEntryPendingSection');
    assert(await list.evaluate(item => item.scrollHeight > item.clientHeight && item.scrollTop > 0), 'only the long homework list scrolls to additions');
    await page.locator('#taskDraft').fill('还没添加的内容');
    await page.locator('#taskEntryCloseButton').click();
    assert.equal(await page.locator('#mainPage').isVisible(), true);
    assert.equal(await page.locator('#taskEntryPage').isVisible(), false);
    await page.locator('#taskEntryLauncher').click();
    assert.equal(await page.locator('#taskDraft').inputValue(), '还没添加的内容', 'back navigation retains unfinished input');
    assert.equal(await page.locator('[data-pending-task-id]').count(), 20, 'back navigation retains added tasks');
    await page.locator('#taskDraft').fill('');
    for (const [width, height] of [[320, 740], [390, 844], [1100, 900], [390, 430]]) {
      await page.setViewportSize({ width, height });
      await page.waitForFunction(() => Math.abs(document.getElementById('taskEntryPage').getBoundingClientRect().height - innerHeight) < 1);
      const bounds = await page.locator('#taskEntryLayout').boundingBox();
      assert(Math.abs(bounds.x) < 1 && Math.abs(bounds.y) < 1 && Math.abs(bounds.width - width) < 1 && Math.abs(bounds.height - height) < 1, 'entry occupies the full viewport, without modal margins');
      const input = await page.locator('#taskDraft').boundingBox();
      const confirm = await page.locator('#taskEntryConfirmButton').boundingBox();
      assert(input.y + input.height <= height && input.y > 0, 'composer remains visible in a shortened viewport');
      assert(confirm.y < 24 && confirm.x > width / 2, 'confirm remains at the top right');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'page never overflows horizontally');
      await page.screenshot({ path: path.join(output, `filled-${width}x${height}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#taskEntryOrderButton').click();
    assert.equal(await page.locator('#taskOrderModal').isVisible(), true);
    await page.locator('button[data-order-pick]').first().click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#taskOrderModal').isVisible(), false, 'Escape returns from sorting to entry');
    assert.equal(await page.locator('#taskEntryPage').isVisible(), true);
    await page.locator('#taskEntryConfirmButton').click();
    assert.equal(await page.locator('#mainPage').isVisible(), true);
    assert.equal(await page.locator('#taskEntryPage').isVisible(), false);
    assert.equal(await page.locator('#startPlanModal').isVisible(), true, 'confirmation still opens start-time planning');
    await page.locator('#startPlanCloseButton').click();
    await page.reload();
    assert.equal(await page.locator('#mainPage').isVisible(), true);
    assert.equal(await page.locator('#taskEntryPage').isVisible(), false);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).records['2026-09-09']);
    assert.equal(saved.tasks.length, 20);
    assert.equal(saved.tasksConfirmed, true);
    assert.deepEqual(errors, []);
    console.log('PASS: full-page entry, fixed composer, long lists, responsive layout, back/draft preservation, sorting and confirmation.');
    console.log('Screenshots: ' + output);
    await context.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
