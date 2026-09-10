const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');const {chromium}=require('playwright');
(async()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'homework-holiday-'));
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||undefined});
 try{
  const context=await browser.newContext({locale:'zh-CN',timezoneId:'Asia/Shanghai',viewport:{width:1024,height:768}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.clock.setFixedTime(new Date('2026-09-09T18:00:00+08:00'));
  await page.addInitScript(()=>{if(localStorage.getItem('holiday-test-seeded'))return;localStorage.setItem('holiday-test-seeded','yes');localStorage.setItem('homework-ledger-v1',JSON.stringify({records:{'2026-09-09':{ledgerConfirmed:true,ledgerAt:'17:00'}},weekends:{}}));});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.locator('#settingsButton').click();await page.locator('#openHolidaySettingsButton').click();
  await page.locator('#holidayName').fill('秋日假期');await page.locator('#holidayStart').fill('2026-09-10');await page.locator('#holidayEnd').fill('2026-09-13');
  assert.equal(await page.locator('#holidayPlanDate').inputValue(),'2026-09-09');
  await page.locator('#holidayConfigForm button[type=submit]').click();
  assert.equal(await page.locator('[data-holiday-open]').count(),1);
  await page.locator('#holidaySettingsBack').click();await page.locator('#closeSettingsButton').click();
  assert.equal(await page.locator('#holidayPlanEntry').isVisible(),true);
  await page.locator('#holidayPlanEntry').click();
  await page.locator('[data-holiday-keyword="背诵"]').click();assert.equal(await page.locator('#holidayTaskTitle').inputValue(),'背诵');
  const composerBefore=await page.locator('.holiday-input-row').boundingBox();
  await page.locator('#holidayTaskTitle').fill('书本第1页');await page.locator('#holidayTaskForm button[type=submit]').click();
  const composerAfter=await page.locator('.holiday-input-row').boundingBox();assert.equal(composerBefore.y,composerAfter.y,'adding a task keeps the composer fixed');
  assert.equal(await page.locator('#holidayTaskTitle').evaluate(e=>e===document.activeElement),true);
  await page.locator('#holidayRepeat').selectOption('daily');await page.locator('#holidayTaskTitle').fill('练字');await page.locator('#holidayTaskForm button[type=submit]').click();
  await page.locator('#holidaySubject').click();await page.locator('#holidaySubjectOptions [data-subject="数学"]').click();await page.locator('#holidayTaskTitle').fill('口算');
  await page.locator('#holidayRepeatDates summary').click();await page.locator('[data-holiday-repeat-date="2026-09-11"]').uncheck();await page.locator('#holidayRepeatDates summary').click();await page.locator('#holidayTaskForm button[type=submit]').click();
  await page.locator('#holidayViewDate').fill('2026-09-10');
  assert.match(await page.locator('#holidayDaySummary').innerText(),/2 项.*30 分钟/);
  assert.equal(await page.locator('#holidayTaskMinutes').count(),0);
  await page.locator('#holidaySort').click();
  await page.locator('[data-holiday-estimate]').nth(0).selectOption('10');
  await page.locator('[data-holiday-action=pick]').nth(1).click();
  await page.locator('[data-holiday-estimate]').nth(1).selectOption('20');
  assert.equal(await page.locator('[data-holiday-action=pick]').nth(1).innerText(),'第 1 项','changing estimate preserves the selected order');
  assert.match(await page.locator('#holidayDaySummary').innerText(),/2 项.*30 分钟/);
  for(const width of [320,390,1024]) {
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(output,`holiday-sort-${width}.png`),fullPage:true});
  }
  await page.locator('[data-holiday-action=pick]').nth(0).click();await page.locator('#holidaySort').click();
  const estimates=await page.evaluate(()=>JSON.parse(localStorage.getItem('homework-ledger-v1')).records);
  assert.deepEqual(estimates['2026-09-10'].tasks.map(t=>t.estimatedMinutes),[20,10]);
  assert(estimates['2026-09-12'].tasks.every(t=>t.estimatedMinutes===15),'changing a daily estimate does not edit other repeated instances');
  assert.match(await page.locator('#holidayTaskList .holiday-task-copy strong').first().innerText(),/口算/);
  for(const [width,height] of [[1024,768],[390,844],[320,740]]){
   await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.locator('#holidayRepeatDates summary').click();const popup=await page.locator('#holidayRepeatDateList').boundingBox();assert(popup.x>=0&&popup.x+popup.width<=width,'repeat date picker fits narrow screens');await page.locator('#holidayRepeatDates summary').click();
   await page.screenshot({path:path.join(output,`plan-${width}.png`),fullPage:true});
  }
  await page.setViewportSize({width:1024,height:460});const keyboardComposer=await page.locator('.holiday-input-row').boundingBox();assert(keyboardComposer.y+keyboardComposer.height<=460,'composer remains in the resized viewport');
  await page.setViewportSize({width:1024,height:768});await page.locator('#holidayConfirm').click();
  assert.equal(await page.locator('#startPlanModal').isVisible(),true);await page.locator('#startPlanCloseButton').click();
  assert.equal(await page.locator('#mainPage').isVisible(),true);
  assert.match(await page.locator('#taskList').innerText(),/书本第1页/);assert.doesNotMatch(await page.locator('#taskList').innerText(),/练字|口算/);
  async function date(value){await page.locator('#settingsButton').click();await page.locator('#recordDate').fill(value);await page.locator('#recordDate').dispatchEvent('change');await page.locator('#closeSettingsButton').click();}
  await date('2026-09-10');assert.equal(await page.locator('#ledgerButton').isVisible(),false);assert.match(await page.locator('#taskList').innerText(),/练字|口算/);
  await page.locator('#taskList [data-task-action=start]').click();await page.locator('#focusCompleteButton').click();
  await page.locator('#startPlanCloseButton').click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('homework-ledger-v1')));
  assert.equal(saved.records['2026-09-10'].tasks[0].status,'done');assert.equal(saved.records['2026-09-12'].tasks.find(t=>t.title==='口算').status,'pending');
  await page.locator('#holidayPlanEntry').click();await page.locator('#holidayViewDate').fill('2026-09-12');
  const row=page.locator('#holidayTaskList .holiday-task-row').filter({hasText:'练字'});await row.locator('[data-holiday-action=edit]').click();await page.locator('#holidayEditContent').fill('练字一页');await page.locator('#holidayTaskEditForm button[type=submit]').click();
  await page.locator('#holidayConfirm').click();await date('2026-09-14');
  assert.equal(await page.locator('#holidayOverdue').isVisible(),true);await page.locator('#holidayOverdueSummary').click();
  const overdue=page.locator('#holidayOverdueList .holiday-task-row').filter({hasText:'练字一页'}).first();await overdue.locator('[data-holiday-action=move]').click();
  assert.match(await page.locator('#taskList').innerText(),/练字一页/);
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('homework-ledger-v1')));assert.equal(saved.records['2026-09-14'].tasks.length,1);assert.equal(Object.values(saved.holidays).length,1);
  await page.reload();assert.equal(await page.locator('#holidayPlanEntry').isVisible(),true);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('homework-ledger-v1')).holidays),saved.holidays);
  await page.evaluate(()=>localStorage.setItem('homework-ledger-v1',JSON.stringify({records:{'2026-12-29':{ledgerConfirmed:true}},weekends:{},holidays:{winter:{id:'winter',name:'寒假',start:'2026-12-30',end:'2027-02-01',planDate:'2026-12-29'}}})));
  await page.clock.setFixedTime(new Date('2026-12-29T18:00:00+08:00'));await page.reload();await page.locator('#holidayPlanEntry').click();assert.equal(await page.locator('#holidayShortDays').isVisible(),false);
  await page.locator('#holidayRepeat').selectOption('daily');await page.locator('#holidayTaskTitle').fill('每天练字');await page.locator('#holidayTaskForm button[type=submit]').click();await page.locator('#holidayViewDate').fill('2027-02-01');assert.match(await page.locator('#holidayTaskList').innerText(),/每天练字/);
  const count=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('homework-ledger-v1')).records).reduce((n,r)=>n+(r.tasks||[]).length,0));assert.equal(count,34);
  assert.deepEqual(errors,[]);console.log('PASS: holiday settings, pre-day planning, repeat exceptions, ordering, per-day execution, future edits, expired carryover, reload and responsive layouts.');console.log('Screenshots: '+output);await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
