/* Local holiday plans. Daily task instances are stored once, in the existing daily records. */
(function (root) {
  "use strict";
  const iso = value => /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  const plus = (date, n) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const days = (start, end) => { const result = []; for (let d = start; d <= end && result.length <= 366; d = plus(d, 1)) result.push(d); return result; };
  const configs = state => Object.values(state.holidays || {}).filter(h => h && iso(h.start) && iso(h.end) && iso(h.planDate));
  const find = (state, date) => configs(state).find(h => h.planDate <= date && date <= h.end);
  const record = (state, date) => state.records[date] ||= {};
  const tasks = (state, date) => Array.isArray(state.records[date]?.tasks) ? state.records[date].tasks : [];
  const refs = (state, id) => Object.keys(state.records).filter(iso).flatMap(date => tasks(state, date).filter(t => t && t.holidayId && (!id || t.holidayId === id)).map(task => ({ date, task }))).sort((a, b) => a.date.localeCompare(b.date));
  const pending = task => (task.status || "pending") === "pending" && !task.startedAt && !task.elapsedMs;
  const meaningfulWeekend = w => (w.tasks || []).length || ["confirmed", "planSaved", "dailySeparated", "specialSeparated", "fridayDone", "saturdayMorningDone", "allDoneDate", "penaltyConfirmed"].some(k => w[k]);
  function clearEmptyHolidayMarkers(state, h) {
    if (!h) return;
    days(h.planDate, h.end).forEach(date => {
      const r = state.records[date];
      if (!r?.holidayDaily || tasks(state, date).some(t => t.holidayId)) return;
      delete r.holidayDaily;
      if (!tasks(state, date).length) { delete r.tasksConfirmed; delete r.orderSaved; delete r.orderDraft; }
    });
  }
  const mark = (state, date) => { const r = record(state, date); r.holidayDaily = true; delete r.orderDraft; if (!(r.tasks || []).some(t => !pending(t))) { r.tasksConfirmed = false; r.orderSaved = false; } delete r.tasksFinishedAt; };
  function validate(state, h) {
    if (!String(h.name || "").trim()) throw Error("请填写假期名称");
    if (![h.start, h.end, h.planDate].every(iso) || h.start > h.end || h.planDate > h.start) throw Error("请检查日期：安排日期不能晚于假期开始日期");
    if (days(h.planDate, h.end).length > 366) throw Error("一次假期计划最多设置 366 天");
    if (configs(state).some(other => other.id !== h.id && other.planDate <= h.end && h.planDate <= other.end)) throw Error("日期与另一个假期计划重叠，请调整日期");
    const old = state.holidays?.[h.id];
    if (old && refs(state, h.id).length && ["start", "end", "planDate"].some(k => old[k] !== h[k])) throw Error("已有作业的假期保留原日期；可以修改名称或调整具体作业日期");
    for (const [date, w] of Object.entries(state.weekends || {})) {
      if (date <= h.end && plus(date, 2) >= h.planDate && meaningfulWeekend(w)) throw Error("这些日期已有周末计划，请先处理原计划，避免覆盖已有记录");
    }
  }
  function save(state, h) { validate(state, h); state.holidays ||= {}; const old = state.holidays[h.id]; if (old && ["start", "end", "planDate"].some(k => old[k] !== h[k])) clearEmptyHolidayMarkers(state, old); state.holidays[h.id] = { ...h, name: h.name.trim() }; }
  function removeHoliday(state, id) { if (refs(state, id).length) throw Error("假期已有作业，不能删除；请保留以便查看记录"); clearEmptyHolidayMarkers(state, state.holidays[id]); delete state.holidays[id]; }
  function add(state, h, draft, dates) {
    if (!draft.title.trim() || !dates.length) throw Error("请填写作业，并选择至少一天");
    if (dates.some(d => !iso(d) || d < (draft.repeat ? h.start : h.planDate) || d > h.end)) throw Error("作业日期应在计划范围内");
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    [...new Set(dates)].forEach((date, i) => {
      const r = record(state, date); r.tasks ||= [];
      r.tasks.push({ id: `holiday-${stamp}-${i}`, holidayId: h.id, holidaySeriesId: draft.repeat ? stamp : "", holidayOriginalDate: date,
        title: draft.title.trim(), subject: draft.subject, estimatedMinutes: draft.minutes, status: "pending", elapsedMs: 0, addedAt: Date.now(), addedSequence: i });
      mark(state, date);
    });
  }
  function edit(state, ref, title, minutes, series, today) {
    if (!pending(ref.task)) throw Error("已开始或已完成的作业保留原记录");
    if (!title.trim()) throw Error("作业内容不能为空");
    const group = ref.task.holidaySeriesId;
    const targets = series && group ? refs(state, ref.task.holidayId).filter(r => r.task.holidaySeriesId === group && r.date >= ref.date && r.date >= today && pending(r.task)) : [ref];
    if (!targets.length) throw Error("没有可修改的未来作业，可取消批量修改后单独修改这一项");
    targets.forEach(r => { r.task.title = title.trim(); r.task.estimatedMinutes = minutes; });
  }
  function removeTask(state, ref) {
    if (!pending(ref.task)) throw Error("已开始或已完成的作业保留原记录");
    record(state, ref.date).tasks = tasks(state, ref.date).filter(t => t.id !== ref.task.id); mark(state, ref.date);
  }
  function move(state, ref, date) {
    if (!iso(date)) throw Error("请选择有效日期");
    if (ref.task.status === "done" || ref.task.status === "active") throw Error("请先暂停作业；已完成的记录不能改期");
    if (date === ref.date) return;
    if (!find(state, date) && tasks(state, date).length && !state.records[date].tasksConfirmed) throw Error("请先确认目标日期已有的作业清单，再安排补做");
    for (const [key, w] of Object.entries(state.weekends || {})) {
      if (key <= date && plus(key, 2) >= date && meaningfulWeekend(w)) throw Error("所选日期已有周末计划，请选择其他日期，避免覆盖原计划");
    }
    record(state, ref.date).tasks = tasks(state, ref.date).filter(t => t.id !== ref.task.id);
    const target = record(state, date), confirmed = target.tasksConfirmed; target.tasks ||= []; target.tasks.push(ref.task);
    mark(state, ref.date); mark(state, date);
    if (confirmed || !find(state, date)) { target.tasksConfirmed = true; target.orderSaved = true; }
  }
  function confirm(state, h) {
    days(h.planDate, h.end).forEach(date => { const r = record(state, date); r.tasks ||= []; r.holidayDaily = true; r.tasksConfirmed = true; r.orderSaved = true; delete r.orderDraft; });
    h.confirmed = true;
  }
  function order(state, date, ids) {
    const list = tasks(state, date), available = list.filter(pending);
    if (new Set(ids).size !== ids.length || ids.length !== available.length || ids.some(id => !available.some(t => t.id === id))) throw Error("请按顺序选完当天未开始的作业");
    const queue = ids.map(id => available.find(t => t.id === id));
    record(state, date).tasks = list.map(t => pending(t) ? queue.shift() : t);
    record(state, date).orderSaved = true;
  }
  root.HolidayPlans = { iso, plus, days, configs, find, tasks, refs, pending, save, removeHoliday, add, edit, removeTask, move, confirm, order };
  if (typeof module !== "undefined") module.exports = root.HolidayPlans;
})(globalThis);
