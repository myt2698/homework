// Real local files and real stroke data, with all external network access disabled.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-hanzi-'));
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
    const page = await context.newPage(), errors = [], network = [];
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    await page.clock.setFixedTime(new Date('2026-09-10T18:00:00+08:00'));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('homework-ledger-v1', JSON.stringify({ records: { '2026-09-10': {
        ledgerConfirmed: true, tasksConfirmed: true, orderSaved: true,
        tasks: [{ id: 'lookup-task', title: '生字练习', subject: '语文', estimatedMinutes: 15, status: 'pending' }]
      } }, weekends: {} }));
    });
    await page.reload();
    const snapshot = () => page.evaluate(() => localStorage.getItem('homework-ledger-v1'));
    const before = await snapshot();
    await context.setOffline(true);
    await page.screenshot({ path: path.join(output, 'home-390.png'), fullPage: true });
    await page.locator('#homeLookupButton').click();
    const lookup = page.frameLocator('#hanziLookupFrame');
    await lookup.locator('#lookupInput').waitFor();
    const frame = page.frames().find(f => f.url().includes('/hanzi/index.html'));
    assert.equal(await page.locator('#mainPage').evaluate(node => node.inert), true);
    assert.equal(await lookup.locator('#lookupTimerNote').isVisible(), false);
    const search = async value => {
      await lookup.locator('#lookupInput').fill(value);
      await lookup.locator('#lookupForm button').click();
    };
    await search('永');
    await frame.waitForFunction(() => document.getElementById('lookupStrokeCount').textContent === '共 5 笔');
    await lookup.locator('#lookupPause').click();
    assert.equal(await lookup.locator('#lookupPause').innerText(), '继续');
    await lookup.locator('#lookupPause').click();
    await lookup.locator('#lookupPractice').click();
    assert.equal(await lookup.locator('#lookupPracticeProgress').isVisible(), true);
    await search('学习');
    await frame.waitForFunction(() => document.getElementById('lookupStrokeCount').textContent === '共 8 笔');
    await lookup.getByRole('button', { name: '查看习的笔顺', exact: true }).click();
    await frame.waitForFunction(() => document.getElementById('lookupStrokeCount').textContent === '共 3 笔');
    await frame.evaluate(() => {
      const input = document.getElementById('lookupInput'), form = document.getElementById('lookupForm');
      input.value = '龟'; form.requestSubmit();
      input.value = '中'; form.requestSubmit();
    });
    await frame.waitForFunction(() => document.getElementById('lookupStrokeCount').textContent === '共 4 笔');
    assert.equal(await lookup.locator('#lookupCharacter').innerText(), '中', 'only the latest search may update the result');
    await search('𠮷');
    await frame.waitForFunction(() => document.getElementById('lookupStatus').dataset.error === 'true');
    assert.equal(await lookup.locator('#lookupAnimate').isDisabled(), true);
    await search('abc');
    assert.equal(await lookup.locator('#lookupInput').getAttribute('aria-invalid'), 'true');
    await search('二');
    await frame.waitForFunction(() => document.getElementById('lookupStrokeCount').textContent === '共 2 笔');
    await lookup.locator('#lookupPractice').click();
    await frame.waitForFunction(() => document.getElementById('lookupCanvas').getAttribute('role') === 'application');
    const strokes = await frame.evaluate(() => {
      const canvas = document.getElementById('lookupCanvas'), rect = canvas.getBoundingClientRect();
      const transform = HanziWriter.getScalingTransform(rect.width, rect.width, 22);
      return HanziStrokeData['二'].medians.map(stroke => stroke.map(([x, y]) => ({
        x: rect.x + transform.x + x * transform.scale,
        y: rect.y + rect.height - transform.y - y * transform.scale
      })));
    });
    const board = await lookup.locator('#lookupCanvas').boundingBox();
    await page.mouse.move(board.x + 6, board.y + 6);
    await page.mouse.down(); await page.mouse.move(board.x + 12, board.y + 12); await page.mouse.up();
    await frame.waitForFunction(() => document.getElementById('lookupStatus').textContent.includes('再试一次'));
    assert.equal(await lookup.locator('#lookupPracticeProgress').getAttribute('value'), '0');
    await lookup.locator('#lookupHint').click();
    for (let index = 0; index < strokes.length; index++) {
      const stroke = strokes[index];
      await page.mouse.move(stroke[0].x, stroke[0].y); await page.mouse.down();
      for (const point of stroke.slice(1)) await page.mouse.move(point.x, point.y, { steps: 3 });
      await page.mouse.up();
      try {
        await frame.waitForFunction(value => Number(document.getElementById('lookupPracticeProgress').value) === value, index + 1);
      } catch (error) {
        await page.screenshot({ path: path.join(output, 'practice-error.png'), fullPage: true });
        console.log('Practice failure:', output, await lookup.locator('#lookupStatus').innerText(), stroke, await lookup.locator('#lookupCanvas').boundingBox(), errors);
        throw error;
      }
    }
    await frame.waitForFunction(() => document.getElementById('lookupStatus').textContent.includes('写好啦'));
    for (const [width, height] of [[320, 740], [390, 844], [1024, 768]]) {
      await page.setViewportSize({ width, height });
      assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const canvas = await lookup.locator('#lookupCanvas').boundingBox();
      assert(Math.abs(canvas.width - canvas.height) < 2 && canvas.width > 200);
      await page.screenshot({ path: path.join(output, `practice-${width}.png`), fullPage: true });
    }
    // A real touch stroke is accepted by the same practice component.
    await search('一');
    await frame.waitForFunction(() => document.getElementById('lookupStrokeCount').textContent === '共 1 笔');
    await lookup.locator('#lookupPractice').click();
    const touchStroke = await frame.evaluate(() => {
      const rect = document.getElementById('lookupCanvas').getBoundingClientRect();
      const t = HanziWriter.getScalingTransform(rect.width, rect.width, 22);
      return HanziStrokeData['一'].medians[0].map(([x, y]) => ({ x: rect.x + t.x + x * t.scale, y: rect.y + rect.height - t.y - y * t.scale }));
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchStroke[0]] });
    for (const point of touchStroke.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await frame.waitForFunction(() => document.getElementById('lookupStatus').textContent.includes('写好啦'));
    assert.equal(await snapshot(), before, 'lookup and practice never change homework data');
    await lookup.locator('#lookupBack').click();
    await page.locator('#hanziLookupModal').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#hanziLookupModal').isVisible(), false);
    assert.equal(await page.locator('#mainPage').evaluate(node => node.inert), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'homeLookupButton');
    await page.locator('[data-task-action="start"][data-task-id="lookup-task"]').click();
    const active = await snapshot();
    await page.locator('#focusLookupButton').click();
    await lookup.locator('#lookupInput').waitFor();
    assert.equal(await lookup.locator('#lookupTimerNote').isVisible(), true);
    await page.clock.setFixedTime(new Date('2026-09-10T18:02:00+08:00'));
    await page.waitForFunction(() => document.getElementById('focusModalElapsed').textContent.includes('02'));
    await lookup.locator('#lookupBack').click();
    await page.locator('#hanziLookupModal').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#focusModal').isVisible(), true);
    assert.equal(await page.locator('#mainPage').evaluate(node => node.inert), true);
    assert.equal(await page.locator('#focusModal').evaluate(node => node.inert), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'focusLookupButton');
    assert.equal(await snapshot(), active, 'focus lookup preserves the task, clock start and order');
    assert.deepEqual(network, [], 'all lookup resources load locally');
    assert.deepEqual(errors, []);

    // Exercise the shared page under the Android asset URL, with a failed local shard and retry.
    // This validates browser behavior at that URL, not an Android runtime/build.
    const nativeContext = await browser.newContext({ offline: true });
    let failShard = true;
    await nativeContext.route('https://appassets.androidplatform.net/hanzi/**', async route => {
      const relative = new URL(route.request().url()).pathname.slice('/hanzi/'.length);
      if (relative === 'close') return route.fulfill({ body: 'closed' });
      if (failShard && relative === `data/${('树'.codePointAt(0) >>> 8).toString(16)}.js`) return route.abort();
      const file = path.resolve(__dirname, '../hanzi', relative);
      const contentType = relative.endsWith('.js') ? 'application/javascript' : relative.endsWith('.css') ? 'text/css' : 'text/html';
      await route.fulfill({ body: fs.readFileSync(file), contentType });
    });
    const nativePage = await nativeContext.newPage();
    nativePage.on('pageerror', error => errors.push(error.message));
    await nativePage.goto('https://appassets.androidplatform.net/hanzi/index.html?host=android&focus=1');
    await nativePage.locator('#lookupInput').fill('树');
    await nativePage.locator('#lookupForm button').click();
    await nativePage.waitForFunction(() => document.getElementById('lookupStatus').dataset.error === 'true');
    assert.equal(await nativePage.locator('#lookupAnimate').isDisabled(), true);
    failShard = false;
    await nativePage.locator('#lookupForm button').click();
    await nativePage.waitForFunction(() => document.getElementById('lookupStrokeCount').textContent === '共 9 笔');
    await nativePage.locator('#lookupBack').click();
    await nativePage.waitForURL('https://appassets.androidplatform.net/hanzi/close');
    assert.deepEqual(errors, []);
    await nativeContext.close();
    console.log('PASS: offline search, stroke counts/animation, mouse and touch practice, feedback, responsive layouts, home/focus return, uninterrupted timer.');
    console.log('Screenshots:', output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
