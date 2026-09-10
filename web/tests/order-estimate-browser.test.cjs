// Real browser coverage for moving estimated duration from the composer into sorting.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const key = 'homework-ledger-v1', date = '2026-09-10';
const task = (id, minutes, extra = {}) => ({ id, subject: '数学', title: `完成练习册第 ${id} 页，并检查订正`, estimatedMinutes: minutes, status: 'pending', ...extra });

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-order-estimate-'));
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
    const page = await browser.newPage({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date(`${date}T18:00:00+08:00`));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    const seed = async state => {
      await page.evaluate(({ key, state }) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(state)); }, { key, state });
      await page.reload();
    };
    const estimate = id => page.locator(`[data-order-estimate="${id}"]`);
    const pick = id => page.locator(`[data-order-pick="${id}"]`);

    await seed({ records: { [date]: { ledgerConfirmed: true, tasks: [task('1', 60), task('2', 20)] } }, weekends: {} });
    await page.locator('#taskEntryLauncher').click();
    assert.equal(await page.locator('#taskEntryEstimate, #holidayTaskMinutes').count(), 0);
    await page.locator('#taskDraft').fill('背诵第三课');
    await page.locator('#addTasksButton').click();
    const tasks = (await read()).records[date].tasks, third = tasks[2].id;
    assert.deepEqual(tasks.map(t => t.estimatedMinutes), [60, 20, 15], 'new default leaves all existing estimates untouched');
    await page.locator('#taskEntryOrderButton').click();
    assert.equal(await estimate('1').inputValue(), '60');
    await estimate('1').selectOption('10');
    assert.equal(await pick('1').getAttribute('aria-pressed'), 'false', 'changing duration does not select a task');
    await pick('2').click();
    await estimate('2').selectOption('40');
    assert.equal(await pick('2').getAttribute('aria-pressed'), 'true', 'selected cards remain selected');
    assert.deepEqual((await read()).records[date].orderDraft.selectedIds, ['2']);
    for (const width of [320, 390, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      for (const id of ['1', '2', third]) {
        const select = await estimate(id).boundingBox();
        const card = await estimate(id).locator('..').locator('..').boundingBox();
        assert(select.x >= card.x && select.x + select.width <= card.x + card.width);
        assert(select.height >= 40);
      }
      await page.screenshot({ path: path.join(output, `sorting-${width}.png`), fullPage: true });
    }
    await pick(third).click(); await pick('1').click();
    assert.equal(await page.locator('[data-order-pick]').count(), 0, 'all-picked view is the final preview');
    await estimate(third).selectOption('30');
    assert.deepEqual((await read()).records[date].orderDraft.selectedIds, ['2', third, '1']);
    await page.locator('#taskEntryConfirmButton').click();
    let stored = (await read()).records[date];
    assert.deepEqual(stored.tasks.map(t => t.id), ['2', third, '1']);
    assert.deepEqual(stored.tasks.map(t => t.estimatedMinutes), [40, 30, 10]);
    assert.equal(await page.locator('#startPlanOverallTime').innerText(), '80 分钟');
    await page.reload();
    stored = (await read()).records[date];
    assert.deepEqual(stored.tasks.map(t => t.estimatedMinutes), [40, 30, 10]);

    // Weekend tabs and the final preview use the same per-task estimate controls.
    const friday = '2026-09-11';
    await page.clock.setFixedTime(new Date(`${friday}T18:00:00+08:00`));
    await seed({ records: { [friday]: { ledgerConfirmed: true } }, weekends: { [friday]: {
      tasks: [task('fri', 15, { plannedDay: 'friday' }), task('sat', 20, { plannedDay: 'saturday' }), task('sun', 30, { plannedDay: 'sunday' })]
    } } });
    await page.locator('#taskEntryLauncher').click();
    await page.locator('#taskEntryOrderButton').click();
    await estimate('fri').selectOption('5'); await pick('fri').click();
    await page.locator('[data-order-day=saturday]').click();
    await estimate('sat').selectOption('45'); await pick('sat').click();
    await page.locator('[data-order-day=sunday]').click();
    await estimate('sun').selectOption('60'); await pick('sun').click();
    await estimate('fri').selectOption('10');
    await page.locator('#taskEntryConfirmButton').click();
    const weekend = (await read()).weekends[friday];
    assert.deepEqual(weekend.tasks.map(t => [t.id, t.plannedDay, t.estimatedMinutes]), [['fri', 'friday', 10], ['sat', 'saturday', 45], ['sun', 'sunday', 60]]);
    assert(weekend.confirmed && weekend.orderSaved && weekend.planSaved);
    assert.equal(await page.locator('#startPlanOverallTime').innerText(), '10 分钟', 'Friday estimate excludes future days');
    assert.deepEqual(errors, []);
    console.log('PASS: default estimates, editable sorting and preview, independent selection, persisted order/duration, weekend dates and responsive controls.');
    console.log('Screenshots:', output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
