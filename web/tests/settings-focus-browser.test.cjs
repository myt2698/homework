// Isolated browser QA: settings navigation, mocked microphone lifecycle, backup,
// shared entry controls, and the hierarchy of the home/focus task card.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-settings-focus-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 1024, height: 768 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.clock.setFixedTime(new Date('2026-09-09T18:00:00+08:00'));
    await page.addInitScript(() => {
      if (!localStorage.getItem('settings-focus-seeded')) {
        localStorage.setItem('settings-focus-seeded', 'yes');
        localStorage.setItem('homework-ledger-v1', JSON.stringify({ records: { '2026-09-09': {
          ledgerConfirmed: true, tasksConfirmed: true, orderSaved: true,
          tasks: [{ id: 'focus-test', subject: '语文', title: '背诵', estimatedMinutes: 15, status: 'pending' }]
        } }, weekends: {} }));
      }
      window.micTest = { pending: [], starts: 0, stops: 0, released: 0, played: 0, paused: 0 };
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
        getUserMedia: () => new Promise(resolve => micTest.pending.push(() => resolve({
          getTracks: () => [{ stop: () => micTest.released++ }]
        })))
      } });
      window.MediaRecorder = class {
        static isTypeSupported() { return true; }
        constructor() { this.state = 'inactive'; this.mimeType = 'audio/webm'; }
        start() { this.state = 'recording'; micTest.starts++; }
        stop() {
          this.state = 'inactive'; micTest.stops++;
          queueMicrotask(() => {
            this.ondataavailable({ data: new Blob(['test-recording'], { type: this.mimeType }) });
            this.onstop();
          });
        }
      };
      window.Audio = class {
        play() { micTest.played++; return Promise.resolve(); }
        pause() { micTest.paused++; }
      };
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#settingsButton').click();
    assert.equal(await page.locator('#settingsPage #recordAlarmButton, #settingsPage #exportDataButton').count(), 0);
    for (const width of [320, 390, 1024]) {
      await page.setViewportSize({ width, height: 768 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `settings-${width}.png`), fullPage: true });
    }
    await page.locator('#openAlarmSettingsButton').click();
    assert.equal(await page.locator('#settingsPage').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'closeAlarmSettingsButton');
    await page.locator('#recordAlarmButton').click();
    await page.waitForFunction(() => micTest.pending.length === 1);
    await page.keyboard.press('Escape');
    await page.evaluate(() => micTest.pending.shift()());
    await page.waitForFunction(() => micTest.released === 1);
    assert.equal(await page.evaluate(() => micTest.starts), 0, 'leaving while permission is pending never starts recording');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'openAlarmSettingsButton');
    await page.locator('#openAlarmSettingsButton').click();
    await page.locator('#recordAlarmButton').click();
    await page.evaluate(() => micTest.pending.shift()());
    await page.waitForFunction(() => micTest.starts === 1);
    await page.clock.setFixedTime(new Date('2026-09-09T18:00:01+08:00'));
    await page.locator('#closeAlarmSettingsButton').click();
    await page.waitForFunction(() => localStorage.getItem('homework-break-alarm-v1')?.startsWith('data:audio/webm'));
    assert.deepEqual(await page.evaluate(() => [micTest.stops, micTest.released]), [1, 2]);
    await page.locator('#openAlarmSettingsButton').click();
    await page.locator('#previewAlarmButton').click();
    assert.equal(await page.evaluate(() => micTest.played), 1);
    await page.screenshot({ path: path.join(output, 'alarm-details.png'), fullPage: true });
    await page.locator('#closeAlarmSettingsButton').click();
    assert.equal(await page.evaluate(() => micTest.paused), 1, 'leaving the detail page stops preview');
    await page.locator('#openAlarmSettingsButton').click();
    await page.locator('#resetAlarmButton').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('homework-break-alarm-v1')), null);
    await page.keyboard.press('Escape');
    await page.locator('#openBackupSettingsButton').click();
    assert.equal(await page.locator('#alarmSettingsPage').isVisible(), false);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportDataButton').click();
    const download = await downloadPromise;
    const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(backup.format, 'homework-ledger-backup');
    assert.equal(backup.state.records['2026-09-09'].tasks[0].title, '背诵');
    backup.state.records['2026-09-09'].tasks[0].title = '背诵第3课';
    const chooserPromise = page.waitForEvent('filechooser');
    await page.locator('#importDataButton').click();
    await (await chooserPromise).setFiles({ name: 'test-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).records['2026-09-09'].tasks[0].title === '背诵第3课');
    await page.screenshot({ path: path.join(output, 'backup-details.png'), fullPage: true });
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'openBackupSettingsButton');
    await page.locator('#closeSettingsButton').click();

    // The task, edit glyph and estimate share the card's vertical center.
    for (const width of [1024, 548, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const card = page.locator('.task-item.has-launch-action').first();
      const body = await card.locator('.task-main-row').boundingBox();
      const copy = await card.locator('.task-copy').boundingBox();
      const estimate = await card.locator('.task-estimate').boundingBox();
      const title = await card.locator('.task-title').boundingBox();
      const edit = await card.locator('.task-edit-mark').boundingBox();
      assert(Math.abs(copy.y + copy.height / 2 - estimate.y - estimate.height / 2) < 2, 'task and estimate align vertically');
      assert(Math.abs(body.y + body.height / 2 - estimate.y - estimate.height / 2) < 2);
      assert(Math.abs(title.y + title.height / 2 - edit.y - edit.height / 2) < 2, 'edit glyph stays beside and centered with wrapped task content');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('#taskList [data-task-action=start]').click();
    const color = selector => page.locator(selector).evaluate(e => getComputedStyle(e).color);
    assert.equal(await color('#focusModalElapsed'), 'rgb(196, 93, 20)');
    assert.equal(await color('#focusModalTitle'), 'rgb(145, 75, 43)');
    assert.equal(await color('#focusModalEstimate'), 'rgb(91, 101, 115)');
    for (const width of [1024, 390, 320]) {
      await page.setViewportSize({ width, height: 768 });
      await page.screenshot({ path: path.join(output, `focus-${width}.png`), fullPage: true });
    }
    await page.locator('#focusCompleteButton').click();
    assert.equal(await page.locator('#focusModal').isVisible(), false);

    // Compare ordinary/holiday composers using their shared control classes.
    await page.evaluate(() => localStorage.setItem('homework-ledger-v1', JSON.stringify({ records: { '2026-09-09': { ledgerConfirmed: true, tasks: [] } }, weekends: {} })));
    await page.reload();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('#taskEntryLauncher').click();
    await page.locator('#subjectPickerButton').click();
    async function checkList(selector) {
      const boxes = await page.locator(`${selector} button`).evaluateAll(items => items.map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, height: r.height }; }));
      assert.equal(boxes.length, 4);
      boxes.slice(1).forEach((b, i) => { assert.equal(b.x, boxes[i].x); assert(b.y >= boxes[i].y + boxes[i].height); });
    }
    await checkList('#subjectTabs');
    await page.locator('#subjectTabs [data-subject="数学"]').click();
    assert.equal(await page.locator('#subjectPickerLabel').innerText(), '数学');
    const dimensions = ids => page.evaluate(ids => ids.map(id => { const r = document.getElementById(id).getBoundingClientRect(); return [r.width, r.height]; }), ids);
    const normal = await dimensions(['subjectPickerButton', 'taskDraft', 'addTasksButton']);
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('homework-ledger-v1'));
      state.holidays = { autumn: { id: 'autumn', name: '测试假期', start: '2026-09-10', end: '2026-09-13', planDate: '2026-09-09' } };
      localStorage.setItem('homework-ledger-v1', JSON.stringify(state));
    });
    await page.reload();
    await page.locator('#holidayPlanEntry').click();
    const holiday = await dimensions(['holidaySubject', 'holidayTaskTitle']);
    assert.deepEqual(holiday, normal.slice(0, 2), 'ordinary and holiday subject and input dimensions match');
    await page.locator('#holidaySubject').click();
    await checkList('#holidaySubjectOptions');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#holidaySubjectOptions').isVisible(), false);
    assert.equal(await page.locator('#holidayTaskTitle').isVisible(), true, 'Escape closes only the list');
    await page.locator('#holidaySubject').click();
    await page.locator('#holidaySubjectOptions [data-subject="英语"]').click();
    await page.locator('#holidayTaskTitle').fill('复习第一单元');
    await page.locator('#holidayTaskTitle').press('Enter');
    assert.match(await page.locator('#holidayTaskList').innerText(), /复习第一单元/);
    assert.equal(await page.locator('#holidayTaskTitle').inputValue(), '');
    assert.equal(await page.locator('#holidaySubjectLabel').innerText(), '英语');
    assert.equal(await page.locator('#holidayTaskMinutes').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: settings child pages, recording cancellation/save/preview, backup roundtrip, centered cards, focus colors, shared entry layout and subject lists.');
    console.log('Screenshots: ' + output);
    await context.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
