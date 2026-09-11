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
    assert.deepEqual(await page.locator('#taskEntryDays button').allTextContents(), ['周五2项', '周六0项', '周日0项']);
    assert.equal(await page.locator('#taskEntryDays [aria-pressed=true]').getAttribute('data-entry-day'), 'friday');
    assert.equal(await page.locator('.task-plan-number').count(), 0);
    assert.equal(await page.locator('.pending-task-title').first().innerText(), '背诵第3课', 'numbers inside homework content are preserved');
    for (const [width, height] of [[1024, 768], [390, 844], [320, 740]]) {
      await page.setViewportSize({ width, height });
      for (const row of await page.locator('.task-plan-row').all()) {
        assert.equal(await row.locator('.task-plan-estimate, .task-estimate').count(), 0, 'entry cards hide estimates like holiday cards');
        const title = await row.locator('.pending-task-title').boundingBox();
        const edit = await row.locator('[data-task-action="edit"]').boundingBox();
        const remove = await row.locator('[data-task-action="delete"]').boundingBox();
        const date = await row.locator('.task-plan-day').boundingBox();
        const card = await row.boundingBox();
        assert(edit.x >= title.x + title.width && edit.x - title.x - title.width < 4, 'edit stays just after the title');
        assert(date.x + date.width <= remove.x, 'delete is to the right of the date');
        assert(Math.abs(remove.y + remove.height / 2 - date.y - date.height / 2) < 1, 'date and delete align vertically');
        for (const box of [title, edit, remove, date]) assert(box.x >= card.x && box.x + box.width <= card.x + card.width && box.y + box.height <= card.y + card.height, 'content and controls stay inside the card');
        assert.equal((await row.locator('[data-task-action="edit"] svg').boundingBox()).width, 14);
        assert.equal((await row.locator('[data-task-action="delete"] svg').boundingBox()).width, 16);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `entry-${width}.png`), fullPage: true });
    }
    const before = await read();
    await page.locator('[data-pending-task-id="a"] [data-task-action="edit"]').click();
    await page.locator('#taskEditInput').fill('取消的内容');
    await page.locator('#taskEditEstimate').selectOption('45');
    await page.locator('#taskEditCancelButton').click();
    assert.deepEqual(await read(), before, 'cancel leaves both the title and estimate unchanged');
    await page.locator('[data-pending-task-id="a"] [data-task-action="edit"]').click();
    assert.equal(await page.locator('#taskEditEstimate').inputValue(), '15');
    await page.locator('#taskEditInput').fill('');
    await page.locator('#taskEditSaveButton').click();
    assert.equal(await page.locator('#taskEditModal').isVisible(), true, 'blank titles cannot be saved');
    await page.locator('#taskEditInput').fill('背诵第3课并复习');
    await page.locator('#taskEditEstimate').selectOption('30');
    assert.deepEqual(await read(), before, 'draft changes are saved together on confirmation');
    await page.locator('#taskEditSaveButton').click();
    before.tasks[0].title = '背诵第3课并复习';
    before.tasks[0].estimatedMinutes = 30;
    assert.deepEqual(await read(), before, 'editing preserves dates, order and metadata');
    await page.locator('[data-entry-plan-day="a"]').selectOption('saturday');
    assert.deepEqual(await page.locator('#taskEntryDays button').allTextContents(), ['周五1项', '周六1项', '周日0项']);
    assert.equal(await page.locator('[data-pending-task-id="a"]').count(), 0, 'moving a task removes it from the current day');
    const saved = (await read()).tasks;
    assert.equal(saved.find(task => task.id === 'a').plannedDay, 'saturday');
    assert.equal(saved.find(task => task.id === 'a').estimatedMinutes, 30);
    assert.deepEqual(saved.map(task => task.id), ['a', 'b'], 'layout edits do not change stored ordering');
    await page.locator('#taskEntryOrderButton').click();
    await page.locator('[data-order-estimate="b"]').selectOption('20');
    await page.locator('[data-order-day="saturday"]').click();
    assert.equal(await page.locator('[data-order-estimate="a"]').inputValue(), '30', 'sorting uses the estimate set in the entry list');
    await page.locator('#taskOrderCloseButton').click();
    const checkEstimate = async (id, minutes) => {
      await page.locator(`[data-pending-task-id="${id}"] [data-task-action="edit"]`).click();
      assert.equal(await page.locator('#taskEditEstimate').inputValue(), minutes);
      await page.locator('#taskEditCancelButton').click();
    };
    await checkEstimate('b', '20');
    await page.reload();
    await page.locator('#taskEntryLauncher').click();
    await page.locator('[data-entry-day="saturday"]').click();
    await checkEstimate('a', '30');
    await page.locator('[data-entry-day="friday"]').click();
    await checkEstimate('b', '20');
    await page.locator('#taskEntryConfirmButton').click();
    assert.equal(await page.locator('#startPlanOverallTime').innerText(), '20 分钟', 'remaining time uses the updated estimate for today');
    await page.locator('#startPlanCloseButton').click();
    await page.locator('#confirmTaskListButton').click();
    await page.locator('[data-entry-day="saturday"]').click();
    await page.locator('#taskEntryEstimate').selectOption('45');
    const existingBeforeAdd = (await read()).tasks;
    await page.locator('#taskDraft').fill('1.作文 2.小古文');
    await page.locator('#addTasksButton').click();
    const withNewTasks = (await read()).tasks;
    assert.deepEqual(withNewTasks.slice(0, 2), existingBeforeAdd, 'adding homework retains existing tasks and order');
    assert(withNewTasks.slice(2).every(task => task.estimatedMinutes === 45 && task.plannedDay === 'saturday'));
    assert.equal(withNewTasks.length, 4);
    await page.reload();
    assert((await read()).tasks.slice(2).every(task => task.estimatedMinutes === 45), 'weekend entry estimates survive reload');
    // An empty plan offers all three weekdays before the first addition.
    await page.evaluate(() => localStorage.setItem('homework-ledger-v1', JSON.stringify({ records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: {} })));
    await page.reload(); await page.locator('#taskEntryLauncher').click();
    const counts = () => page.locator('#taskEntryDays button').allTextContents();
    const selectedDay = () => page.locator('#taskEntryDays [aria-pressed=true]').getAttribute('data-entry-day');
    assert.equal(await page.locator('#taskEntryDays').isVisible(), true);
    assert.deepEqual(await counts(), ['周五0项', '周六0项', '周日0项']);
    await page.locator('#taskDraft').fill('周五背诵'); await page.locator('#addTasksButton').click();
    assert.equal((await read()).tasks[0].plannedDay, 'friday', 'first addition follows the initial Friday tab');
    await page.locator('[data-entry-day="sunday"]').click();
    assert.equal(await page.locator('[data-pending-task-id]').count(), 0);
    assert.match(await page.locator('#taskEntryPendingList').innerText(), /周日还没有安排作业/);
    await page.locator('#taskDraft').fill('1.周日作文 2.周日朗读'); await page.locator('#taskDraft').press('Enter');
    assert.equal(await selectedDay(), 'sunday');
    assert((await read()).tasks.slice(1).every(task => task.plannedDay === 'sunday'));
    assert.deepEqual(await counts(), ['周五1项', '周六0项', '周日2项']);
    await page.locator('.task-plan-row [data-entry-plan-day]').first().selectOption('saturday');
    assert.equal(await selectedDay(), 'sunday');
    assert.deepEqual(await counts(), ['周五1项', '周六1项', '周日1项']);
    await page.locator('#taskEntryPendingList [data-task-action="delete"]').click();
    assert.deepEqual(await counts(), ['周五1项', '周六1项', '周日0项']);
    await page.locator('#taskEntryUndoDeleteButton').click();
    assert.deepEqual(await counts(), ['周五1项', '周六1项', '周日1项']);
    await page.locator('#taskEntryCloseButton').click(); await page.locator('#taskEntryLauncher').click();
    assert.equal(await selectedDay(), 'sunday', 'reopening preserves the chosen day');
    await page.locator('[data-entry-day="saturday"]').click();
    await page.locator('#taskDraft').fill('周六练习'); await page.locator('#addTasksButton').click();
    assert.equal((await read()).tasks.at(-1).plannedDay, 'saturday');
    assert.equal(await selectedDay(), 'saturday');
    assert.deepEqual(await counts(), ['周五1项', '周六2项', '周日1项']);
    for (const width of [1024, 390, 320]) {
      await page.setViewportSize({ width, height: 740 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `weekday-tabs-${width}.png`), fullPage: true });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: compact holiday-style entry cards; title and estimate editing, cancellation, day changes, deletion/undo, sorting and persistence at tablet and phone widths.');
    console.log('Screenshots: ' + output);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
