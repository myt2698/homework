const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const KEY='homework-ledger-v1', date='2026-09-18';
(async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'homework-unified-'));
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try{
  const page=await browser.newPage({locale:'zh-CN',timezoneId:'Asia/Shanghai',viewport:{width:1035,height:740}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(8000);
  await page.clock.install({time:new Date('2026-09-18T18:00:00+08:00')});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>localStorage.clear());await page.reload();
  const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  const expand=async n=>{await page.locator('#planRangeSummary').click();await page.locator('#planDayCount').fill(String(n));await page.locator('#planApplyRange').click();};
  const add=async(title,minutes='15')=>{await page.locator('#holidayTaskTitle').fill(title);await page.locator('#holidayTaskMinutes').selectOption(minutes);await page.locator('#holidayTaskForm button[type=submit]').click();};
  await page.locator('#holidayPlanEntry').click();
  assert.equal(await page.locator('[data-holiday-view]').count(),1);assert.equal(await page.locator('#holidayShortDays .holiday-day-heading').textContent(),'周五/0项');assert.equal(await page.locator('#holidayShortDays time').innerText(),'9月18日');
  await add('口算练习','20');await expand(3);
  assert.equal(await page.locator('[data-holiday-view]').count(),3);assert.equal(await page.locator('[data-holiday-view="2026-09-19"] .holiday-day-heading').textContent(),'周六/0项');
  await page.locator('[data-holiday-view="2026-09-19"]').click();await add('补课日的新作业','10');
  assert.equal((await read()).records[date].tasks.length,1);assert.equal((await read()).records['2026-09-19'].tasks[0].estimatedMinutes,10);
  await page.locator('#planRangeSummary').click();assert.equal(await page.locator('#planDayType').count(),0);await page.locator('#planRangeSummary').click();
  await page.locator('[data-holiday-view="2026-09-20"]').click();
  await page.locator('#holidayRepeat').selectOption('daily');await add('每天阅读','15');
  let s=await read();assert.equal(s.records[date].tasks.length,2);assert.equal(s.records['2026-09-19'].tasks.length,2);assert.equal(s.records['2026-09-20'].tasks.length,1);
  await page.locator('#holidayRepeat').selectOption('once');
  await page.locator('[data-holiday-view="2026-09-19"]').click();
  await page.locator('#holidayTaskList [data-holiday-move-date]').first().selectOption('2026-09-20');
  assert.equal((await read()).records['2026-09-19'].tasks.length,1);assert.match(await page.locator('[data-holiday-view="2026-09-20"]').innerText(),/2项/);
  await page.locator('[data-holiday-view="2026-09-18"]').click();await page.locator('#holidaySort').click();
  const picks=page.locator('[data-holiday-action=pick]');await picks.nth(1).click();await picks.nth(0).click();await page.locator('#holidaySort').click();
  assert.equal((await read()).records[date].tasks[0].title,'每天阅读');
  await expand(1);
  assert.equal(await page.locator('[data-holiday-view]').count(),1);assert.equal((await read()).records['2026-09-20'].tasks.length,2);
  await expand(3);
  const beforeFailure=await read();
  await page.evaluate(key=>{window.realPlanSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('full','QuotaExceededError');return realPlanSetItem.call(this,k,v);};},KEY);
  await add('保存失败保留草稿','30');assert.deepEqual(await read(),beforeFailure);assert.equal(await page.locator('#holidayTaskTitle').inputValue(),'保存失败保留草稿');
  await page.evaluate(()=>{Storage.prototype.setItem=realPlanSetItem;});await page.locator('#holidayTaskForm button[type=submit]').click();
  assert.equal((await read()).records[date].tasks.length,3);
  page.once('dialog',d=>d.accept());await page.locator('#holidayTaskList [data-holiday-action=delete]').last().click();
  for(const width of [1035,744,390,320]){
   await page.setViewportSize({width,height:800});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   for(const selector of ['#holidayTaskTitle','#holidayTaskMinutes','#holidayTaskForm button[type=submit]']){
    const b=await page.locator(selector).boundingBox();assert(b&&b.x>=0&&b.x+b.width<=width+1&&b.y+b.height<=801,`${selector} fits ${width}`);
   }
   await page.screenshot({path:path.join(out,`plan-${width}.png`)});
  }
  await page.locator('#holidayConfirm').click();
  s=await read();assert(s.records[date].tasksConfirmed&&s.records['2026-09-20'].orderSaved);
  await page.reload();assert.equal((await read()).records['2026-09-20'].tasks.length,2);
  if(await page.locator('#startPlanCloseButton').isVisible())await page.locator('#startPlanCloseButton').click();
  await page.locator('#holidayPlanEntry').click();await add('1. 抄写词语 2. 阅读课文','10');
  s=await read();assert.deepEqual(s.records[date].tasks.slice(-2).map(t=>[t.title,t.estimatedMinutes]),[['抄写词语',10],['阅读课文',10]]);
  assert.deepEqual(errors,[]);console.log('Unified planner browser checks passed. Screenshots: '+out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
