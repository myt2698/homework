// Run with Playwright on NODE_PATH; PLAYWRIGHT_CHANNEL can select an installed browser.
// Uses an isolated profile; never reads or modifies the user's saved data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'homework-keyword-settings-'));
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  try {
    const context = await browser.newContext({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    await page.clock.setFixedTime(new Date('2026-09-09T18:00:00+08:00'));
    await page.addInitScript(() => {
      if (localStorage.getItem('keyword-settings-test-seeded')) return;
      localStorage.setItem('keyword-settings-test-seeded', 'yes');
      localStorage.setItem('homework-ledger-v1', JSON.stringify({ records: {
        '2026-09-09': { ledgerConfirmed: true, tasks: [] }
      }, weekends: {} }));
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('#settingsButton').click();
    assert.equal(await page.locator('#settingsPage #keywordSettingsList').count(), 0);
    assert.equal(await page.locator('#openKeywordSettingsButton').isVisible(), true);
    await page.screenshot({ path: path.join(output, 'settings-390.png'), fullPage: true });
    await page.locator('#openKeywordSettingsButton').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#settingsPage').isVisible(), false);
    assert.equal(await page.locator('#mainPage').isVisible(), false);
    assert.equal(await page.locator('#keywordSettingsPage').isVisible(), true);
    assert.equal(await page.locator('#keywordSettingsPage').getAttribute('aria-modal'), null);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'closeKeywordSettingsButton');

    for (const width of [320, 390, 768, 1100]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'keyword page fits narrow and wide screens');
      await page.screenshot({ path: path.join(output, `keywords-${width}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const row = label => page.locator('.keyword-settings-row').filter({ has: page.locator('.keyword-settings-name', { hasText: new RegExp(`^${label}$`) }) });
    const labels = () => page.locator('.keyword-settings-name').allTextContents();
    const before = await labels();
    assert(before.includes('背诵') && before.includes('默写'));
    await row('背诵').locator('[data-keyword-action="toggle"]').click();
    assert.equal(await row('背诵').locator('[data-keyword-action="toggle"]').innerText(), '已隐藏');
    await row('默写').locator('[data-keyword-action="up"]').click();
    assert.equal((await labels())[0], '默写', 'reordering still works');
    await row('默写').locator('[data-keyword-action="down"]').click();
    assert.deepEqual(await labels(), before, 'both reorder directions work');
    await row('默写').locator('[data-keyword-action="delete"]').click();
    assert.equal(await row('默写').count(), 0, 'built-in words can still be deleted');
    await page.locator('#keywordSettingsInput').fill('练字');
    await page.locator('#addKeywordButton').click();
    assert.equal(await row('练字').count(), 1);
    await page.locator('#keywordSettingsInput').fill('未添加');
    await page.locator('#closeKeywordSettingsButton').click();
    assert.equal(await page.locator('#settingsPage').isVisible(), true);
    assert.equal(await page.locator('#mainPage').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'openKeywordSettingsButton');
    await page.locator('#openKeywordSettingsButton').click();
    assert.equal(await page.locator('#keywordSettingsInput').inputValue(), '未添加', 'back preserves the draft');
    await page.locator('#keywordSettingsInput').fill('');
    for (const subject of ['数学', '英语', '科学']) {
      await page.locator(`[data-keyword-settings-subject="${subject}"]`).click();
      assert.equal(await page.locator(`[data-keyword-settings-subject="${subject}"]`).getAttribute('aria-selected'), 'true');
    }
    await page.locator('#keywordSettingsInput').fill('实验');
    await page.locator('#keywordSettingsInput').press('Enter');
    assert.equal(await row('实验').count(), 1, 'keyboard adds a word under the selected subject');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#settingsPage').isVisible(), true, 'Escape returns one level');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#mainPage').isVisible(), true, 'second Escape returns home');

    await page.locator('#taskEntryLauncher').click();
    const suggestions = await page.locator('#taskKeywordSuggestions button').allTextContents();
    assert(!suggestions.includes('背诵') && !suggestions.includes('默写') && suggestions.includes('练字'), 'entry suggestions reflect settings immediately');
    await page.locator('#taskEntryCloseButton').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).taskKeywords);
    assert.equal(saved['语文'].find(item => item.label === '背诵').visible, false);
    assert(!saved['语文'].some(item => item.label === '默写'));
    assert(saved['科学'].some(item => item.label === '实验'));
    await page.reload();
    await page.locator('#settingsButton').click();
    await page.locator('#openKeywordSettingsButton').click();
    assert.equal(await row('背诵').locator('[data-keyword-action="toggle"]').innerText(), '已隐藏');
    assert.equal(await row('默写').count(), 0);
    assert.equal(await row('练字').count(), 1);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('homework-ledger-v1')).taskKeywords), saved, 'saved order, visibility, additions and deletions survive reload');
    assert.deepEqual(errors, []);
    console.log('PASS: keyword settings page, one-level back, responsive layout, editing, subject selection, suggestions and persistence.');
    console.log('Screenshots: ' + output);
    await context.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
