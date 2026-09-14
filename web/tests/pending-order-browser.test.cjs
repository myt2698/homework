// Exercise ordering during execution with isolated browser storage and a controlled clock.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const KEY = 'homework-ledger-v1', today = '2026-09-14';
const epoch = date => new Date(`${date}T18:00:00+08:00`).getTime();
const task = (id, extra = {}) => ({ id, subject: '数学', title: `作业${id}`, status: 'pending', elapsedMs: 0, estimatedMinutes: 15, ...extra });
const active = (date = today) => task('active', { status: 'active', elapsedMs: 60000, activeSince: epoch(date) - 120000, startedAt: '17:57' });
const done = () => task('done', { status: 'done', completedAt: '17:45', completedDate: today, elapsedMs: 300000 });
const paused = () => task('paused', { status: 'paused', elapsedMs: 90000, startedAt: '17:46' });
const owner = tasks => ({ tasks, ledgerConfirmed: true, tasksConfirmed: true, orderSaved: true, tasksConfirmedAt: '17:30', orderSavedAt: '17:35', note: '保留记录', breaks: [] });
const daily = tasks => ({ records: { [today]: owner(tasks) }, weekends: {} });

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-pending-order-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(7000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date(epoch(today) - 60000) });
    await page.clock.pauseAt(new Date(epoch(today)));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    const seed = async (data, date = today) => {
      await page.clock.setSystemTime(new Date(epoch(date)));
      await page.evaluate(({ key, data }) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(data)); }, { key: KEY, data });
      await page.reload();
    };
    const picks = () => page.locator('#pendingOrderList [data-pending-order-pick]').evaluateAll(nodes => nodes.map(node => node.dataset.pendingOrderPick));
    const pick = id => page.locator(`[data-pending-order-pick="${id}"]`).click();
    const save = () => page.locator('#pendingOrderSaveButton').click();
    const assertOnlyReordered = (before, after, expected) => {
      assert.deepEqual(after.tasks.map(t => t.id), expected);
      assert.deepEqual({ ...after, tasks: before.tasks }, before, 'owner flags, completion and break metadata are preserved');
      for (const original of before.tasks) assert.deepEqual(after.tasks.find(t => t.id === original.id), original, `task ${original.id} keeps all data`);
      for (const [index, original] of before.tasks.entries()) if (original.status !== 'pending') assert.equal(after.tasks[index].id, original.id, 'started/completed slots stay fixed');
    };

    await seed(daily([done(), active(), task('a'), task('b'), task('c')]));
    const original = (await read()).records[today];
    assert.equal(await page.locator('#focusModal').isVisible(), true);
    await page.locator('#focusPendingOrderButton').click();
    assert.deepEqual(await picks(), ['a', 'b', 'c']);
    assert.equal(await page.locator('#pendingOrderSaveButton').isDisabled(), true);
    await pick('c'); await pick('c');
    assert.match(await page.locator('#pendingOrderHint').innerText(), /第 2 项/);
    await page.locator('#pendingOrderUndoButton').click();
    assert.equal(await page.locator('#pendingOrderUndoButton').isDisabled(), true);
    await pick('b'); await page.locator('#pendingOrderResetButton').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#pendingOrderModal').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'focusPendingOrderButton');
    assert.deepEqual((await read()).records[today], original, 'cancel does not persist the draft');

    await page.locator('#focusPendingOrderButton').click();
    for (const width of [1024, 390, 320]) {
      await page.setViewportSize({ width, height: 740 });
      const box = await page.locator('.pending-order-dialog').boundingBox();
      assert(box.x >= 0 && box.x + box.width <= width + 1 && box.y >= 0 && box.y + box.height <= 741);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `pending-${width}.png`), fullPage: true });
    }
    await page.clock.runFor(60000);
    assert.deepEqual((await read()).records[today].tasks, original.tasks, 'reordering never resets the active clock');
    await pick('c'); await pick('a'); await pick('b');
    assert.deepEqual(await picks(), ['c', 'a', 'b'], 'preview reflects the chosen order');
    await page.locator('#pendingOrderCloseButton').focus(); await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'pendingOrderResetButton', 'keyboard focus stays in the top dialog');
    await save();
    assertOnlyReordered(original, (await read()).records[today], ['done', 'active', 'c', 'a', 'b']);
    assert.equal(await page.locator('#focusModal').isVisible(), true);
    await page.reload();
    assert.deepEqual((await read()).records[today].tasks.map(t => t.id), ['done', 'active', 'c', 'a', 'b']);
    await page.locator('#focusCompleteButton').click();
    assert.equal(await page.locator('#startPlanModal').getAttribute('data-task-id'), 'c', 'completion suggests the newly chosen next task');

    // Active tasks can be in the middle after skipping; preserve their index while rotating pending slots.
    await seed(daily([task('a'), paused(), active(), task('b'), done(), task('c')]));
    const wrapped = (await read()).records[today];
    await page.locator('#focusPendingOrderButton').click();
    assert.deepEqual(await picks(), ['b', 'c', 'a']);
    await pick('a'); await pick('c'); await pick('b'); await save();
    assertOnlyReordered(wrapped, (await read()).records[today], ['b', 'paused', 'active', 'a', 'done', 'c']);
    await page.locator('#focusSkipButton').click();
    assert.equal((await read()).records[today].tasks.find(t => t.status === 'active').id, 'a', 'skip also follows the new order');

    // Homepage entry works after stopping/completing some tasks, without unlocking the full plan.
    await seed(daily([done(), paused(), task('a'), task('b')]));
    await page.locator('#taskOrderButton').click(); await pick('b'); await pick('a');
    const beforeFailure = (await read()).records[today];
    await page.evaluate(key => {
      window.realSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(name, value) { if (name === key) throw new DOMException('full', 'QuotaExceededError'); realSetItem.call(this, name, value); };
    }, KEY);
    await save(); assert.match(await page.locator('#pendingOrderError').innerText(), /保存失败/);
    assert.deepEqual((await read()).records[today], beforeFailure);
    await page.evaluate(() => { Storage.prototype.setItem = realSetItem; });
    await save();
    assertOnlyReordered(beforeFailure, (await read()).records[today], ['done', 'paused', 'b', 'a']);

    // Legacy weekend dates migrate separately. Carryover joins today only when explicitly moved.
    const saturday = '2026-09-12', friday = '2026-09-11';
    await seed({ records: {}, weekends: { [friday]: { tasks: [active(saturday), task('carry', { plannedDay: 'friday' }), task('future', { plannedDay: 'sunday' }), task('sat', { plannedDay: 'saturday' })], confirmed: true, planSaved: true, orderSaved: true } } }, saturday);
    const weekend = (await read()).weekends[friday];
    assert.equal(await page.locator('#focusPendingOrderButton').isVisible(), false);
    await page.locator('#focusPauseButton').click();
    await page.locator('#breakChoiceCloseButton').click();
    await page.locator('#holidayOverdueSummary').click();
    await page.locator('#holidayOverdueList [data-holiday-action=move]').click();
    const saturdayBefore = (await read()).records[saturday];
    await page.locator('#taskOrderButton').click();
    assert.deepEqual(await picks(), ['sat', 'carry']); await pick('carry'); await pick('sat'); await save();
    assertOnlyReordered(saturdayBefore, (await read()).records[saturday], ['active', 'carry', 'sat']);
    assert.deepEqual((await read()).weekends[friday], weekend, 'original weekend archive stays intact');
    assert.equal((await read()).records['2026-09-13'].tasks[0].id, 'future');

    // Holiday daily records keep holiday identifiers and operate independently of weekend grouping.
    const holiday = daily([active(), task('a', { holidayId: 'h' }), task('b', { holidayId: 'h' })]);
    holiday.records[today].holidayDaily = true;
    await seed(holiday);
    const holidayBefore = (await read()).records[today];
    await page.locator('#focusPendingOrderButton').click(); await pick('b'); await pick('a'); await save();
    assertOnlyReordered(holidayBefore, (await read()).records[today], ['active', 'b', 'a']);

    // Zero/one pending task has no ordering action, and crossing midnight rejects an open draft.
    await seed(daily([active(), task('only')]));
    assert.equal(await page.locator('#focusPendingOrderButton').isVisible(), false);
    assert.equal(await page.locator('#taskOrderButton').isVisible(), false);
    await seed(daily([active(), task('a'), task('b')]));
    const stale = (await read()).records[today];
    await page.locator('#focusPendingOrderButton').click(); await pick('b'); await pick('a');
    await page.clock.setSystemTime(new Date(epoch('2026-09-15'))); await save();
    assert.equal(await page.locator('#pendingOrderModal').isVisible(), false);
    assert.deepEqual((await read()).records[today], stale, 'stale order never overwrites the record');
    assert.deepEqual(errors, []);
    console.log('PASS: pending-only ordering, active/paused/completed preservation, next/skip order, cancellation, reload, failed saves, weekend/holiday boundaries, stale dates, responsive UI and keyboard focus.');
    console.log('Screenshots: ' + output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
