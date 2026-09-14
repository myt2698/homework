// Focused data regression checks; no browser or Android build is required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
function productionFunction(name) {
  const start = source.indexOf(`  function ${name}(`);
  assert(start >= 0, `Production function ${name} exists`);
  const end = source.indexOf('\n  }', start) + 4;
  return source.slice(start, end);
}
let record, saved;
const context = vm.createContext({
  SPORTS: ['跳绳', '踢毽子', '坐位体前屈', '50米', '仰卧起坐'],
  TIME_FIELDS: [],
  currentRecord: () => record,
  currentTime: () => '18:20',
  saveAndRender: () => { saved = JSON.stringify(record); }
});
vm.runInContext(['isSportDone', 'toggleSport', 'pendingDailyRequirements', 'isMeaningful'].map(productionFunction).join('\n'), context);
const otherHabits = { readingDone: true, mathThinkingDone: true, englishReadingDone: true };
for (const legacy of [{}, {ropeDone: true, ropeAt: '17:00'}, {sportActivities: ['50米跑'], sportAt: '17:00'}, {sportActivities: ['跳绳', '踢毽子']}]) {
  record = {...otherHabits, ...legacy};
  const before = JSON.stringify(record);
  const previouslyDone = Object.keys(legacy).length > 0;
  assert.equal(context.isSportDone(record), previouslyDone);
  assert.equal(JSON.stringify(record), before, 'rendering never rewrites legacy records');
  context.toggleSport();
  record = JSON.parse(saved);
  assert.equal(context.isSportDone(record), !previouslyDone, 'toggle survives serialization');
  assert.equal(context.pendingDailyRequirements(record).length, previouslyDone ? 1 : 0);
  assert.equal(record.sportAt, previouslyDone ? undefined : '18:20');
  if (legacy.sportActivities) assert.deepEqual(record.sportActivities, legacy.sportActivities, 'legacy activity detail is preserved');
  if (legacy.ropeAt) assert.equal(record.ropeAt, legacy.ropeAt);
  context.toggleSport();
  record = JSON.parse(saved);
  assert.equal(context.isSportDone(record), previouslyDone, 'second click reverses the change');
}
record = {};
context.toggleSport();
assert(context.isMeaningful(record), 'sport-only check-in is retained by record cleanup');
assert.equal(context.pendingDailyRequirements(record).length, 3, 'one sport counts as one of four habits');
assert.equal(context.isSportDone({}), false, 'other dates remain unchecked');
assert.equal(context.isSportDone({sportDone: false, ropeDone: true}), false, 'explicit undo wins over old rope data');
assert.equal(context.isSportDone({sportDone: false, sportActivities: ['跳绳']}), false, 'explicit undo wins over old activity data');
assert.equal(context.isSportDone({sportActivities: ['unknown']}), false, 'invalid legacy activity is not a check-in');
console.log('PASS: sport check-in, undo, persistence, legacy records, independent dates, and habit counts.');
