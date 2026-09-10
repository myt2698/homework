// Isolated storage and real browser coverage for completion undo, recap and backup recovery.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const DATE = '2026-09-10';
const NOW = new Date(`${DATE}T18:00:00+08:00`).getTime();
const STORAGE = 'homework-ledger-v1';
const SNAPSHOT = 'homework-pre-import-snapshot-v1';
const task = (id, extra = {}) => ({ id, subject: '语文', title: `练习${id}`, estimatedMinutes: 15, status: 'pending', ...extra });
const state = tasks => ({ records: { [DATE]: { ledgerConfirmed: true, tasksConfirmed: true, orderSaved: true, tasks } },
  weekends: {}, holidays: {}, dictationCustom: {}, dictationLesson: 'lesson-2', taskKeywords: { _defaultsVersion: 2, 语文: [{ id: 'custom', label: '自定练习', visible: true }] } });

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-recovery-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let acceptDialog = true;
    page.on('dialog', dialog => acceptDialog ? dialog.accept() : dialog.dismiss());
    await page.clock.install({ time: new Date(NOW - 60000) });
    await page.clock.pauseAt(new Date(NOW));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE);
    const currentTask = async () => (await read()).records[DATE].tasks[0];
    const seed = async data => {
      await page.evaluate(({ key, data }) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(data)); }, { key: STORAGE, data });
      await page.reload();
    };
    const openBackup = async () => {
      await page.locator('#settingsButton').click();
      await page.locator('#openBackupSettingsButton').click();
    };
    const upload = async data => {
      await page.locator('#importDataInput').setInputFiles({ name: 'test.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
    };
    const waitTitle = title => page.waitForFunction(({ key, date, title }) =>
      JSON.parse(localStorage.getItem(key)).records[date].tasks[0].title === title, { key: STORAGE, date: DATE, title });
    const denyWrites = key => page.evaluate(key => {
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(name, value) {
        if (name === key) throw new DOMException('full', 'QuotaExceededError');
        return originalSetItem.call(this, name, value);
      };
    }, key);
    const allowWrites = () => page.evaluate(() => { Storage.prototype.setItem = originalSetItem; });

    // Paused minutes remain deducted, and undo returns to the live task without charging the gap.
    await seed(state([task('a', { status: 'paused', elapsedMs: 5 * 60000 }), task('b')]));
    assert.match(await page.locator('.task-overview').innerText(), /25 分钟/);
    await page.locator('#taskList [data-task-action=start][data-task-id=a]').click();
    assert.equal(await page.locator('#focusOverallTime').innerText(), '25 分钟');
    await page.clock.runFor(60000);
    await page.locator('#focusCompleteButton').click();
    assert.equal(await page.locator('#completionUndoNotice').isVisible(), true);
    assert.equal(await page.locator('#saveStartPlanButton').innerText(), '现在开始');
    await page.locator('#startPlanFiveMinutesButton').click();
    assert.equal(await page.locator('#saveStartPlanButton').innerText(), '确定开始时间');
    for (const width of [320, 390, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      const layout = await page.locator('.start-plan-time-row').evaluate(row => {
        const input = row.querySelector('input'), button = row.querySelector('button');
        return { overflow: document.documentElement.scrollWidth > innerWidth, inputWidth: input.clientWidth,
          buttonWidth: button.clientWidth, buttonScroll: button.scrollWidth, rowWidth: row.clientWidth, rowScroll: row.scrollWidth };
      });
      assert.equal(layout.overflow, false);
      assert(layout.inputWidth >= 80, `time picker stays readable at ${width}: ${JSON.stringify(layout)}`);
      assert(layout.buttonScroll <= layout.buttonWidth && layout.rowScroll <= layout.rowWidth + 1);
      await page.screenshot({ path: path.join(output, `next-and-undo-${width}.png`), fullPage: true });
    }
    await page.locator('#saveStartPlanButton').click();
    assert.equal(await page.locator('#startPlanCountdown').isVisible(), true);
    await page.clock.runFor(2000);
    await page.locator('#undoCompletionButton').click();
    assert.equal(await page.locator('#focusModal').isVisible(), true);
    assert.equal((await currentTask()).status, 'active');
    assert.equal((await currentTask()).elapsedMs, 6 * 60000);
    assert.equal(await page.evaluate(() => localStorage.getItem('homework-start-plan-session-v1')), null);
    await page.locator('#focusCompleteButton').click();
    await page.locator('#saveStartPlanButton').click();
    assert.equal(await page.locator('#completionUndoNotice').isVisible(), false, 'starting next clears old undo');
    assert.equal((await read()).records[DATE].tasks[1].status, 'active');

    // Final completion creates a recap and settlement; undo clears both, preserving actual time.
    await seed(state([task('final')]));
    await page.locator('#taskList [data-task-action=start]').click();
    await page.clock.runFor(5 * 60000);
    await page.locator('#focusCompleteButton').click();
    assert.match(await page.locator('.daily-task-review').innerText(), /预计 15 分钟[\s\S]*实际 5 分钟/);
    assert((await read()).records[DATE].finishTime);
    await page.screenshot({ path: path.join(output, 'daily-review.png'), fullPage: true });
    await page.locator('#undoCompletionButton').click();
    assert.equal(await page.locator('.daily-task-review').count(), 0);
    assert.equal((await currentTask()).elapsedMs, 5 * 60000);
    assert.equal((await read()).records[DATE].finishTime, undefined);
    await page.locator('#focusCompleteButton').click();
    await page.clock.runFor(8001);
    assert.equal(await page.locator('#completionUndoNotice').isVisible(), false, 'undo expires after eight seconds');
    assert.equal((await currentTask()).status, 'done');
    await seed(state([task('legacy', { status: 'done', completedAt: '17:00' })]));
    assert.match(await page.locator('.daily-task-review').innerText(), /实际 未记录/);
    await seed(state([]));
    assert.equal(await page.locator('.daily-task-review').count(), 0, 'an empty list has no completion recap');

    // Snapshots survive reload, include all data groups, and leave restored clocks paused.
    const now = await page.evaluate(() => Date.now());
    const original = state([task('original', { status: 'active', elapsedMs: 60000, activeSince: now - 120000 })]);
    original.records['2026-09-08'] = { note: '原来的记录', tasks: [] };
    original.weekends['2026-09-04'] = { tasks: [task('weekend', { status: 'done' })] };
    original.dictationCustom = { 'lesson-2': ['测试词语'] };
    await seed(original);
    await page.locator('#focusPauseButton').click();
    await page.locator('#breakChoiceCloseButton').click();
    await openBackup();
    assert.equal(await page.locator('#restoreSnapshotButton').isDisabled(), true);
    const beforeImport = await read();
    const imported = state([task('imported')]);
    await upload({ records: [], weekends: {} });
    assert.deepEqual(await read(), beforeImport, 'invalid imports do not modify live data');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), SNAPSHOT), null);
    acceptDialog = false;
    await upload(imported);
    assert.deepEqual(await read(), beforeImport, 'cancelled imports do not create a snapshot');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), SNAPSHOT), null);
    acceptDialog = true;
    await denyWrites(SNAPSHOT);
    await upload(imported);
    assert.deepEqual(await read(), beforeImport, 'snapshot write failure prevents replacement');
    await allowWrites();
    await denyWrites(STORAGE);
    await upload(imported);
    assert.deepEqual(await read(), beforeImport, 'live-data write failure also preserves current data');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state, SNAPSHOT), beforeImport);
    await allowWrites();
    await upload({ format: 'homework-ledger-backup', version: 3, exportedAt: new Date(now).toISOString(), state: imported });
    await waitTitle('练习imported');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).state, SNAPSHOT), beforeImport);
    assert.equal(await page.locator('#restoreSnapshotButton').isEnabled(), true);
    const importedState = await read();
    await denyWrites(STORAGE);
    await page.locator('#restoreSnapshotButton').click();
    assert.deepEqual(await read(), importedState, 'failed snapshot recovery leaves live data unchanged');
    await allowWrites();
    await page.reload();
    await openBackup();
    await page.locator('#restoreSnapshotButton').click();
    await waitTitle('练习original');
    assert.deepEqual(await read(), beforeImport);
    assert.equal((await currentTask()).status, 'paused');
    assert.equal((await currentTask()).elapsedMs, 180000);
    assert.equal(await page.evaluate(() => localStorage.getItem('homework-break-session-v1')), null);
    for (const width of [320, 390, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `backup-${width}.png`), fullPage: true });
    }
    const rollbackSnapshot = await page.evaluate(key => localStorage.getItem(key), SNAPSHOT);
    await page.locator('#restoreSnapshotButton').click();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), SNAPSHOT), rollbackSnapshot, 'recovery does not replace its own snapshot');

    // An exported active clock is stopped at export time, never the later import time.
    const activeBackup = state([task('clock', { status: 'active', elapsedMs: 60000, activeSince: now - 10 * 60000 })]);
    await upload({ format: 'homework-ledger-backup', exportedAt: new Date(now - 5 * 60000).toISOString(), state: activeBackup });
    await waitTitle('练习clock');
    assert.equal((await currentTask()).status, 'paused');
    assert.equal((await currentTask()).elapsedMs, 6 * 60000);
    assert.equal((await currentTask()).activeSince, undefined);
    await page.reload();
    assert.equal(await page.locator('#focusModal').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: remaining estimates, current/future labels, completion undo/expiry, final recap/settlement, backup validation/cancellation/quota failure, snapshot recovery and restored clocks.');
    console.log('Screenshots:', output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
