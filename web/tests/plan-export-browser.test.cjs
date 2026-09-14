const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const {PDFDocument} = require('pdf-lib');
const KEY = 'homework-ledger-v1', date = '2026-09-18';
(async () => {
  const out = process.env.PLAN_EXPORT_QA_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'homework-pdf-'));
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome'});
  try {
    const page = await browser.newPage({locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: {width: 1035, height: 800}}), errors = [], network = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    page.setDefaultTimeout(15000);
    await page.clock.setFixedTime(new Date('2026-09-18T18:00:00+08:00'));
    await page.addInitScript(() => { window.print = () => { window.__printCalled = true; }; });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(({key, date}) => {
      localStorage.clear();
      const tasks = Array.from({length: 32}, (_, i) => ({id: `pdf-${i}`, title: ['朗读《观潮》，圈出描写潮水的词语并复述课文。', '完成口算第 18 页，检查并订正错题。', 'Read Unit 1, copy new words & practise.'][i % 3], subject: ['语文', '数学', '英语'][i % 3], estimatedMinutes: [15, 20, 10][i % 3], status: i === 0 ? 'done' : i === 1 ? 'paused' : 'pending', elapsedMs: 0}));
      tasks[3].title = '<img src=x onerror=alert(1)> 中文 & English';
      tasks[4].title = '认真阅读课文，找出优美的语句，完成阅读笔记。'.repeat(5);
      localStorage.setItem(key, JSON.stringify({planningVersion: 2, records: {[date]: {tasks}, '2026-09-19': {tasks: [{id: 'tomorrow', title: '观察植物，记录叶子的变化。', subject: '科学', estimatedMinutes: 30, status: 'active'}]}}, weekends: {}, holidays: {[`plan-${date}`]: {id: `plan-${date}`, start: date, planDate: date, end: '2026-09-20', unified: true}}}));
    }, {key: KEY, date});
    await page.reload();
    await page.locator('#holidayPlanEntry').click();
    await page.locator('#holidayTaskTitle').fill('还没有加入清单');
    await page.locator('#planExportOpen').click();
    assert.equal(await page.locator('#planExportDialog').isVisible(), false, 'draft is not silently omitted');
    await page.locator('#holidayTaskTitle').fill('');
    await page.locator('#holidaySort').click(); await page.locator('#planExportOpen').click();
    assert.equal(await page.locator('#planExportDialog').isVisible(), false, 'unsaved order must be confirmed first');
    // Leave ordering through the day tabs, keeping the original stored order.
    await page.locator('[data-holiday-view="2026-09-19"]').click(); await page.locator('[data-holiday-view="2026-09-18"]').click();
    const before = await page.evaluate(key => localStorage.getItem(key), KEY);
    await page.locator('#planExportOpen').click();
    assert.match(await page.locator('#planExportSummary').innerText(), /2026-09-18 · 1 天 · 32 项作业/);
    for (const width of [1035, 390, 320]) {
      await page.setViewportSize({width, height: 800});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      for (const selector of ['#planExportDialog', '#planExportDownload', '#planExportPrint', '#planExportClose']) {
        const b = await page.locator(selector).boundingBox(); assert(b && b.x >= 0 && b.x + b.width <= width + 1 && b.y + b.height <= 800, `${selector} fits at ${width}`);
      }
      await page.screenshot({path: path.join(out, `export-dialog-${width}.png`)});
    }
    const saveDownload = async (file, expectedName) => {
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#planExportDownload').click()]);
      assert.equal(download.suggestedFilename(), expectedName);
      await download.saveAs(path.join(out, file));
      await page.waitForFunction(() => !document.querySelector('#planExportDownload').disabled);
      const bytes = fs.readFileSync(path.join(out, file));
      assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
      const pdf = await PDFDocument.load(bytes);
      for (const sheet of pdf.getPages()) { assert.equal(sheet.getWidth(), 595); assert.equal(sheet.getHeight(), 842); }
      return pdf.getPageCount();
    };
    const singleCount = await saveDownload('single-day.pdf', '作业计划_2026-09-18.pdf');
    assert(singleCount >= 3);
    await page.locator('#planExportScope').selectOption('range');
    assert.match(await page.locator('#planExportSummary').innerText(), /3 天 · 33 项作业/);
    const rangeCount = await saveDownload('plan-range.pdf', '作业计划_2026-09-18_2026-09-20.pdf');
    assert.equal(rangeCount, singleCount + 2);
    await page.locator('#planExportPrint').click();
    await page.waitForFunction(() => document.querySelector('iframe[title="作业计划打印"]')?.contentWindow.__printCalled === true);
    const frame = page.frames().find(f => f.url() === 'about:srcdoc');
    assert.equal(await frame.locator('img').count(), rangeCount);
    assert.equal(await frame.locator('script').count(), 0);
    const printPage = await browser.newPage();
    await printPage.setContent(await frame.content());
    await printPage.evaluate(() => Promise.all(Array.from(document.images, image => image.decode())));
    await printPage.pdf({path: path.join(out, 'browser-print.pdf'), preferCSSPageSize: true, printBackground: true});
    const printed = await PDFDocument.load(fs.readFileSync(path.join(out, 'browser-print.pdf')));
    assert.equal(printed.getPageCount(), rangeCount, 'printing has no extra blank pages');
    await printPage.close();
    await frame.evaluate(() => dispatchEvent(new Event('afterprint')));
    await page.waitForFunction(() => !document.querySelector('iframe[title="作业计划打印"]'));
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), before, 'export and printing preserve plan data');
    // Failed generation must unlock the controls for retry.
    await page.evaluate(() => { window.realPdfDownload = PlanExport.download; PlanExport.download = async () => { throw Error('test failure'); }; });
    await page.locator('#planExportDownload').click();
    await page.waitForFunction(() => document.querySelector('#planExportStatus').textContent.includes('生成失败'));
    assert.equal(await page.locator('#planExportDownload').isEnabled(), true);
    await page.evaluate(() => { PlanExport.download = window.realPdfDownload; });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#planExportDialog').isVisible(), false);
    assert.equal(await page.locator('#planExportOpen').evaluate(el => el === document.activeElement), true);
    await page.locator('[data-holiday-view="2026-09-20"]').click(); await page.locator('#planExportOpen').click();
    assert.equal(await saveDownload('empty-day.pdf', '作业计划_2026-09-20.pdf'), 1);
    assert.deepEqual(errors, []); assert.deepEqual(network, [], 'PDF export is entirely offline');
    console.log(`Plan export browser checks passed (${rangeCount} range pages). PDF and screenshot QA: ${out}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
