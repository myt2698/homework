const assert = require('node:assert/strict');
const path = require('node:path'), fs = require('node:fs'), os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const KEY = 'homework-ledger-v1';
const task = (id, extra = {}) => ({ id, subject:'数学', title:'口算练习', estimatedMinutes:15, status:'pending', elapsedMs:0, ...extra });
const history = { planDayType:'rest', holidayDaily:true, tasksFinishedAt:'20:35', finishTime:'20:35', note:'已结算历史保持', tasks:[task('history', {status:'done',elapsedMs:900000,completedAt:'20:35',completedDate:'2026-08-02'})] };
(async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'homework-daily-rewards-'));
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 try {
  const page=await browser.newPage({locale:'zh-CN',timezoneId:'Asia/Shanghai',viewport:{width:744,height:900}}), errors=[];
  page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-09-14T18:00:00+08:00')});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const read=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
  const seed=async(date,time,extra={},more=[])=>{
   const now=new Date(`${date}T${time}:00+08:00`);await page.clock.setFixedTime(now);
   const data={records:{'2026-08-02':history,[date]:{ledgerConfirmed:false,tasksConfirmed:true,orderSaved:true,...extra,tasks:[task('active',{status:'active',startedAt:'18:00',activeSince:now.getTime()-60000}),...more]}},weekends:{},holidays:{}};
   await page.evaluate(({key,data})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify(data));},{key:KEY,data});await page.reload();
  };
  // Weekdays, Friday, both weekend days, and old holiday/rest-day flags use one schedule.
  for(const [date,flags] of [['2026-09-14',{}],['2026-09-18',{planDayType:'school'}],['2026-09-19',{planDayType:'rest'}],['2026-09-20',{holidayDaily:true}],['2026-10-01',{planDayType:'rest',holidayDaily:true}]]){
   await seed(date,'20:30',flags);await page.locator('#focusCompleteButton').click();
   assert.equal((await read()).records[date].finishTime,'20:30');assert.equal((await read()).records[date].ledgerConfirmed,false);
   assert.match(await page.locator('#resultAmount').innerText(),/1\.50/);
   assert.deepEqual((await read()).records['2026-08-02'],history);
   await page.locator('#ledgerButton').click();await page.locator('#ledgerButton').click();
   assert.equal((await read()).records[date].finishTime,'20:30','checklist toggle never revokes or re-dates reward');
   const balance=await page.locator('#balance').textContent();await page.reload();
   assert.equal(await page.locator('#balance').textContent(),balance,'reload does not award again');
  }
  // Existing monetary thresholds remain unchanged and apply on Sunday too.
  for(const [time,amount] of [['20:40','1.00'],['21:00','0.00'],['21:31','0.50']]){
   await seed('2026-09-20',time,{planDayType:'rest'});await page.locator('#focusCompleteButton').click();
   assert((await page.locator('#resultAmount').innerText()).includes(amount));
   assert.equal(await page.locator('#dayResult').evaluate(e=>e.classList.contains('negative')),time==='21:31');
  }
  // Partial completion earns nothing; the last item settles once. Undo and supplementation reopen it.
  const date='2026-09-19';await seed(date,'20:30',{planDayType:'rest',holidayDaily:true},[task('next')]);
  await page.locator('#focusCompleteButton').click();assert.equal((await read()).records[date].finishTime,undefined);
  await page.locator('#startPlanCloseButton').click();
  await page.locator('#taskList [data-task-action=start]').first().click();await page.locator('#focusCompleteButton').click();
  assert.equal((await read()).records[date].finishTime,'20:30');
  await page.locator('#undoCompletionButton').click();assert.equal((await read()).records[date].finishTime,undefined);
  await page.locator('#focusCompleteButton').click();assert.equal((await read()).records[date].finishTime,'20:30');
  await page.locator('#supplementTaskButton').click();await page.locator('#supplementInput').fill('补发的作业');await page.locator('#supplementSaveButton').click();
  assert.equal((await read()).records[date].finishTime,undefined);assert.equal((await read()).records[date].ruleId,undefined);
  await page.locator('#taskList [data-task-action=start]').first().click();await page.locator('#focusCompleteButton').click();
  assert.equal((await read()).records[date].finishTime,'20:30');
  await page.locator('#holidayPlanEntry').click();await page.locator('#planRangeSummary').click();
  assert.equal(await page.locator('#planDayType').count(),0);assert.doesNotMatch(await page.locator('#planRangeOptions').innerText(),/上课日|休息日/);
  await page.screenshot({path:path.join(output,'plan-range.png')});assert.deepEqual(errors,[]);
  console.log('PASS: uniform daily rewards, old day flags, thresholds, partial completion, check-ins, undo, supplements, reload and history. Screenshots: '+output);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
