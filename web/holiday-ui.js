(function (root) {
  "use strict";
  root.mountHolidayUI = function (host) {
    const H = root.HolidayPlans, $ = s => document.querySelector(s), state = host.getState;
    const e = Object.fromEntries(["holidaySettingsPage", "holidaySettingsList", "holidayConfigForm", "holidayConfigTitle", "holidayName", "holidayStart", "holidayEnd", "holidayPlanDate", "holidayConfigCancel", "holidayPlanPage", "holidayPlanTitle", "holidayDaySummary", "holidaySort", "holidaySortReset", "holidayShortDays", "holidayTaskList", "holidayTaskForm", "holidayRepeat", "holidayRepeatDates", "holidayRepeatDateList", "holidaySubject", "holidayTaskTitle", "holidayPlanEntry", "holidayOverdue", "holidayOverdueSummary", "holidayOverdueList", "holidayLedgerHint", "holidayLedgerText", "holidayTaskEdit", "holidayEditContent", "holidayEditMinutes", "holidayEditSeries", "holidayEditSeriesLabel"].map(id => [id, $("#" + id)]));
    let configId = null, planId = null, viewDate = null, fromSettings = false, sortIds = null, editRef = null;
    const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const attempt = action => { try { action(); } catch (error) { host.toast(error.message); } };
    const save = () => { host.persist(); host.render(); };
    const currentHoliday = () => state().holidays?.[planId];
    const ready = () => Boolean(state().records[currentHoliday()?.planDate]?.ledgerConfirmed);
    const minutesOptions = host.estimates.map(n => `<option value="${n}">${n} 分钟</option>`).join("");
    e.holidayEditMinutes.innerHTML = minutesOptions;
    const keywordSuggestions = $("#holidayKeywordSuggestions");
    const subjectPicker = $("#holidaySubjectPicker"), subjectOptions = $("#holidaySubjectOptions"), subjectLabel = $("#holidaySubjectLabel");
    function subjectMenu(open) { subjectOptions.hidden = !open; e.holidaySubject.setAttribute("aria-expanded", String(open)); }
    function resizeDraft() { e.holidayTaskTitle.style.height = "48px"; e.holidayTaskTitle.style.height = `${Math.max(48, Math.min(e.holidayTaskTitle.scrollHeight, 72))}px`; }
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
      viewDate = host.date() >= h.planDate && host.date() <= h.end ? host.date() : h.planDate;
      e.holidayRepeat.value = "once"; e.holidayRepeatDates.hidden = true; e.holidayTaskTitle.value = ""; repeatDates();
      host.open(e.holidayPlanPage); renderPlan(true); renderKeywords(); resize(); resizeDraft();
    }
    function taskIcon(action, title) {
      const label = action === "edit" ? `修改${title}` : `删除${title}（仅当天）`;
      const path = action === "edit" ? '<path d="m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5 M4 15l5 5"/>' : '<path d="M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7"/>';
      return `<button class="text-button holiday-task-icon${action === "delete" ? " danger" : ""}" type="button" data-holiday-action="${action}" aria-label="${esc(label)}" title="${esc(label)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></button>`;
    }
    function moveControl(ref) {
      const choices = holidayDays(currentHoliday()).filter(day => day.date >= host.date());
      const hasCurrent = choices.some(day => day.date === ref.date);
      return `<div class="holiday-move-controls"><select class="holiday-move-day" data-holiday-move-date aria-label="${esc(ref.task.title)}改到第几天"${choices.length ? "" : " disabled"}><option value="" disabled${hasCurrent ? "" : " selected"}>${choices.length ? "选择第几天" : "假期已结束"}</option>${choices.map(day => `<option value="${day.date}"${day.date === ref.date ? " selected" : ""}>${day.label} · ${day.detail}</option>`).join("")}</select></div>`;
    }
    function row(ref, overdue = false) {
      const t = { ...ref.task, estimatedMinutes: Number(ref.task.estimatedMinutes) || 15 }, canEdit = H.pending(t), movable = !["done", "active"].includes(t.status);
      const selected = sortIds?.indexOf(t.id) ?? -1;
      const info = [overdue ? ref.date : "", t.holidaySeriesId ? "每天" : "", t.status === "done" ? "已完成" : t.status === "active" ? "进行中" : t.status === "paused" ? "已暂停" : ""].filter(Boolean).join(" · ");
      const estimate = sortIds && canEdit && !overdue
        ? `<label class="order-estimate-control holiday-order-estimate"><span>预计用时</span><select data-holiday-estimate="${esc(t.id)}" aria-label="${esc(t.title)}预计用时">${host.estimates.map(n => `<option value="${n}"${n === t.estimatedMinutes ? " selected" : ""}>${n} 分钟</option>`).join("")}</select></label>`
        : overdue ? `<span class="holiday-task-estimate">预计 ${t.estimatedMinutes || 15} 分钟</span>` : "";
      if (sortIds && canEdit && !overdue) {
        const subject = t.subject || "其他";
        return `<article class="holiday-task-row holiday-order-row" data-subject="${esc(subject)}" data-holiday-task="${esc(t.id)}" data-holiday-date="${ref.date}">
          <button class="order-pick-card" type="button" data-holiday-action="pick" aria-pressed="${selected >= 0}" aria-label="${esc(`${selected >= 0 ? `第 ${selected + 1} 项：` : "选择："}${subject}，${t.title}`)}">
            <span class="task-subject-label">${Array.from(subject).map(char => `<span>${esc(char)}</span>`).join("")}</span>
            <span class="order-number" aria-hidden="true">${selected >= 0 ? selected + 1 : ""}</span>
            <span class="task-copy"><strong class="task-title">${esc(t.title)}</strong>${info ? `<small>${esc(info)}</small>` : ""}</span>
          </button>${estimate}
        </article>`;
      }
      const edit = !sortIds && canEdit && !overdue ? taskIcon("edit", t.title) : "";
      const actions = sortIds && !overdue ? "" : `${movable ? overdue ? `<input type="date" aria-label="${esc(t.title)}改期日期" value="${host.date()}"><button class="text-button bordered" data-holiday-action="move">安排补做</button>` : moveControl(ref) : ""}${canEdit && !overdue ? `<div class="holiday-edit-actions">${taskIcon("delete", t.title)}</div>` : ""}`;
      return `<article class="holiday-task-row" data-subject="${esc(t.subject)}" data-holiday-task="${esc(t.id)}" data-holiday-date="${ref.date}"><span class="holiday-subject">${esc(t.subject)}</span><div class="holiday-task-copy"><div class="holiday-task-title"><strong>${esc(t.title)}</strong>${edit}</div><small>${esc(info)}</small></div>${estimate}<div class="holiday-task-actions">${actions}</div></article>`;
    }
    function renderDaySummary(list) {
      e.holidayDaySummary.textContent = `${list.length} 项 · 预计 ${list.reduce((n, t) => n + Number(t.estimatedMinutes || 15), 0)} 分钟`;
    }
    function dayNumber(n) {
      const digits = "零一二三四五六七八九";
      if (n < 10) return digits[n];
      if (n < 100) return (n >= 20 ? digits[Math.floor(n / 10)] : "") + "十" + (n % 10 ? digits[n % 10] : "");
      const rest = n % 100;
      return digits[Math.floor(n / 100)] + "百" + (rest ? (rest < 10 ? "零" : rest < 20 ? "一" : "") + dayNumber(rest) : "");
    }
    function holidayDays(h) {
      if (!h) return [];
      const days = H.days(h.planDate, h.end), startIndex = days.indexOf(h.start);
      return days.map((date, index) => {
        const ordinal = index >= startIndex ? `第${dayNumber(index - startIndex + 1)}天` : index === 0 ? "安排日" : `假期前${dayNumber(startIndex - index)}天`;
        const today = date === host.today(), label = today ? "今天" : ordinal;
        const detail = `${today ? ordinal + " · " : ""}${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`;
        return { date, ordinal, today, label, detail };
      });
    }
    function renderDays(revealDay) {
      const strip = e.holidayShortDays, scrollLeft = strip.scrollLeft;
      const focusedDate = strip.contains(document.activeElement) ? document.activeElement.dataset.holidayView : null;
      strip.innerHTML = holidayDays(currentHoliday()).map(({ date, ordinal, today, label, detail }) => {
        const count = H.tasks(state(), date).length;
        return `<button class="text-button bordered" type="button" data-holiday-view="${date}" aria-pressed="${date === viewDate}" aria-label="${label}，${count}项作业，${today ? ordinal + "，" : ""}${date}"><span class="holiday-day-heading"><strong>${label}</strong><span class="holiday-day-count">${count}项</span></span><small>${detail}</small></button>`;
      }).join("");
      strip.scrollLeft = scrollLeft;
      if (focusedDate) strip.querySelector(`[data-holiday-view="${focusedDate}"]`)?.focus({ preventScroll: true });
      if (revealDay) {
        const active = strip.querySelector('[aria-pressed="true"]');
        if (!active) return;
        const bounds = strip.getBoundingClientRect(), chip = active.getBoundingClientRect();
        if (chip.left < bounds.left) strip.scrollLeft += chip.left - bounds.left;
        else if (chip.right > bounds.right) strip.scrollLeft += chip.right - bounds.right;
      }
    }
    function renderPlan(revealDay = false) {
      const h = currentHoliday(); if (!h) return;
      const date = viewDate, list = H.tasks(state(), date);
      e.holidayPlanTitle.textContent = h.name;
      renderDaySummary(list);
      e.holidaySort.textContent = sortIds ? `确定顺序 ${sortIds.length}/${list.filter(H.pending).length}` : "调整当天顺序";
      e.holidaySort.disabled = !list.some(H.pending); e.holidaySortReset.hidden = !sortIds;
      renderDays(revealDay);
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
      if (!subjectOptions.hidden) { subjectMenu(false); e.holidaySubject.focus(); return true; }
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
        if (action === "pick") {
          if (!sortIds || !H.pending(ref.task) || ref.date !== viewDate || sortIds.includes(ref.task.id)) return;
          const focused = document.activeElement === button, scrollTop = e.holidayTaskList.scrollTop;
          sortIds.push(ref.task.id); renderPlan();
          e.holidayTaskList.scrollTop = scrollTop;
          if (focused) [...e.holidayTaskList.querySelectorAll('button[data-holiday-action="pick"]')]
            .find(item => item.closest('[data-holiday-task]').dataset.holidayTask === ref.task.id)?.focus({ preventScroll: true });
          return;
        }
        if (action === "edit") {
          editRef = ref; e.holidayEditContent.value = ref.task.title; e.holidayEditMinutes.value = String(ref.task.estimatedMinutes || 15);
          e.holidayEditSeriesLabel.hidden = !ref.task.holidaySeriesId; e.holidayEditSeries.checked = Boolean(ref.task.holidaySeriesId);
          e.holidayTaskEdit.hidden = false; document.body.classList.add("modal-open"); e.holidayEditContent.focus(); return;
        }
        if (action === "delete") { if (!window.confirm("只删除当天这一项作业，确定吗？")) return; H.removeTask(state(), ref); }
        if (action === "move") {
          const date = r.querySelector("input[type=date]").value;
          if (date < host.date()) throw Error("补做或改期请选择当前查看日期或之后的日期");
          if (date === ref.date) return;
          H.move(state(), ref, date);
          save(); renderPlan(); host.toast("计划已更新"); return;
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
    e.holidayShortDays.addEventListener("click", event => {
      const b = event.target.closest("[data-holiday-view]"), h = currentHoliday(), date = b?.dataset.holidayView;
      if (!h || !H.iso(date) || date < h.planDate || date > h.end || date === viewDate) return;
      viewDate = date; sortIds = null; renderPlan(true);
    });
    e.holidayRepeat.addEventListener("change", () => { e.holidayRepeatDates.hidden = e.holidayRepeat.value !== "daily"; });
    e.holidaySubject.addEventListener("click", () => subjectMenu(subjectOptions.hidden));
    subjectOptions.addEventListener("click", event => {
      const button = event.target.closest("button[data-subject]"); if (!button) return;
      e.holidaySubject.value = button.dataset.subject; e.holidaySubject.dataset.subject = button.dataset.subject; subjectLabel.textContent = button.dataset.subject;
      subjectOptions.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(b === button)));
      subjectMenu(false); renderKeywords(); e.holidayTaskTitle.focus({ preventScroll: true });
    });
    document.addEventListener("click", event => { if (!subjectPicker.contains(event.target)) subjectMenu(false); });
    subjectOptions.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const buttons = [...subjectOptions.querySelectorAll("button")], i = buttons.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (i + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      event.preventDefault(); buttons[next].focus();
    });
    e.holidayTaskTitle.addEventListener("input", resizeDraft);
    e.holidayTaskTitle.addEventListener("keydown", event => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      event.preventDefault(); e.holidayTaskForm.requestSubmit();
    });
    keywordSuggestions.addEventListener("click", event => {
      const button = event.target.closest("[data-holiday-keyword]"); if (!button) return;
      const current = e.holidayTaskTitle.value.trim();
      e.holidayTaskTitle.value = (current ? current + " " : "") + button.dataset.holidayKeyword;
      resizeDraft();
      e.holidayTaskTitle.focus({ preventScroll: true }); e.holidayTaskTitle.setSelectionRange(e.holidayTaskTitle.value.length, e.holidayTaskTitle.value.length);
    });
    e.holidayTaskForm.addEventListener("pointerdown", event => {
      if (document.activeElement === e.holidayTaskTitle && event.target.closest("button")) event.preventDefault();
    });
    e.holidayTaskForm.addEventListener("submit", event => { event.preventDefault(); attempt(() => {
      if (!ready()) throw Error("请先核对假期作业");
      const repeat = e.holidayRepeat.value === "daily";
      const dates = repeat ? [...e.holidayRepeatDateList.querySelectorAll("input:checked")].map(i => i.dataset.holidayRepeatDate) : [viewDate];
      H.add(state(), currentHoliday(), { subject: e.holidaySubject.value, title: e.holidayTaskTitle.value, minutes: 15, repeat }, dates);
      e.holidayTaskTitle.value = ""; resizeDraft(); save(); renderPlan(); e.holidayTaskList.scrollTop = e.holidayTaskList.scrollHeight; e.holidayTaskTitle.focus({ preventScroll: true }); host.toast(`已安排 ${dates.length} 天`);
    }); });
    e.holidaySort.addEventListener("click", () => attempt(() => { if (sortIds) { H.order(state(), viewDate, sortIds); sortIds = null; save(); } else sortIds = []; renderPlan(); }));
    e.holidaySortReset.addEventListener("click", () => { sortIds = []; renderPlan(); });
    $("#holidayConfirm").addEventListener("click", () => attempt(() => {
      if (!ready()) throw Error("请先核对假期作业");
      if (e.holidayTaskTitle.value.trim()) throw Error("还有未添加的作业，请先点加号");
      if (sortIds) H.order(state(), viewDate, sortIds);
      const firstConfirmation = !currentHoliday().confirmed && !fromSettings;
      H.confirm(state(), currentHoliday()); save(); back(); host.toast("假期计划已保存，每天按当天清单完成");
      if (firstConfirmation) host.confirmed();
    }));
    $("#holidayCheckLedger").addEventListener("click", () => { const date = currentHoliday().planDate; e.holidayPlanPage.hidden = true; host.back(false); host.goDate(date); });
    e.holidayTaskList.addEventListener("click", taskAction); e.holidayOverdueList.addEventListener("click", taskAction);
    e.holidayTaskList.addEventListener("change", event => {
      const select = event.target.closest("[data-holiday-move-date]"); if (!select) return;
      const row = select.closest("[data-holiday-task]");
      if (sortIds || row.dataset.holidayDate !== viewDate || select.value === row.dataset.holidayDate) return;
      const task = H.tasks(state(), viewDate).find(t => t.id === row.dataset.holidayTask); if (!task) return;
      attempt(() => {
        const date = select.value, target = holidayDays(currentHoliday()).find(day => day.date === date);
        try {
          if (!target) throw Error("请选择要改到的第几天");
          if (date < host.date()) throw Error("补做或改期请选择当前查看日期或之后的日期");
          H.move(state(), { date: viewDate, task }, date);
        } catch (error) {
          select.value = [...select.options].some(option => option.value === viewDate) ? viewDate : "";
          throw error;
        }
        const scrollTop = e.holidayTaskList.scrollTop;
        save(); renderPlan(); e.holidayTaskList.scrollTop = scrollTop; host.toast(`已改到${target.label}`);
      });
    });
    e.holidayTaskList.addEventListener("change", event => attempt(() => {
      const select = event.target.closest("select[data-holiday-estimate]");
      if (!sortIds || !select || !host.estimates.includes(Number(select.value))) return;
      const row = select.closest("[data-holiday-task]"), date = row.dataset.holidayDate;
      if (date !== viewDate) return;
      const task = H.tasks(state(), date).find(t => t.id === select.dataset.holidayEstimate);
      if (!task || !H.pending(task)) return;
      H.edit(state(), { date, task }, task.title, Number(select.value), false, host.today());
      save(); renderDaySummary(H.tasks(state(), date));
    }));
    $("#holidayEditCancel").addEventListener("click", closeEdit);
    $("#holidayTaskEditForm").addEventListener("submit", event => { event.preventDefault(); attempt(() => { if (!editRef) return; H.edit(state(), editRef, e.holidayEditContent.value, Number(e.holidayEditMinutes.value), !e.holidayEditSeriesLabel.hidden && e.holidayEditSeries.checked, host.today()); closeEdit(); save(); renderPlan(); }); });
    return { renderHome, back, openPlan, resize, hide() { subjectMenu(false); if (!e.holidayPlanPage.hidden) document.body.classList.remove("task-entry-page-open"); e.holidaySettingsPage.hidden = true; e.holidayPlanPage.hidden = true; closeEdit(); }, isOpen: () => !e.holidayPlanPage.hidden || !e.holidaySettingsPage.hidden };
  };
})(globalThis);
