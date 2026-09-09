// Run with Playwright available on NODE_PATH. Uses a new, isolated browser profile.
// Screenshots go to a temporary folder; no existing browser records are touched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-habit-check-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-09T18:00:00+08:00'));
    await page.addInitScript(() => {
      if (localStorage.getItem('habit-test-seeded')) return;
      localStorage.setItem('habit-test-seeded', 'yes');
      localStorage.setItem('homework-ledger-v1', JSON.stringify({
        records: { '2026-09-09': {
          ledgerConfirmed: true, ledgerAt: '17:30', tasksConfirmed: true, orderSaved: true,
          tasks: [
            { id: 'done', subject: '数学', title: '口算20题', estimatedMinutes: 10, status: 'done', completedDate: '2026-09-09', completedAt: '17:50', elapsedMs: 600000 },
            { id: 'next', subject: '语文', title: '预习第3课', estimatedMinutes: 15, status: 'pending' }
          ]
        } }, weekends: {}
      }));
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('.task-launch-button').waitFor();
    assert.equal(await page.locator('#dailyCheckinsTitle').innerText(), '习惯打卡');
    assert.equal(await page.locator('.daily-required-card:visible').count(), 4);
    assert.equal(await page.locator('#sportOptions').isVisible(), false);
    const cards = page.locator('.daily-required-card');
    for (const width of [320, 390, 768, 1100]) {
      await page.setViewportSize({ width, height: 900 });
      const bounds = await cards.evaluateAll(items => items.map(item => {
        const rect = item.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height,
          overflow: item.scrollWidth > item.clientWidth + 1 };
      }));
      assert.equal(bounds[0].top, bounds[1].top, 'sports and Chinese reading share the first row');
      assert.equal(bounds[2].top, bounds[3].top, 'other habits share the second row');
      assert(bounds.every(box => box.height >= 44 && !box.overflow), `usable card size at ${width}px`);
      const taskTop = await page.locator('#taskPanel').evaluate(item => item.getBoundingClientRect().top);
      assert(bounds.every(box => box.bottom <= taskTop), 'all habits appear before homework');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `no page overflow at ${width}px`);
      if (width === 390 || width === 1100) await page.screenshot({ path: path.join(output, `habits-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#sportCard').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#sportCard').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('#sportOptions button:visible').count(), 5);
    await page.locator('[data-sport="跳绳"]').click();
    assert.equal(await page.locator('#sportStatus').innerText(), '已完成');
    assert.equal(await page.locator('[data-sport="跳绳"]').getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: path.join(output, 'sports-expanded.png'), fullPage: true });
    await page.locator('#sportCard').click();
    await page.locator('#mathThinkingButton').click();
    await page.locator('#englishReadingButton').click();
    await page.locator('.task-launch-button').click();
    await page.locator('#focusCompleteButton').click();
    assert((await page.locator('.day-tasks-pending').innerText()).includes('作业已完成，习惯打卡还剩 1 项'));
    assert.equal(await page.locator('.quest-victory').count(), 0);
    await page.screenshot({ path: path.join(output, 'homework-done-reading-pending.png'), fullPage: true });
    const finishTime = await page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).records['2026-09-09'].finishTime);
    await page.locator('#readingButton').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#readingStatus').innerText(), '已完成');
    assert.equal(await page.locator('#dailyCheckinsSummary').innerText(), '已完成 4 / 4');
    assert((await page.locator('.quest-victory').innerText()).includes('今天的任务都完成啦！'));
    assert.equal(await page.locator('.daily-required-card:visible').count(), 4, 'completion never hides habit entries');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).records['2026-09-09'].finishTime), finishTime);
    await page.screenshot({ path: path.join(output, 'all-done.png'), fullPage: true });
    await page.reload();
    await page.locator('.quest-victory').waitFor();
    assert.equal(await page.locator('#dailyCheckinsSummary').innerText(), '已完成 4 / 4');
    await page.locator('#readingButton').click();
    assert.equal(await page.locator('.quest-victory').count(), 0);
    assert((await page.locator('.day-tasks-pending').innerText()).includes('习惯打卡还剩 1 项'));
    assert.deepEqual(errors, []);
    console.log('PASS: isolated browser layout, keyboard actions, check-ins, completion/undo and reload.');
    console.log('Screenshots: ' + output);
    await context.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
