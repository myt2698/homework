// Isolated browser regression for the compact weekend entry rows.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-entry-schedule-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-11T18:00:00+08:00'));
    await page.addInitScript(() => localStorage.setItem('homework-ledger-v1', JSON.stringify({
      records: { '2026-09-11': { ledgerConfirmed: true } },
      weekends: { '2026-09-11': { tasks: [
        { id: 'a', subject: '语文', title: '背诵第3课', estimatedMinutes: 15, plannedDay: 'friday', status: 'pending' },
        { id: 'b', subject: '数学', title: '课作本第12页，检查并订正', estimatedMinutes: 60, plannedDay: 'friday', status: 'pending' }
      ] } }
    })));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#taskEntryLauncher').click();
    assert.equal(await page.locator('.task-plan-number').count(), 0);
    assert.equal(await page.locator('.pending-task-title').first().innerText(), '背诵第3课', 'numbers inside homework content are preserved');
    for (const [width, height] of [[1024, 768], [390, 844], [320, 740]]) {
      await page.setViewportSize({ width, height });
      for (const row of await page.locator('.task-plan-row').all()) {
        const estimate = await row.locator('.task-estimate').boundingBox();
        const date = await row.locator('.task-plan-day').boundingBox();
        assert(estimate.x + estimate.width <= date.x, 'estimate is to the left of the date');
        assert(Math.abs(estimate.y + estimate.height / 2 - date.y - date.height / 2) < 1, 'estimate and date are vertically centered in one row');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `entry-${width}.png`), fullPage: true });
    }
    await page.locator('[data-entry-plan-day="a"]').selectOption('saturday');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).weekends['2026-09-11'].tasks);
    assert.equal(saved.find(task => task.id === 'a').plannedDay, 'saturday');
    assert.equal(saved.find(task => task.id === 'a').estimatedMinutes, 15);
    assert.deepEqual(saved.map(task => task.id), ['a', 'b'], 'layout edits do not change stored ordering');
    assert.deepEqual(errors, []);
    console.log('PASS: no entry sequence numbers; estimate/date share a row at tablet and phone widths; date changes preserve estimates and order.');
    console.log('Screenshots: ' + output);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
