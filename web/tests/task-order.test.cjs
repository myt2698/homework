// Run with: node web/tests/task-order.test.cjs
// In-memory DOM/storage harness: exercises production rendering and bound events.
// This is not a browser layout or native Android runtime test.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');
for (const [, id] of source.matchAll(/\$\("#([^"\)]+)"\)/g)) {
  assert(ids.includes(id), `Missing bound element: ${id}`);
}

function harness(seed, date = '2026-09-08', savedStorage) {
  function node() {
    const handlers = new Map();
    return {
      hidden: true, value: '', textContent: '', innerHTML: '', dataset: {}, style: {}, scrollTop: 0,
      classList: { add() {}, remove() {}, toggle() {} },
      focus() {}, setAttribute() {}, setSelectionRange() {},
      querySelector() { return node(); }, querySelectorAll() { return []; }, contains() { return false; },
      addEventListener(type, fn) {
        if (!handlers.has(type)) handlers.set(type, []);
        handlers.get(type).push(fn);
      },
      emit(type, event = {}) { for (const fn of handlers.get(type) || []) fn(event); },
      click() { this.emit('click', { target: this }); }
    };
  }
  const nodes = new Map(ids.map(id => ['#' + id, node()]));
  const storage = savedStorage || new Map();
  const document = {
    ...node(), body: node(), querySelector: selector => nodes.get(selector) || null,
    createElement() {
      return { textContent: '', get innerHTML() {
        return this.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      } };
    }
  };
  const context = {
    document, console, navigator: {},
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    addEventListener() {}, setTimeout() { return 1; }, clearTimeout() {},
    setInterval() { return 1; }, clearInterval() {}, requestAnimationFrame: fn => fn()
  };
  context.window = context;
  vm.createContext(context);
  const start = source.lastIndexOf('  elements.recordDate.value = todayIso();');
  assert(start > 0);
  vm.runInContext(source.slice(0, start) + `
    render = renderTasks;
    showToast = () => {};
    stopAlarmPlayback = () => {};
    globalThis.api = { renderTasks, taskOrderDraft, chooseTaskOrder, openTaskOrderModal,
      toggleTaskListConfirmation, saveWeekendTaskPlan,
      confirmTaskOrderSelection, performTaskAction, toggleTaskOrder,
      setState(value, date) { if (value) state = value; elements.recordDate.value = date; },
      tasks: () => tasksForDate(), owner: () => taskOwnerForDate() };
  })();`, context);
  const api = context.api, el = id => nodes.get('#' + id);
  api.setState(seed, date);
  api.renderTasks();
  const delegate = (element, type, selector, dataset, value) => el(element).emit(type, {
    target: { closest: match => match === selector ? { dataset, value } : null }
  });
  return {
    api, el, storage,
    pick: id => delegate('taskOrderChoices', 'click', 'button[data-order-pick]', { orderPick: id }),
    day: day => delegate('taskOrderDays', 'click', 'button[data-order-day]', { orderDay: day }),
    estimate: (id, value) => delegate('taskOrderChoices', 'change', 'select[data-order-estimate]', { orderEstimate: id }, String(value)),
    cardIds: () => [...el('taskOrderChoices').innerHTML.matchAll(/data-order-pick="([^"]+)"/g)].map(match => match[1]),
    selected: () => Array.from(api.taskOrderDraft().selectedIds),
    original: () => Array.from(api.tasks(), task => task.id)
  };
}
const task = (id, plannedDay) => ({ id, subject: '数学', title: `作业${id}`, status: 'pending', estimatedMinutes: 15,
  breakAfter: true, ...(plannedDay ? { plannedDay } : {}) });
const owner = tasks => ({ tasks, tasksConfirmed: true, confirmed: true, ledgerConfirmed: true, planSaved: true,
  orderSaved: false, mealAfterTaskId: tasks[0]?.id });
const dailyState = () => ({ records: { '2026-09-08': owner([task('a'), task('b'), task('c')]) }, weekends: {} });

let h = harness(dailyState());
h.el('taskOrderButton').click();
assert.equal(h.el('taskOrderModal').hidden, false);
assert.equal(h.el('taskOrderTitle').textContent, '第 1 项，我选……');
assert.deepEqual(h.cardIds(), ['a', 'b', 'c']);
h.el('taskOrderChoices').scrollTop = 120;
h.pick('c');
assert.deepEqual(h.selected(), ['c']);
assert.deepEqual(h.original(), ['a', 'b', 'c']);
assert.deepEqual(h.cardIds(), ['a', 'b', 'c'], 'cards must stay put');
assert.equal(h.el('taskOrderChoices').scrollTop, 120);
assert.equal(h.el('taskOrderTitle').textContent, '第 2 项，我选……');
h.pick('c');
assert.deepEqual(h.selected(), ['c'], 'duplicate click must not consume a position');
h.estimate('b', 60);
assert.equal(h.api.tasks()[1].estimatedMinutes, 60);
assert.deepEqual(h.selected(), ['c'], 'estimate picker is not task selection');
h.api.confirmTaskOrderSelection();
assert.equal(h.api.owner().orderSaved, false, 'partial selection cannot confirm');
h.pick('a');
h.el('taskOrderCloseButton').click();
assert.equal(h.el('taskOrderModal').hidden, true);
h = harness(null, '2026-09-08', h.storage);
h.el('taskOrderButton').click();
assert.deepEqual(h.selected(), ['c', 'a'], 'draft survives reload');
h.pick('b');
assert.equal(h.el('taskOrderTitle').textContent, '我的顺序');
assert.equal(h.el('taskOrderConfirmButton').textContent, '就按这个顺序');
assert.equal(h.api.owner().orderSaved, false);
assert(h.api.tasks().every(task => task.status === 'pending'));
assert.equal(h.el('startPlanModal').hidden, true, 'last choice must not start a task');
const preview = h.el('taskOrderChoices').innerHTML;
assert(preview.indexOf('作业c') < preview.indexOf('作业a'));
assert(preview.indexOf('作业a') < preview.indexOf('作业b'));
h.el('taskOrderUndoButton').click();
assert.deepEqual(h.selected(), ['c', 'a']);
assert.deepEqual(h.cardIds(), ['a', 'b', 'c']);
h.el('taskOrderResetButton').click();
assert.deepEqual(h.selected(), []);
assert.equal(h.el('taskOrderUndoButton').disabled, true);
h.pick('b'); h.pick('c'); h.pick('a');
h.el('taskOrderConfirmButton').click();
assert.deepEqual(h.original(), ['b', 'c', 'a']);
assert.equal(h.api.owner().orderSaved, true);
assert.equal(h.api.owner().orderDraft, undefined);
assert.equal(h.el('taskOrderModal').hidden, true);
assert.equal(h.el('startPlanModal').dataset.taskId, 'b');
assert(h.api.tasks().every(task => task.status === 'pending'));
h.api.performTaskAction('start', 'b');
h.el('focusCompleteButton').click();
assert.equal(h.el('startPlanModal').dataset.taskId, 'c');
assert.equal(h.el('startPlanModal').dataset.kind, 'next');
h.api.toggleTaskOrder();
assert.equal(h.api.owner().orderSaved, true, 'execution locks order');

const weekendTasks = [task('f1', 'friday'), task('s1', 'saturday'), task('u1', 'sunday'), task('f2', 'friday'), task('s2', 'saturday')];
h = harness({ records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: { '2026-09-11': owner(weekendTasks) } }, '2026-09-11');
h.el('taskOrderButton').click();
assert.deepEqual(h.cardIds(), ['f1', 'f2']);
h.pick('s1');
assert.deepEqual(h.selected(), [], 'cannot pick a task from a hidden day');
h.pick('f2'); h.pick('f1');
assert.equal(h.el('taskOrderConfirmButton').textContent, '选择周六');
h.el('taskOrderConfirmButton').click();
assert.equal(h.el('taskOrderTitle').textContent, '第 1 项，我选……');
assert.deepEqual(h.cardIds(), ['s1', 's2']);
h.pick('s2');
h.day('sunday'); h.pick('u1');
h.el('taskOrderUndoButton').click();
assert.deepEqual(h.cardIds(), ['u1'], 'undo returns to the day of the undone choice');
h.pick('u1'); h.day('saturday'); h.pick('s1');
assert.equal(h.el('taskOrderTitle').textContent, '我的顺序');
assert.deepEqual(h.original(), ['f1', 's1', 'u1', 'f2', 's2']);
h.el('taskOrderConfirmButton').click();
assert.deepEqual(h.original(), ['f2', 'f1', 's2', 's1', 'u1']);
assert.equal(h.el('startPlanModal').dataset.taskId, 'f2');

// Legacy saved orders stay usable. Editing task membership or assigned days invalidates a draft.
h = harness(dailyState());
h.api.owner().orderSaved = true;
h.api.renderTasks();
assert.equal(h.api.owner().orderSaved, true);
h.el('taskOrderButton').click();
assert.deepEqual(h.selected(), []);
h.pick('a');
h.api.tasks().push(task('d'));
assert.deepEqual(h.selected(), []);
h.pick('b');
h.api.tasks().splice(0, 1);
assert.deepEqual(h.selected(), []);
const single = owner([task('only')]);
h = harness({ records: { '2026-09-08': single }, weekends: {} });
h.el('taskOrderButton').click();
assert.equal(h.el('taskOrderTitle').textContent, '第 1 项，我选……');
h.pick('only');
assert.equal(single.orderSaved, false);
h.el('taskOrderConfirmButton').click();
assert.equal(single.orderSaved, true);
assert.equal(h.el('startPlanModal').dataset.taskId, 'only');

// Confirmation opens selection automatically; empty weekend days are skipped.
const entry = dailyState();
entry.records['2026-09-08'].tasksConfirmed = false;
h = harness(entry);
h.api.toggleTaskListConfirmation();
assert.equal(h.el('taskOrderModal').hidden, false);
const saturdayOnly = owner([task('sat1', 'saturday'), task('sat2', 'saturday')]);
saturdayOnly.planSaved = false;
h = harness({ records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: { '2026-09-11': saturdayOnly } }, '2026-09-11');
h.api.saveWeekendTaskPlan();
assert.equal(h.el('taskOrderModal').hidden, false);
assert.deepEqual(h.cardIds(), ['sat1', 'sat2']);
h.pick('sat2');
saturdayOnly.tasks[0].plannedDay = 'sunday';
assert.deepEqual(h.selected(), [], 'changing assigned days invalidates the draft');
saturdayOnly.tasks[0].plannedDay = 'saturday';
h.api.openTaskOrderModal();
h.pick('sat2'); h.pick('sat1');
h.el('taskOrderConfirmButton').click();
assert.equal(saturdayOnly.orderSaved, true);
assert.equal(h.el('startPlanModal').hidden, true, 'Friday does not start Saturday tasks');
const weekendStorage = h.storage;
h = harness(null, '2026-09-12', weekendStorage);
h.api.toggleTaskOrder();
assert.equal(h.el('taskOrderModal').hidden, true, 'Saturday uses the saved Friday order');
assert.deepEqual(h.original(), ['sat2', 'sat1']);
assert.equal(h.api.owner().orderSaved, true);
console.log('PASS: bindings, stable cards, duplicate taps, estimates, undo/reset, reload, preview/confirmation, scheduling, weekend groups, legacy records and draft invalidation.');
