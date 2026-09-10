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
    await page.addInitScript(() => {
      if (localStorage.getItem('homework-ledger-v1')) return;
      localStorage.setItem('homework-ledger-v1', JSON.stringify({
      records: { '2026-09-11': { ledgerConfirmed: true } },
      weekends: { '2026-09-11': { tasks: [
        { id: 'a', subject: '语文', title: '背诵第3课', estimatedMinutes: 15, plannedDay: 'friday', status: 'pending' },
        { id: 'b', subject: '数学', title: '课作本第12页，检查并订正', estimatedMinutes: 60, plannedDay: 'friday', status: 'pending' }
      ] } }
      }));
    });
    const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).weekends['2026-09-11']);
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#taskEntryLauncher').click();
    assert.equal(await page.locator('.task-plan-number').count(), 0);
    assert.equal(await page.locator('.pending-task-title').first().innerText(), '背诵第3课', 'numbers inside homework content are preserved');
    for (const [width, height] of [[1024, 768], [390, 844], [320, 740]]) {
      await page.setViewportSize({ width, height });
      for (const row of await page.locator('.task-plan-row').all()) {
        const estimate = await row.locator('.task-plan-estimate').boundingBox();
        const date = await row.locator('.task-plan-day').boundingBox();
        const card = await row.boundingBox();
        assert(estimate.x + estimate.width <= date.x, 'estimate is to the left of the date');
        assert(Math.abs(estimate.y + estimate.height / 2 - date.y - date.height / 2) < 1, 'estimate and date are vertically centered in one row');
        assert(estimate.x >= card.x && date.x + date.width <= card.x + card.width, 'both controls stay inside the card');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `entry-${width}.png`), fullPage: true });
    }
    const before = await read();
    await page.locator('[data-pending-task-id="a"] [data-task-action="edit"]').click();
    await page.locator('[data-pending-edit-id="a"]').fill('背诵第3课并复习');
    await page.locator('[data-entry-estimate="a"]').selectOption('30');
    assert.equal(await page.locator('[data-pending-edit-id="a"]').inputValue(), '背诵第3课并复习', 'estimate changes preserve unsaved title input');
    before.tasks[0].estimatedMinutes = 30;
    assert.deepEqual(await read(), before, 'estimate changes save immediately without altering task dates, order or metadata');
    await page.locator('[data-pending-task-id="a"] [data-task-action="save-edit"]').click();
    await page.locator('[data-entry-plan-day="a"]').selectOption('saturday');
    const saved = (await read()).tasks;
    assert.equal(saved.find(task => task.id === 'a').plannedDay, 'saturday');
    assert.equal(saved.find(task => task.id === 'a').estimatedMinutes, 30);
    assert.deepEqual(saved.map(task => task.id), ['a', 'b'], 'layout edits do not change stored ordering');
    await page.locator('#taskEntryOrderButton').click();
    await page.locator('[data-order-estimate="b"]').selectOption('20');
    await page.locator('[data-order-day="saturday"]').click();
    assert.equal(await page.locator('[data-order-estimate="a"]').inputValue(), '30', 'sorting uses the estimate set in the entry list');
    await page.locator('#taskOrderCloseButton').click();
    assert.equal(await page.locator('[data-entry-estimate="b"]').inputValue(), '20', 'entry reflects estimates changed in sorting');
    await page.reload();
    await page.locator('#taskEntryLauncher').click();
    assert.equal(await page.locator('[data-entry-estimate="a"]').inputValue(), '30');
    assert.equal(await page.locator('[data-entry-estimate="b"]').inputValue(), '20');
    await page.locator('#taskEntryConfirmButton').click();
    assert.equal(await page.locator('#startPlanOverallTime').innerText(), '20 分钟', 'remaining time uses the updated estimate for today');
    assert.deepEqual(errors, []);
    console.log('PASS: editable estimates beside dates at tablet and phone widths; saved estimates survive title/date edits, sorting and reload, and update remaining time.');
    console.log('Screenshots: ' + output);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
