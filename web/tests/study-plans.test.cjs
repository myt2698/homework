const assert = require('node:assert/strict');
require('../holiday-plans.js');
const H = require('../study-plans.js');
const fresh = () => H.migrate({ records: {}, weekends: {}, holidays: {} }, '2026-09-18');
const task = (id, extra = {}) => ({ id, title: id, subject: '数学', status: 'pending', elapsedMs: 0, estimatedMinutes: 15, ...extra });
const draft = { title: '口算', subject: '数学', minutes: 10, repeat: false };
let s = fresh(), h = H.ensure(s, '2026-09-18');
assert.equal(h.end, h.start, 'Friday starts as just one day');
H.setRange(s, h, 3); H.add(s, h, draft, ['2026-09-19']);
assert.equal(H.tasks(s, '2026-09-18').length, 0);
assert.equal(H.tasks(s, '2026-09-19').length, 1);
assert.equal(s.records['2026-09-19'].planDayType, undefined, 'planning does not assign day types');
H.setRange(s, h, 1); assert.equal(H.tasks(s, '2026-09-19').length, 1, 'shrinking preserves other days');
H.setRange(s, h, 3); H.ensure(s, '2026-09-19'); assert.equal(H.tasks(s, '2026-09-19').length, 1, 'overlapping plans share one daily list');
H.confirm(s, h); const original = H.tasks(s, '2026-09-19')[0];
Object.assign(original, { status: 'active', startedAt: '18:00', activeSince: 12345, elapsedMs: 6789 });
const before = JSON.stringify(original); H.add(s, h, draft, ['2026-09-19']);
assert.equal(JSON.stringify(original), before); assert(s.records['2026-09-19'].tasksConfirmed && s.records['2026-09-19'].orderSaved);
assert.throws(() => H.move(s, { date:'2026-09-19', task:original }, '2026-09-20'), /暂停/);
const pending = H.tasks(s, '2026-09-19')[1];
H.move(s, { date:'2026-09-19', task:pending }, '2026-09-20'); assert.equal(H.tasks(s, '2026-09-20')[0], pending);
H.add(s, h, { ...draft, repeat:true }, H.days(h.start,h.end));
const repeated = H.tasks(s,'2026-09-18')[0];
H.edit(s,{date:'2026-09-18',task:repeated},'口算一页',20,true,'2026-09-18');
assert.equal(H.tasks(s,'2026-09-20')[1].title,'口算一页');
H.removeTask(s,{date:'2026-09-18',task:repeated}); assert.equal(H.tasks(s,'2026-09-20')[1].title,'口算一页');
const boundary=H.ensure(s,'2026-12-31');H.setRange(s,boundary,3);assert.equal(boundary.end,'2027-01-02');
for(const value of [0,367,2.5,NaN])assert.throws(()=>H.setRange(s,boundary,value));

const legacy={records:{'2026-09-19':{ledgerConfirmed:true,note:'保留',breaks:[{startedAt:1}]}},weekends:{'2026-09-18':{confirmed:true,orderSaved:true,planSaved:true,allDoneDate:'2026-09-20',allDoneTime:'18:30',tasks:[
  task('fri',{plannedDay:'friday'}), task('active',{plannedDay:'saturday',status:'active',startedAt:'18:00',elapsedMs:1000,activeSince:Date.parse('2026-09-19T18:00:00+08:00')}),
  task('sun',{plannedDay:'sunday'}), task('done',{plannedDay:'friday',status:'done',completedDate:'2026-09-20',elapsedMs:600000,completedAt:'18:30'})
]}},holidays:{}};
const archive=JSON.stringify(legacy.weekends['2026-09-18']);
H.migrate(legacy,'2026-09-19',[{date:'2026-09-19',taskId:'active'}]);
assert.deepEqual(H.tasks(legacy,'2026-09-18').map(t=>t.id),['fri']);
assert.deepEqual(H.tasks(legacy,'2026-09-19').map(t=>t.id),['active']);
assert.deepEqual(H.tasks(legacy,'2026-09-20').map(t=>t.id),['sun','done']);
assert.deepEqual(legacy.records['2026-09-19'].breaks,[{startedAt:1}]);
const normalized=JSON.stringify(legacy);H.migrate(legacy,'2026-09-19');assert.equal(JSON.stringify(legacy),normalized,'migration is idempotent');
const stored=legacy.weekends['2026-09-18'];const {datedTasksMigrated,...unchanged}=stored;assert.equal(JSON.stringify(unchanged),archive);
H.tasks(legacy,'2026-09-19')[0].status='done';assert.equal(stored.tasks[1].status,'active','archived task objects remain independent');
console.log('Unified planning model, migration, repeat, range, and active-task preservation passed.');
