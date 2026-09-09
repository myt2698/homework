(function (root) {
  "use strict";
  root.mountHolidayUI = function (host) {
    const H = root.HolidayPlans, $ = s => document.querySelector(s), state = host.getState;
    const e = Object.fromEntries(["holidaySettingsPage", "holidaySettingsList", "holidayConfigForm", "holidayConfigTitle", "holidayName", "holidayStart", "holidayEnd", "holidayPlanDate", "holidayConfigCancel", "holidayPlanPage", "holidayPlanTitle", "holidayViewDate", "holidayDaySummary", "holidaySort", "holidaySortReset", "holidayShortDays", "holidayTaskList", "holidayTaskForm", "holidayRepeat", "holidayRepeatDates", "holidayRepeatDateList", "holidaySubject", "holidayTaskTitle", "holidayTaskMinutes", "holidayPlanEntry", "holidayOverdue", "holidayOverdueSummary", "holidayOverdueList", "holidayLedgerHint", "holidayLedgerText", "holidayTaskEdit", "holidayEditContent", "holidayEditMinutes", "holidayEditSeries", "holidayEditSeriesLabel"].map(id => [id, $("#" + id)]));
    let configId = null, planId = null, fromSettings = false, sortIds = null, editRef = null;
    const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const attempt = action => { try { action(); } catch (error) { host.toast(error.message); } };
    const save = () => { host.persist(); host.render(); };
    const currentHoliday = () => state().holidays?.[planId];
    const ready = () => Boolean(state().records[currentHoliday()?.planDate]?.ledgerConfirmed);
    const minutesOptions = host.estimates.map(n => `<option value="${n}">${n} 分钟</option>`).join("");
    e.holidayTaskMinutes.innerHTML = minutesOptions; e.holidayEditMinutes.innerHTML = minutesOptions;
    e.holidayTaskMinutes.value = "15";
    const keywordSuggestions = $("#holidayKeywordSuggestions");
    function renderKeywords() {
      const subject = e.holidaySubject.value, keywords = host.keywords(subject).filter(k => k.visible !== false);
      keywordSuggestions.dataset.subject = subject; keywordSuggestions.hidden = !keywords.length;
      keywordSuggestions.innerHTML = keywords.map(k => `<button type="button" data-holiday-keyword="${esc(k.label)}">${esc(k.label)}</button>`).join("");
    }
    function resize() {
      if (e.holidayPlanPage.hidden) return;
      const height = window.visualViewport?.height || window.innerHeight;
      if (height) e.holidayPlanPage.style.height = `${height}px`;
    }
    function resetConfig() {
      configId = null; e.holidayName.value = ""; e.holidayStart.value = H.plus(host.today(), 1); e.holidayEnd.value = H.plus(host.today(), 7); e.holidayPlanDate.value = host.today();
      e.holidayConfigTitle.textContent = "添加假期"; e.holidayConfigCancel.hidden = true;
    }
    function settings() {
      e.holidaySettingsList.innerHTML = H.configs(state()).sort((a, b) => a.start.localeCompare(b.start)).map(h => `<section class="card settings-card"><h2>${esc(h.name)}</h2><small>${h.start} — ${h.end} · ${h.planDate} 安排</small><div class="holiday-actions"><button class="secondary-button" data-holiday-open="${esc(h.id)}">安排作业</button><button class="text-button" data-holiday-edit="${esc(h.id)}">修改</button>${H.refs(state(), h.id).length ? "" : `<button class="text-button danger" data-holiday-delete="${esc(h.id)}">删除</button>`}</div></section>`).join("");
    }
    function openSettings() { resetConfig(); settings(); host.open(e.holidaySettingsPage); }
    function repeatDates() {
      const h = currentHoliday(); if (!h) return;
      e.holidayRepeatDateList.innerHTML = H.days(h.start, h.end).map(d => `<label><input type="checkbox" data-holiday-repeat-date="${d}" checked>${d.slice(5)}</label>`).join("");
    }
    function openPlan(id, origin = false) {
      const h = state().holidays?.[id]; if (!h) return;
      planId = id; fromSettings = origin; sortIds = null;
      e.holidayViewDate.min = h.planDate; e.holidayViewDate.max = h.end;
      e.holidayViewDate.value = host.date() >= h.planDate && host.date() <= h.end ? host.date() : h.planDate;
      e.holidayRepeat.value = "once"; e.holidayRepeatDates.hidden = true; e.holidayTaskTitle.value = ""; repeatDates();
      host.open(e.holidayPlanPage); renderPlan(); renderKeywords(); resize();
    }
    function row(ref, overdue = false) {
      const t = { ...ref.task, estimatedMinutes: Number(ref.task.estimatedMinutes) || 15 }, canEdit = H.pending(t), movable = !["done", "active"].includes(t.status);
      const selected = sortIds?.indexOf(t.id) ?? -1;
      const info = [overdue ? ref.date : "", t.holidaySeriesId ? "每天" : "", t.status === "done" ? "已完成" : t.status === "active" ? "进行中" : t.status === "paused" ? "已暂停" : ""].filter(Boolean).join(" · ");
      return `<article class="holiday-task-row" data-subject="${esc(t.subject)}" data-holiday-task="${esc(t.id)}" data-holiday-date="${ref.date}"><span class="holiday-subject">${esc(t.subject)}</span><div class="holiday-task-copy"><strong>${esc(t.title)}</strong><small>${esc(info)}</small></div><span class="holiday-task-estimate">预计 ${t.estimatedMinutes || 15} 分钟</span><div class="holiday-task-actions">${sortIds ? canEdit ? `<button class="secondary-button" data-holiday-action="pick"${selected >= 0 ? " disabled" : ""}>${selected >= 0 ? `第 ${selected + 1} 项` : "选这项"}</button>` : "" : `${canEdit && !overdue ? '<button class="text-button" data-holiday-action="edit">修改</button><button class="text-button danger" data-holiday-action="delete">删除当天</button>' : ""}${movable ? `<input type="date" aria-label="${esc(t.title)}改期日期" value="${overdue ? host.date() : ref.date}"><button class="text-button bordered" data-holiday-action="move">${overdue ? "安排补做" : "改期"}</button>` : ""}`}</div></article>`;
    }
    function renderPlan() {
      const h = currentHoliday(); if (!h) return;
      const date = e.holidayViewDate.value, list = H.tasks(state(), date);
      e.holidayPlanTitle.textContent = h.name;
      e.holidayDaySummary.textContent = `${list.length} 项 · 预计 ${list.reduce((n, t) => n + Number(t.estimatedMinutes || 15), 0)} 分钟`;
      e.holidaySort.textContent = sortIds ? `确定顺序 ${sortIds.length}/${list.filter(H.pending).length}` : "调整当天顺序";
      e.holidaySort.disabled = !list.some(H.pending); e.holidaySortReset.hidden = !sortIds;
      const days = H.days(h.planDate, h.end); e.holidayShortDays.hidden = days.length > 8;
      e.holidayShortDays.innerHTML = days.length > 8 ? "" : days.map(d => `<button class="text-button bordered" data-holiday-view="${d}" aria-pressed="${d === date}">${d.slice(5)}</button>`).join("");
      e.holidayTaskList.innerHTML = list.length ? list.map(task => row({ date, task })).join("") : '<div class="keyword-settings-empty">这一天还没有安排作业</div>';
      e.holidayTaskForm.hidden = Boolean(sortIds) || !ready();
      e.holidayLedgerHint.hidden = ready(); e.holidayLedgerText.textContent = `先在 ${h.planDate} 核对钉钉，补全成长记录册。`;
    }
    function renderHome() {
      const h = H.find(state(), host.date());
      e.holidayPlanEntry.hidden = !h;
      if (h) e.holidayPlanEntry.innerHTML = `<span>${esc(h.name)} · ${host.date() === h.planDate ? "安排假期作业" : "查看与调整计划"}</span><span aria-hidden="true">›</span>`;
      const overdue = H.refs(state()).filter(r => r.date < host.date() && r.task.status !== "done");
      e.holidayOverdue.hidden = !overdue.length;
      e.holidayOverdueSummary.textContent = `之前未完成 · ${overdue.length} 项`;
      e.holidayOverdueList.innerHTML = overdue.map(ref => row(ref, true)).join("");
    }
    function back() {
      if (!e.holidayTaskEdit.hidden) { closeEdit(); return true; }
      if (!e.holidayPlanPage.hidden) { e.holidayPlanPage.hidden = true; sortIds = null; if (fromSettings) { settings(); host.open(e.holidaySettingsPage); } else host.back(false); return true; }
      if (!e.holidaySettingsPage.hidden) { e.holidaySettingsPage.hidden = true; host.back(true); return true; }
      return false;
    }
    function closeEdit() { e.holidayTaskEdit.hidden = true; editRef = null; document.body.classList.remove("modal-open"); }
    function taskAction(event) {
      const button = event.target.closest("button[data-holiday-action]"), r = button?.closest("[data-holiday-task]");
      if (!r) return;
      const ref = { date: r.dataset.holidayDate, task: H.tasks(state(), r.dataset.holidayDate).find(t => t.id === r.dataset.holidayTask) };
      if (!ref.task) return;
      attempt(() => {
        const action = button.dataset.holidayAction;
        if (action === "pick") { if (!sortIds || sortIds.includes(ref.task.id)) return; sortIds.push(ref.task.id); renderPlan(); return; }
        if (action === "edit") {
          editRef = ref; e.holidayEditContent.value = ref.task.title; e.holidayEditMinutes.value = String(ref.task.estimatedMinutes || 15);
          e.holidayEditSeriesLabel.hidden = !ref.task.holidaySeriesId; e.holidayEditSeries.checked = Boolean(ref.task.holidaySeriesId);
          e.holidayTaskEdit.hidden = false; document.body.classList.add("modal-open"); e.holidayEditContent.focus(); return;
        }
        if (action === "delete") { if (!window.confirm("只删除当天这一项作业，确定吗？")) return; H.removeTask(state(), ref); }
        if (action === "move") {
          const date = r.querySelector("input[type=date]").value;
          if (date < host.date()) throw Error("补做或改期请选择当前查看日期或之后的日期");
          H.move(state(), ref, date);
        }
        save(); renderPlan(); host.toast("计划已更新");
      });
    }
    $("#openHolidaySettingsButton").addEventListener("click", openSettings);
    $("#holidaySettingsBack").addEventListener("click", back);
    $("#holidayPlanBack").addEventListener("click", back);
    e.holidayConfigCancel.addEventListener("click", resetConfig);
    e.holidayStart.addEventListener("change", () => { if (H.iso(e.holidayStart.value)) e.holidayPlanDate.value = H.plus(e.holidayStart.value, -1); });
    e.holidayConfigForm.addEventListener("submit", event => { event.preventDefault(); attempt(() => {
      H.save(state(), { id: configId || `holiday-${Date.now()}`, name: e.holidayName.value, start: e.holidayStart.value, end: e.holidayEnd.value, planDate: e.holidayPlanDate.value, confirmed: state().holidays?.[configId]?.confirmed || false });
      save(); resetConfig(); settings(); host.toast("假期已保存");
    }); });
    e.holidaySettingsList.addEventListener("click", event => { const b = event.target.closest("button"); if (!b) return; attempt(() => {
      if (b.dataset.holidayOpen) openPlan(b.dataset.holidayOpen, true);
      if (b.dataset.holidayEdit) { const h = state().holidays[b.dataset.holidayEdit]; configId = h.id; e.holidayName.value = h.name; e.holidayStart.value = h.start; e.holidayEnd.value = h.end; e.holidayPlanDate.value = h.planDate; e.holidayConfigTitle.textContent = "修改假期"; e.holidayConfigCancel.hidden = false; e.holidayName.focus(); }
      if (b.dataset.holidayDelete && window.confirm("删除这个尚未录入作业的假期吗？")) { H.removeHoliday(state(), b.dataset.holidayDelete); save(); settings(); }
    }); });
    e.holidayPlanEntry.addEventListener("click", () => { const h = H.find(state(), host.date()); if (h) openPlan(h.id); });
    e.holidayViewDate.addEventListener("change", () => { const h = currentHoliday(), d = e.holidayViewDate.value; if (!H.iso(d) || d < h.planDate || d > h.end) e.holidayViewDate.value = h.planDate; sortIds = null; renderPlan(); });
    e.holidayShortDays.addEventListener("click", event => { const b = event.target.closest("[data-holiday-view]"); if (b) { e.holidayViewDate.value = b.dataset.holidayView; sortIds = null; renderPlan(); } });
    e.holidayRepeat.addEventListener("change", () => { e.holidayRepeatDates.hidden = e.holidayRepeat.value !== "daily"; });
    e.holidaySubject.addEventListener("change", renderKeywords);
    keywordSuggestions.addEventListener("click", event => {
      const button = event.target.closest("[data-holiday-keyword]"); if (!button) return;
      const current = e.holidayTaskTitle.value.trim();
      e.holidayTaskTitle.value = (current ? current + " " : "") + button.dataset.holidayKeyword;
      e.holidayTaskTitle.focus({ preventScroll: true }); e.holidayTaskTitle.setSelectionRange(e.holidayTaskTitle.value.length, e.holidayTaskTitle.value.length);
    });
    e.holidayTaskForm.addEventListener("pointerdown", event => {
      if (document.activeElement === e.holidayTaskTitle && event.target.closest("button")) event.preventDefault();
    });
    e.holidayTaskForm.addEventListener("submit", event => { event.preventDefault(); attempt(() => {
      if (!ready()) throw Error("请先核对假期作业");
      const repeat = e.holidayRepeat.value === "daily";
      const dates = repeat ? [...e.holidayRepeatDateList.querySelectorAll("input:checked")].map(i => i.dataset.holidayRepeatDate) : [e.holidayViewDate.value];
      H.add(state(), currentHoliday(), { subject: e.holidaySubject.value, title: e.holidayTaskTitle.value, minutes: Number(e.holidayTaskMinutes.value), repeat }, dates);
      e.holidayTaskTitle.value = ""; save(); renderPlan(); e.holidayTaskList.scrollTop = e.holidayTaskList.scrollHeight; e.holidayTaskTitle.focus(); host.toast(`已安排 ${dates.length} 天`);
    }); });
    e.holidaySort.addEventListener("click", () => attempt(() => { if (sortIds) { H.order(state(), e.holidayViewDate.value, sortIds); sortIds = null; save(); } else sortIds = []; renderPlan(); }));
    e.holidaySortReset.addEventListener("click", () => { sortIds = []; renderPlan(); });
    $("#holidayConfirm").addEventListener("click", () => attempt(() => {
      if (!ready()) throw Error("请先核对假期作业");
      if (e.holidayTaskTitle.value.trim()) throw Error("还有未添加的作业，请先点加号");
      if (sortIds) H.order(state(), e.holidayViewDate.value, sortIds);
      const firstConfirmation = !currentHoliday().confirmed && !fromSettings;
      H.confirm(state(), currentHoliday()); save(); back(); host.toast("假期计划已保存，每天按当天清单完成");
      if (firstConfirmation) host.confirmed();
    }));
    $("#holidayCheckLedger").addEventListener("click", () => { const date = currentHoliday().planDate; e.holidayPlanPage.hidden = true; host.back(false); host.goDate(date); });
    e.holidayTaskList.addEventListener("click", taskAction); e.holidayOverdueList.addEventListener("click", taskAction);
    $("#holidayEditCancel").addEventListener("click", closeEdit);
    $("#holidayTaskEditForm").addEventListener("submit", event => { event.preventDefault(); attempt(() => { if (!editRef) return; H.edit(state(), editRef, e.holidayEditContent.value, Number(e.holidayEditMinutes.value), !e.holidayEditSeriesLabel.hidden && e.holidayEditSeries.checked, host.today()); closeEdit(); save(); renderPlan(); }); });
    return { renderHome, back, openPlan, resize, hide() { if (!e.holidayPlanPage.hidden) document.body.classList.remove("task-entry-page-open"); e.holidaySettingsPage.hidden = true; e.holidayPlanPage.hidden = true; closeEdit(); }, isOpen: () => !e.holidayPlanPage.hidden || !e.holidaySettingsPage.hidden };
  };
})(globalThis);
