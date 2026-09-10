// Isolated tablet-sized/touch browser tests; does not emulate a real Android IME.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-tablet-entry-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', hasTouch: true,
      viewport: { width: 1024, height: 768 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-09T18:00:00+08:00'));
    await page.addInitScript(() => {
      if (localStorage.getItem('tablet-entry-seeded')) return;
      localStorage.setItem('tablet-entry-seeded', 'yes');
      localStorage.setItem('homework-ledger-v1', JSON.stringify({ records: {
        '2026-09-09': { ledgerConfirmed: true, tasks: [] }
      }, weekends: {} }));
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#taskEntryLauncher').tap();
    const composer = page.locator('#taskEntryComposer');
    const draft = page.locator('#taskDraft');
    const add = page.locator('#addTasksButton');
    const keywords = page.locator('#taskKeywordSuggestions');
    await page.screenshot({ path: path.join(output, 'empty-1024x768.png'), fullPage: true });

    for (let i = 1; i <= 15; i++) {
      await keywords.getByRole('button', { name: '背诵', exact: true }).tap();
      assert.equal(await draft.inputValue(), '背诵');
      await page.keyboard.insertText(`第${i}课`);
      const before = await add.boundingBox();
      await draft.evaluate(el => { window.tabletDraftBlurs = 0; el.onblur = () => window.tabletDraftBlurs++; });
      await add.tap();
      assert.equal(await draft.inputValue(), '');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'taskDraft');
      assert.equal(await page.evaluate(() => window.tabletDraftBlurs), 0, 'touching add does not blur the input');
      assert.equal(await page.locator('#subjectPickerLabel').innerText(), '语文');
      const after = await add.boundingBox();
      assert(Math.abs(before.x - after.x) < 1 && Math.abs(before.y - after.y) < 1, 'add stays in the same place, including the first addition');
    }
    assert.equal(await page.locator('[data-pending-task-id]').count(), 15);
    assert(await page.locator('#taskEntryPendingSection').evaluate(el => el.scrollTop > 0), 'only the task list scrolls to new entries');
    for (const [width, height] of [[1024, 768], [1280, 800], [1024, 420], [768, 1024], [390, 844], [320, 740]]) {
      await page.setViewportSize({ width, height });
      await page.waitForFunction(() => Math.abs(document.getElementById('taskEntryPage').getBoundingClientRect().height - innerHeight) < 1);
      const entryBox = await composer.boundingBox();
      const inputBox = await draft.boundingBox();
      const addBox = await add.boundingBox();
      assert.equal(await page.locator('#taskEntryEstimate').count(), 0, 'composer has no estimate control');
      assert(Math.abs(entryBox.width - (width - 24)) < 1, 'composer spans the full available width');
      assert.equal(addBox.width, width > 420 ? 112 : 80, 'add has a wider touch area');
      assert(addBox.height >= 48, 'add remains easy to touch');
      assert(addBox.y + addBox.height <= height - 10, 'input controls stay above the viewport bottom');
      assert(Math.abs(addBox.x + addBox.width - entryBox.x - entryBox.width) < 1, 'add sits at the right edge');
      if (width > 420) {
        assert(addBox.x - (inputBox.x + inputBox.width) <= 9, 'add follows the input');
        assert(Math.abs(addBox.y + addBox.height - inputBox.y - inputBox.height) < 1, 'input and add align');
      }
      if (width >= 1024) {
        const listBox = await page.locator('#taskEntryPendingSection').boundingBox();
        assert(Math.abs(listBox.width - entryBox.width) < 1, 'list and composer use matching full widths');
      }
      const keywordMetrics = await keywords.evaluate(el => ({ width: el.clientWidth, scrollWidth: el.scrollWidth, height: el.clientHeight }));
      assert(keywordMetrics.height < 48, 'keywords return to a single compact row');
      assert.equal(await keywords.evaluate(el => getComputedStyle(el).flexWrap), 'nowrap');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `filled-${width}x${height}.png`), fullPage: true });
    }

    // Long custom keyword collections remain reachable without expanding the composer.
    await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('homework-ledger-v1'));
      for (let i = 1; i <= 25; i++) state.taskKeywords['语文'].push({ id: `test-extra-${i}`, label: `自定义词${i}`, visible: true });
      localStorage.setItem('homework-ledger-v1', JSON.stringify(state));
    });
    await page.reload();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('#taskEntryLauncher').tap();
    assert(await keywords.evaluate(el => el.scrollWidth > el.clientWidth));
    await keywords.getByRole('button', { name: '自定义词25', exact: true }).tap();
    assert.equal(await draft.inputValue(), '自定义词25');
    assert(await keywords.evaluate(el => el.clientHeight < 48));
    await add.tap();
    assert.equal(await page.locator('[data-pending-task-id]').count(), 16);
    assert.deepEqual(errors, []);
    console.log('PASS: full-width composer without estimate picker, touch/focus, stable position, horizontal keywords and responsive sizes.');
    console.log('Screenshots: ' + output);
    await context.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
