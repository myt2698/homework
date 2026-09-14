const assert = require('node:assert/strict');
const P = require('../plan-export.js');
const dates = ['2026-09-18', '2026-09-19'];
const state = {records: {'2026-09-18': {tasks: [
  {id: 'second', title: '阅读 <课文> & 复述', subject: '语文', estimatedMinutes: 20, status: 'done'},
  {id: 'first', title: '练习', subject: '数学', status: 'paused'}
]}}};
const before = JSON.stringify(state), days = P.snapshot(state, dates);
assert.equal(JSON.stringify(state), before, 'export does not create missing records');
assert.deepEqual(days[0].tasks.map(t => t.title), ['阅读 <课文> & 复述', '练习']);
assert.equal(days[0].tasks[1].minutes, 15);
assert.deepEqual(days[1].tasks, []);
state.records[dates[0]].tasks[0].title = 'later edit';
assert.equal(days[0].tasks[0].title, '阅读 <课文> & 复述', 'export is a detached snapshot');
assert.equal(P.filename(days), '作业计划_2026-09-18_2026-09-19.pdf');
assert.equal(P.filename(days.slice(0, 1)), '作业计划_2026-09-18.pdf');
const measure = value => Array.from(value).length * 11;
const stress = [{date: dates[0], tasks: Array.from({length: 40}, (_, i) => ({title: `第${i}项中文作业`, subject: '语文', minutes: 15, status: 'pending'}))}, days[1]];
stress[0].tasks.splice(9, 0, {title: '超长中文🙂'.repeat(450), subject: '其他', minutes: 10, status: 'active'});
const pages = P.layout(stress, measure);
assert(pages.length > 4);
for (const page of pages) for (const row of page.rows) {
  assert(row.y >= 168 && row.y + row.height <= 762, 'content stays above the footer');
  assert(row.title.every(line => measure(line) <= 292), 'content wraps inside its column');
}
const rows = pages.flatMap(p => p.rows), starts = rows.filter(r => !r.continued);
assert.equal(starts.length, stress[0].tasks.length);
assert.deepEqual(starts.map(r => r.index), stress[0].tasks.map((_, i) => i));
assert.equal(rows.filter(r => r.index === 9).flatMap(r => r.title).join(''), stress[0].tasks[9].title, 'long text continues without loss');
assert.equal(pages.at(-1).day.date, dates[1]);
assert.equal(pages.at(-1).rows.length, 0, 'empty dates remain visible');
assert.deepEqual(P.wrap('一\n\n二\r\n三', 292, measure), ['一', '', '二', '三']);
console.log('Plan export snapshot, ordering, empty dates and lossless pagination checks passed.');
