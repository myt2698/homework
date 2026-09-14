/* Unified daily plans; legacy field names keep backup compatibility. */
(function (root) {
  "use strict";
  const H = root.HolidayPlans;
  const record = (s, d) => (s.records ||= {})[d] ||= {};
  const refs = (s, id) => Object.keys(s.records || {}).filter(H.iso).flatMap(date => H.tasks(s, date).filter(t => t && (!id || t.holidayId === id)).map(task => ({ date, task }))).sort((a, b) => a.date.localeCompare(b.date));
  const find = (s, d) => H.configs(s).filter(h => h.planDate <= d && d <= h.end).sort((a, b) => b.planDate.localeCompare(a.planDate))[0];
  const localDate = value => { const d = new Date(Number(value)); return Number(value) > 0 && !Number.isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : null; };
  function migrate(s, today, sessions = []) {
    s.records ||= {}; s.weekends ||= {}; s.holidays ||= {};
    const known = new Set(refs(s).map(r => String(r.task.id)));
    // Archive weekend objects unchanged apart from the migration marker, preserving settlement history.
    for (const [key, w] of Object.entries(s.weekends)) {
      if (!H.iso(key) || !w || w.datedTasksMigrated) continue;
      for (const d of H.days(key, H.plus(key, 2))) {
        const r = s.records[d]; if (r && (r.finishTime || r.ruleId)) r.legacyWeekendSettlement = true;
      }
      for (const original of (Array.isArray(w.tasks) ? w.tasks : [])) {
        if (!original || known.has(String(original.id))) continue;
        const planned = H.plus(key, original.plannedDay === "friday" ? 0 : original.plannedDay === "sunday" ? 2 : 1);
        const session = sessions.find(x => x && H.iso(x.date) && [x.taskId, x.sourceTaskId, x.nextTaskId].some(id => id != null && String(id) === String(original.id)));
        const worked = H.iso(original.lastWorkedDate) ? original.lastWorkedDate : localDate(original.activeSince);
        const date = original.status === "done" && H.iso(original.completedDate) ? original.completedDate : session ? session.date : original.status === "active" && worked ? worked : planned;
        const r = record(s, date), copy = JSON.parse(JSON.stringify(original));
        copy.legacyPlannedDate = planned; copy.legacyWeekendKey = key;
        (r.tasks ||= []).push(copy); known.add(String(copy.id));
        if (w.confirmed || original.status && original.status !== "pending") r.tasksConfirmed = true;
        if (w.orderSaved || w.planSaved || original.status && original.status !== "pending") r.orderSaved = true;
      }
      w.datedTasksMigrated = true;
      if ((w.tasks || []).length) {
        const id = `legacy-weekend-${key}`;
        s.holidays[id] ||= { id, name: "作业计划", start: key, planDate: key, end: H.plus(key, 2), confirmed: Boolean(w.confirmed), legacy: true };
      }
    }
    for (const h of H.configs(s)) if (!h.unified && !h.legacy) {
      h.unified = true;
    }
    s.planningVersion = 2; return s;
  }
  function ensure(s, date) {
    if (!H.iso(date)) throw Error("日期无效");
    const id = `plan-${date}`; if (s.holidays?.[id]) return s.holidays[id];
    const previous = find(s, date);
    return (s.holidays ||= {})[id] = { id, name: "作业计划", start: date, planDate: date, end: previous?.end || date, unified: true, confirmed: Boolean(s.records?.[date]?.tasksConfirmed) };
  }
  function setRange(s, h, count) {
    if (!Number.isInteger(count) || count < 1 || count > 366) throw Error("请选择 1 到 366 天，包含开始的这一天");
    // Only the visible range changes. Daily tasks are never regenerated or deleted.
    h.end = H.plus(h.planDate, count - 1); h.start = h.planDate; h.unified = true;
  }
  function mark(s, date, added = false) {
    const r = record(s, date); delete r.orderDraft;
    if (added) { delete r.tasksFinishedAt; delete r.finishTime; delete r.ruleId; delete r.legacyWeekendSettlement; }
  }
  function add(s, h, draft, dates) {
    if (!draft.title.trim() || !dates.length) throw Error("请填写作业，并选择至少一天");
    if (dates.some(d => !H.iso(d) || d < h.planDate || d > h.end)) throw Error("作业日期应在计划范围内");
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    [...new Set(dates)].forEach((date, i) => {
      const r = record(s, date);
      (r.tasks ||= []).push({ id: `plan-${stamp}-${i}`, holidayId: h.id, holidaySeriesId: draft.repeat ? stamp : "", holidayOriginalDate: date,
        title: draft.title.trim(), subject: draft.subject, estimatedMinutes: draft.minutes, status: "pending", elapsedMs: 0, addedAt: Date.now(), addedSequence: i });
      mark(s, date, true);
    });
  }
  function move(s, ref, date) {
    if (!H.iso(date)) throw Error("请选择有效日期");
    if (["done", "active"].includes(ref.task.status)) throw Error("请先暂停作业；已完成的记录不能改期");
    if (date === ref.date) return;
    if (!H.tasks(s, ref.date).includes(ref.task)) throw Error("作业清单有变化，请重新打开计划");
    record(s, ref.date).tasks = H.tasks(s, ref.date).filter(t => t.id !== ref.task.id);
    const target = record(s, date), empty = !H.tasks(s, date).length;
    (target.tasks ||= []).push(ref.task); mark(s, ref.date); mark(s, date, true);
    if (empty) { target.tasksConfirmed = true; target.orderSaved = true; }
  }
  function removeTask(s, ref) {
    if (!H.pending(ref.task)) throw Error("已开始或已完成的作业保留原记录");
    record(s, ref.date).tasks = H.tasks(s, ref.date).filter(t => t.id !== ref.task.id); mark(s, ref.date);
  }
  function confirm(s, h) {
    H.days(h.planDate, h.end).forEach(date => { const r = record(s, date); r.tasks ||= []; r.tasksConfirmed = true; r.orderSaved = true; delete r.orderDraft; }); h.confirmed = true;
  }
  root.HolidayPlans = { ...H, refs, find, migrate, ensure, setRange, add, move, removeTask, confirm };
  if (typeof module !== "undefined") module.exports = root.HolidayPlans;
})(globalThis);
