const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-rest-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 1024, height: 768 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const now = new Date('2026-09-09T18:00:00+08:00');
    await page.clock.install({ time: now });
    await page.clock.pauseAt(new Date(now.getTime() + 1000));
    await page.addInitScript(() => {
      if (localStorage.getItem('rest-test-seeded')) return;
      localStorage.setItem('rest-test-seeded', 'yes');
      localStorage.setItem('homework-ledger-v1', JSON.stringify({ records: { '2026-09-09': {
        ledgerConfirmed: true, tasksConfirmed: true, orderSaved: true,
        tasks: [{ id: 'rest-task', subject: '语文', title: '生抄本 作文', estimatedMinutes: 5, status: 'active', elapsedMs: 150000, activeSince: Date.now(), startedAt: '17:57' }]
      } }, weekends: {} }));
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#focusModal').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(output, 'focus-1024.png') });
    const focusColor = await page.locator('#focusModalElapsed').evaluate(el => getComputedStyle(el).color);
    async function rest() {
      await page.locator('#focusPauseButton').click();
      await page.locator('#breakChoiceModal [data-break-minutes="5"]').click();
      await page.locator('#breakTimerModal').waitFor({ state: 'visible' });
    }
    await rest();
    assert.equal(await page.locator('#breakTaskEstimate').innerText(), '距估时还剩 2 分 30 秒');
    assert.doesNotMatch(await page.locator('#breakTimerModal').innerText(), /我的休息计划|我正在休息|距离回来还有/);
    assert.notEqual(await page.locator('#breakCountdown').evaluate(el => getComputedStyle(el).color), focusColor);
    for (const [width, height] of [[1024, 768], [390, 844], [320, 740], [1024, 460]]) {
      await page.setViewportSize({ width, height });
      const estimate = await page.locator('#breakTaskEstimate').boundingBox();
      const card = await page.locator('#breakTimerTaskCard').boundingBox();
      assert(estimate.y + estimate.height <= card.y, 'time comparison stays above the homework');
      assert.equal(await page.locator('#breakTimerModal').evaluate(el => el.scrollWidth > el.clientWidth), false);
      await page.locator('#cancelBreakButton').scrollIntoViewIfNeeded();
      const cancel = await page.locator('#cancelBreakButton').boundingBox();
      assert(cancel.y >= -1 && cancel.y + cancel.height <= height + 1, `all controls are reachable in a short viewport: ${JSON.stringify({ width, height, cancel })}`);
      await page.screenshot({ path: path.join(output, `rest-${width}-${height}.png`) });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.fastForward(60000);
    assert.equal(await page.locator('#breakTaskEstimate').innerText(), '距估时还剩 2 分 30 秒');
    await page.locator('#extendBreakButton').click();
    const extendedEnd = await page.evaluate(() => JSON.parse(localStorage.getItem('homework-break-session-v1')).endAt);
    await page.reload();
    assert.equal(await page.locator('#extendBreakButton').isVisible(), false);
    assert.equal(await page.locator('#breakTaskEstimate').innerText(), '距估时还剩 2 分 30 秒');
    await page.clock.fastForward(7 * 60000);
    assert.equal(await page.locator('#breakCountdown').innerText(), '时间到');
    assert.equal(await page.locator('#breakTaskEstimate').innerText(), '距估时还剩 2 分 30 秒');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('homework-break-session-v1')).endAt), extendedEnd);
    await page.screenshot({ path: path.join(output, 'rest-time-up.png') });
    await page.locator('#startNextTaskButton').click();
    assert.equal(await page.locator('#focusModal').isVisible(), true);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).records['2026-09-09'].tasks[0].elapsedMs), 150000);
    for (const [spent, label] of [[300000, '刚到预计时间'], [435000, '已超时 2 分 15 秒'], [3900000, '已超时 60 分 00 秒']]) {
      await page.evaluate(spent => {
        const state = JSON.parse(localStorage.getItem('homework-ledger-v1'));
        Object.assign(state.records['2026-09-09'].tasks[0], { elapsedMs: spent, activeSince: Date.now(), status: 'active' });
        localStorage.setItem('homework-ledger-v1', JSON.stringify(state));
        localStorage.removeItem('homework-break-session-v1');
      }, spent);
      await page.setViewportSize({ width: 320, height: 740 });
      await page.reload();
      assert.equal(await page.locator('#focusModal').evaluate(el => el.scrollWidth > el.clientWidth), false, 'long focus clocks fit phones');
      if (spent >= 3600000) await page.screenshot({ path: path.join(output, 'focus-hour-320.png') });
      await rest();
      assert.equal(await page.locator('#breakTaskEstimate').innerText(), label);
      assert.equal(await page.locator('#breakTaskEstimate').evaluate(el => el.classList.contains('is-overtime')), spent > 300000);
      if (spent === 435000) await page.screenshot({ path: path.join(output, 'rest-overtime-320.png') });
      await page.locator('#cancelBreakButton').click();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).records['2026-09-09'].tasks[0].elapsedMs), spent);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: rest/focus styles, estimate boundaries, frozen homework time, extension, reload, return/cancel and responsive layouts.');
    console.log('Screenshots:', output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
