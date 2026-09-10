// Real browser, isolated records: append after starting without changing earlier work.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const KEY = 'homework-ledger-v1';
const today = '2026-09-10';
const time = date => new Date(`${date}T18:00:00+08:00`).getTime();
const task = (id, extra = {}) => ({ id, subject: '数学', title: `练习${id}`, status: 'pending', estimatedMinutes: 15, elapsedMs: 0, ...extra });
const owner = tasks => ({ tasks, tasksConfirmed: true, ledgerConfirmed: true, orderSaved: true,
  tasksConfirmedAt: '17:30', orderSavedAt: '17:35', note: '保留原记录' });
const daily = tasks => ({ records: { [today]: owner(tasks) }, weekends: {}, holidays: {} });

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-supplement-'));
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
    const page = await browser.newPage({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(7000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date(time(today) - 60000) });
    await page.clock.pauseAt(new Date(time(today)));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const read = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
    const seed = async (data, date = today) => {
      await page.clock.setSystemTime(new Date(time(date)));
      await page.evaluate(({ key, data }) => { localStorage.clear(); localStorage.setItem(key, JSON.stringify(data)); }, { key: KEY, data });
      await page.reload();
    };
    const add = async (entry, title = '老师新发的练习', subject = '科学', minutes = 20) => {
      await page.locator(entry).click();
      await page.locator('#supplementSubject').selectOption(subject);
      await page.locator('#supplementEstimate').selectOption(String(minutes));
      await page.locator('#supplementInput').fill(title);
      await page.locator('#supplementSaveButton').click();
      assert.equal(await page.locator('#supplementModal').isVisible(), false);
    };

    const started = daily([task('done', { status: 'done', elapsedMs: 120000, completedAt: '17:40' }),
      task('active', { status: 'active', elapsedMs: 60000, activeSince: time(today) - 240000, startedAt: '17:55' }), task('later')]);
    await seed(started);
    const original = await read();
    await page.locator('#focusSupplementButton').click();
    await page.locator('#supplementSaveButton').click();
    assert.match(await page.locator('#supplementError').innerText(), /请先输入/);
    assert.deepEqual(await read(), original, 'empty input never changes the plan');
    await page.locator('#supplementInput').fill('完成科学练习册第 12 页');
    for (const width of [320, 390, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      const bounds = await page.locator('#supplementModal .task-edit-dialog').boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `supplement-${width}.png`), fullPage: true });
    }
    await page.locator('#supplementSaveButton').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'supplementCloseButton');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#focusModal').isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'focusSupplementButton');
    assert.deepEqual(await read(), original, 'cancellation leaves the existing tasks and clock intact');
    await add('#focusSupplementButton');
    let current = (await read()).records[today];
    assert.deepEqual(current.tasks.slice(0, 3), original.records[today].tasks);
    assert.equal(current.orderSavedAt, '17:35');
    assert.equal(current.tasksConfirmedAt, '17:30');
    assert.equal(current.tasks[3].subject, '科学');
    assert.equal(current.tasks[3].estimatedMinutes, 20);
    assert.equal(current.tasks[3].status, 'pending');
    assert.equal(await page.locator('#focusOverallTotal').innerText(), '4');
    assert.equal(await page.locator('#focusOverallDone').innerText(), '1');
    assert.equal(await page.locator('#focusOverallTime').innerText(), '45 分钟');
    await page.clock.runFor(60000);
    assert.equal(await page.locator('#focusOverallTime').innerText(), '44 分钟');
    await page.reload();
    assert.equal(await page.locator('#focusModal').isVisible(), true);
    assert.equal((await read()).records[today].tasks.length, 4, 'supplement survives reopening');

    // Storage failure keeps the form and every original task, so retry is possible.
    const beforeFailure = await read();
    await page.locator('#focusSupplementButton').click();
    await page.locator('#supplementInput').fill('未保存的练习');
    await page.evaluate(key => {
      window.savedSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(name, value) {
        if (name === key) throw new DOMException('full', 'QuotaExceededError');
        savedSetItem.call(this, name, value);
      };
    }, KEY);
    await page.locator('#supplementSaveButton').click();
    assert.match(await page.locator('#supplementError').innerText(), /保存失败/);
    assert.deepEqual(await read(), beforeFailure);
    await page.evaluate(() => { Storage.prototype.setItem = savedSetItem; });
    await page.locator('#supplementCancelButton').click();

    // Rest and scheduled start retain their original target and alarm deadline.
    await page.locator('#focusPauseButton').click();
    await page.locator('#breakChoiceModal [data-break-minutes="5"]').click();
    const breakBefore = await page.evaluate(() => localStorage.getItem('homework-break-session-v1'));
    await add('#breakSupplementButton', '休息时补加');
    assert.equal(await page.evaluate(() => localStorage.getItem('homework-break-session-v1')), breakBefore);
    await page.locator('#startNextTaskButton').click();
    await page.locator('#focusCompleteButton').click();
    await page.locator('#startPlanFiveMinutesButton').click();
    await page.locator('#saveStartPlanButton').click();
    const planBefore = await page.evaluate(() => localStorage.getItem('homework-start-plan-session-v1'));
    await add('#startPlanSupplementButton', '等开始时补加');
    assert.equal(await page.evaluate(() => localStorage.getItem('homework-start-plan-session-v1')), planBefore);

    // Appending gives a paused last task a new skip destination immediately.
    await seed(daily([task('paused', { status: 'paused', elapsedMs: 60000 }),
      task('active', { status: 'active', activeSince: time(today) })]));
    await page.locator('#focusCompleteButton').click();
    assert.equal(await page.locator('#skipPausedTaskButton').isDisabled(), true);
    await add('#startPlanSupplementButton', '新的下一项');
    assert.equal(await page.locator('#skipPausedTaskButton').isEnabled(), true);
    await page.locator('#skipPausedTaskButton').click();
    assert.equal((await read()).records[today].tasks[2].status, 'active');
    assert.equal((await read()).records[today].tasks[0].elapsedMs, 60000);

    // A completed day reopens and settles again only after the new task is done.
    const completed = daily([task('finished', { status: 'done', elapsedMs: 300000, completedAt: '17:50' })]);
    Object.assign(completed.records[today], { finishTime: '17:50', tasksFinishedAt: '17:50', ruleId: 'best' });
    await seed(completed);
    await add('#supplementTaskButton', '完成后补加');
    current = (await read()).records[today];
    assert.equal(current.finishTime, undefined);
    assert.equal(current.tasksFinishedAt, undefined);
    assert.equal(current.ruleId, undefined);
    assert.equal(current.tasksConfirmed, true);
    assert.equal(await page.locator('.daily-task-review').count(), 0);
    await page.locator('#taskList [data-task-action=start]').click();
    await page.locator('#focusCompleteButton').click();
    assert((await read()).records[today].finishTime);
    assert.equal(await page.locator('.daily-task-review').count(), 1);

    // Each weekend day appends to today while preserving the entire three-day plan.
    for (const [date, plannedDay] of [['2026-09-11', 'friday'], ['2026-09-12', 'saturday'], ['2026-09-13', 'sunday']]) {
      const tasks = [task('current', { plannedDay, status: 'active', activeSince: time(date), startedAt: '18:00' }),
        task('other', { plannedDay: plannedDay === 'sunday' ? 'friday' : 'sunday', ...(plannedDay === 'sunday' ? { status: 'done', completedDate: '2026-09-11' } : {}) })];
      const weekend = { records: {}, holidays: {}, weekends: { '2026-09-11': { ...owner(tasks), confirmed: true, confirmedAt: '17:30', planSaved: true, planSavedAt: '17:35' } } };
      await seed(weekend, date);
      await add('#focusSupplementButton');
      const updated = (await read()).weekends['2026-09-11'];
      assert.deepEqual(updated.tasks.slice(0, 2), tasks);
      assert.equal(updated.tasks[2].plannedDay, plannedDay);
      assert.equal(updated.planSavedAt, '17:35');
      await page.locator('#focusSkipButton').click();
      assert.equal((await read()).weekends['2026-09-11'].tasks[2].status, 'active', 'new task runs today despite future items before it');
    }

    // Holiday supplements are one-off daily instances visible to the existing holiday plan.
    const holiday = daily([task('holiday-active', { status: 'active', activeSince: time(today), holidayId: 'h' })]);
    holiday.holidays.h = { id: 'h', name: '测试假期', start: today, end: '2026-09-12', planDate: '2026-09-09', confirmed: true };
    holiday.records[today].holidayDaily = true;
    holiday.records['2026-09-11'] = { tasks: [task('tomorrow', { holidayId: 'h' })], holidayDaily: true, tasksConfirmed: true, orderSaved: true };
    await seed(holiday);
    await add('#focusSupplementButton');
    const holidayState = await read();
    assert.equal(holidayState.records[today].tasks[1].holidayId, 'h');
    assert.equal(holidayState.records[today].tasks[1].holidayOriginalDate, today);
    assert.equal(holidayState.records[today].tasks[1].holidaySeriesId, '');
    assert.deepEqual(holidayState.records['2026-09-11'], holiday.records['2026-09-11']);
    assert.equal(holidayState.holidays.h.confirmed, true);

    // A form left open across midnight cannot accidentally append to yesterday.
    await page.locator('#focusSupplementButton').click();
    await page.locator('#supplementInput').fill('跨天后不应保存');
    const beforeMidnight = await read();
    await page.clock.setSystemTime(new Date(time('2026-09-11')));
    await page.locator('#supplementSaveButton').click();
    assert.deepEqual(await read(), beforeMidnight);
    assert.equal(await page.locator('#supplementModal').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: append while focusing/resting/waiting; preserve tasks, clocks and order; update progress; cancel/validate/retry; reload; reopen settlement; weekend and holiday scope; midnight guard.');
    console.log('Screenshots:', output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
