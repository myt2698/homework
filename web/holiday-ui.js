(function (root) {
  "use strict";
  root.mountHolidayUI = function (host) {
    const H = root.HolidayPlans, $ = s => document.querySelector(s), state = host.getState;
    const e = Object.fromEntries(["holidaySettingsPage", "holidaySettingsList", "holidayConfigForm", "holidayConfigTitle", "holidayName", "holidayStart", "holidayEnd", "holidayPlanDate", "holidayConfigCancel", "holidayPlanPage", "holidayPlanTitle", "holidayDaySummary", "holidaySort", "holidaySortReset", "holidayShortDays", "holidayTaskList", "holidayTaskForm", "holidayRepeat", "holidayRepeatDates", "holidayRepeatDateList", "holidaySubject", "holidayTaskTitle", "holidayPlanEntry", "holidayOverdue", "holidayOverdueSummary", "holidayOverdueList", "holidayLedgerHint", "holidayLedgerText", "holidayTaskEdit", "holidayEditContent", "holidayEditMinutes", "holidayEditSeries", "holidayEditSeriesLabel"].map(id => [id, $("#" + id)]));
    let configId = null, planId = null, viewDate = null, fromSettings = false, sortIds = null, editRef = null;
    const exportDialog = $("#planExportDialog"), exportScope = $("#planExportScope"), exportStatus = $("#planExportStatus");
    let exportBusy = false;
    function exportDates() {
      const h = currentHoliday();
      return exportScope.value === "range" ? H.days(h.planDate, h.end) : [viewDate];
    }
    function exportSummary() {
      const dates = exportDates(), days = root.PlanExport.snapshot(state(), dates);
      const count = days.reduce((n, day) => n + day.tasks.length, 0);
      $("#planExportSummary").textContent = `${dates[0]}${dates.length > 1 ? ` 至 ${dates[dates.length - 1]}` : ""} · ${dates.length} 天 · ${count} 项作业`;
      exportStatus.textContent = "";
    }
    $("#planExportOpen").addEventListener("click", () => {
      if (e.holidayTaskTitle.value.trim()) { host.toast("还有未添加的作业，请先点加号"); return; }
      if (sortIds) { host.toast("请先确定当天顺序，再下载或打印"); return; }
      exportScope.value = "day";
      exportScope.options[1].disabled = currentHoliday().planDate === currentHoliday().end;
      exportSummary(); exportDialog.showModal();
    });
    exportScope.addEventListener("change", exportSummary);
    $("#planExportClose").addEventListener("click", () => exportDialog.close());
    exportDialog.addEventListener("cancel", event => { if (exportBusy) event.preventDefault(); });
    exportDialog.addEventListener("close", () => $("#planExportOpen").focus({ preventScroll: true }));
    async function exportPlan(mode) {
      if (exportBusy) return;
      const days = root.PlanExport.snapshot(state(), exportDates());
      exportBusy = true; exportDialog.setAttribute("aria-busy", "true");
      exportDialog.querySelectorAll("button, select").forEach(control => { control.disabled = true; });
      exportStatus.textContent = "正在准备计划…";
      try {
        await root.PlanExport[mode](days, (n, total) => { exportStatus.textContent = `正在准备第 ${n} / ${total} 页…`; });
        exportStatus.textContent = mode === "download" ? "PDF 已生成，请在浏览器下载记录中查看。" : "已打开打印窗口，也可以选择另存为 PDF。";
      } catch (error) {
        console.error("Plan export failed", error);
        exportStatus.textContent = "生成失败，请重试；也可下载 PDF 后再打印。";
      } finally {
        exportBusy = false; exportDialog.removeAttribute("aria-busy");
        exportDialog.querySelectorAll("button, select").forEach(control => { control.disabled = false; });
      }
    }
    $("#planExportDownload").addEventListener("click", () => exportPlan("download"));
    $("#planExportPrint").addEventListener("click", () => exportPlan("print"));
    const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const attempt = action => {
      const snapshot = JSON.stringify(state()), oldDate = viewDate, oldSort = sortIds && [...sortIds];
      try { action(); } catch (error) {
        if (error.planSaveFailed) {
          host.restore(JSON.parse(snapshot));
          viewDate = oldDate; sortIds = oldSort; repeatDates();
          if (editRef) editRef.task = H.tasks(state(), editRef.date).find(t => t.id === editRef.task.id);
          renderPlan(); renderHome();
        }
        host.toast(error.planSaveFailed ? "保存失败，请检查本机存储空间后重试" : error.message);
      }
    };
    const save = () => { try { host.persist(); } catch (error) { error.planSaveFailed = true; throw error; } host.render(); };
    const currentHoliday = () => state().holidays?.[planId];
    const ready = () => true;
    const minutesOptions = host.estimates.map(n => `<option value="${n}">${n} 分钟</option>`).join("");
    e.holidayEditMinutes.innerHTML = minutesOptions;
    const taskMinutes = $("#holidayTaskMinutes");
    taskMinutes.innerHTML = minutesOptions;
    const keywordSuggestions = $("#holidayKeywordSuggestions");
    const subjectPicker = $("#holidaySubjectPicker"), subjectOptions = $("#holidaySubjectOptions"), subjectLabel = $("#holidaySubjectLabel");
    function subjectMenu(open) { subjectOptions.hidden = !open; e.holidaySubject.setAttribute("aria-expanded", String(open)); }
    function resizeDraft() { e.holidayTaskTitle.style.height = "48px"; e.holidayTaskTitle.style.height = `${Math.max(48, Math.min(e.holidayTaskTitle.scrollHeight + 2, 72))}px`; }
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
      e.holidayRepeat.value = "once"; e.holidayRepeatDates.hidden = true; e.holidayTaskTitle.value = ""; taskMinutes.value = "15"; repeatDates();
      host.open(e.holidayPlanPage); renderPlan(true); renderKeywords(); resize(); resizeDraft();
    }
    function openCurrent() { const h = H.ensure(state(), host.date()); save(); openPlan(h.id); }
    function taskIcon(action, title) {
      const label = action === "edit" ? `修改${title}` : `删除${title}（仅当天）`;
      const path = action === "edit" ? '<path d="m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5 M4 15l5 5"/>' : '<path d="M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7"/>';
      return `<button class="text-button holiday-task-icon${action === "delete" ? " danger" : ""}" type="button" data-holiday-action="${action}" aria-label="${esc(label)}" title="${esc(label)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></button>`;
    }
    function moveControl(ref) {
      const choices = holidayDays(currentHoliday()).filter(day => day.date >= host.today());
      const hasCurrent = choices.some(day => day.date === ref.date);
      return choices.length > 1 || !hasCurrent ? `<div class="holiday-move-controls"><select class="holiday-move-day" data-holiday-move-date aria-label="${esc(ref.task.title)}改到第几天"${choices.length ? "" : " disabled"}><option value="" disabled${hasCurrent ? "" : " selected"}>${choices.length ? "选择第几天" : "计划已结束"}</option>${choices.map(day => `<option value="${day.date}"${day.date === ref.date ? " selected" : ""}>${day.label}</option>`).join("")}</select></div>` : "";
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
      const actions = sortIds && !overdue ? "" : `${movable ? overdue ? `<button class="text-button bordered" data-holiday-action="move">移到今天</button>` : moveControl(ref) : ""}${!overdue ? `<span class="plan-task-estimate">${t.estimatedMinutes} 分钟</span>` : ""}${canEdit && !overdue ? `<div class="holiday-edit-actions">${taskIcon("delete", t.title)}</div>` : ""}`;
      return `<article class="holiday-task-row" data-subject="${esc(t.subject)}" data-holiday-task="${esc(t.id)}" data-holiday-date="${ref.date}"><span class="holiday-subject">${esc(t.subject)}</span><div class="holiday-task-copy"><div class="holiday-task-title"><strong>${esc(t.title)}</strong>${edit}</div><small>${esc(info)}</small></div>${estimate}<div class="holiday-task-actions">${actions}</div></article>`;
    }
    function renderDaySummary(list) {
      const dateLabel = `${Number(viewDate.slice(5, 7))}月${Number(viewDate.slice(8))}日`;
      e.holidayDaySummary.innerHTML = `<span>${list.length} 项 · 预计 ${list.reduce((n, t) => n + Number(t.estimatedMinutes || 15), 0)} 分钟</span><time class="holiday-summary-date" datetime="${viewDate}">${dateLabel}</time>`;
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
      const days = H.days(h.planDate, h.end);
      return days.map((date, index) => {
        const ordinal = `第${dayNumber(index + 1)}天`;
        const today = date === host.today(), label = today ? "今天" : date === H.plus(host.today(), 1) ? "明天" : ordinal;
        const detail = `${Number(date.slice(5, 7))}月${Number(date.slice(8))}日`;
        return { date, ordinal, today, label, detail };
      });
    }
    function renderDays(revealDay) {
      const strip = e.holidayShortDays, scrollLeft = strip.scrollLeft;
      const focusedDate = strip.contains(document.activeElement) ? document.activeElement.dataset.holidayView : null;
      strip.innerHTML = holidayDays(currentHoliday()).map(({ date, today, detail }) => {
        const count = H.tasks(state(), date).length;
        const weekday = `周${"日一二三四五六"[new Date(`${date}T12:00:00`).getDay()]}`;
        return `<button class="text-button bordered" type="button" data-holiday-view="${date}" aria-pressed="${date === viewDate}" aria-label="${weekday}，${count}项作业，${today ? "今天，" : ""}${date}"><span class="holiday-day-heading"><strong>${weekday}</strong><span class="holiday-day-count">/${count}项</span></span><time class="holiday-day-date" datetime="${date}">${detail}</time></button>`;
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
      e.holidayPlanTitle.textContent = "作业计划";
      const count = H.days(h.planDate, h.end).length;
      $("#planRangeSummary").textContent = count === 1 ? (h.planDate === host.today() ? "只安排今天" : "只安排这一天") : `安排 ${count} 天`;
      $("#planRangeStart").textContent = h.planDate === host.today() ? "从今天起" : `${Number(h.planDate.slice(5, 7))}/${Number(h.planDate.slice(8))}起`;
      renderDaySummary(list);
      e.holidaySort.textContent = sortIds ? `确定顺序 ${sortIds.length}/${list.filter(H.pending).length}` : "调整当天顺序";
      e.holidaySort.disabled = !list.some(H.pending); e.holidaySortReset.hidden = !sortIds;
      $("#holidaySortUndo").hidden = !sortIds; $("#holidaySortUndo").disabled = !sortIds?.length;
      renderDays(revealDay);
      e.holidayTaskList.innerHTML = list.length ? list.map(task => row({ date, task })).join("") : '<div class="keyword-settings-empty">这一天还没有安排作业</div>';
      e.holidayTaskForm.hidden = Boolean(sortIds) || !ready();
      e.holidayLedgerHint.hidden = ready(); e.holidayLedgerText.textContent = `先在 ${h.planDate} 核对钉钉，补全成长记录册。`;
    }
    function renderHome() {
      e.holidayPlanEntry.hidden = false;
      e.holidayPlanEntry.innerHTML = `<span>作业计划 <small>安排今天，也可以安排后面几天</small></span><span aria-hidden="true">›</span>`;
      const overdue = H.refs(state()).filter(r => r.date < host.date() && r.task.status !== "done");
      e.holidayOverdue.hidden = !overdue.length;
      e.holidayOverdueSummary.textContent = `之前未完成 · ${overdue.length} 项`;
      e.holidayOverdueList.innerHTML = overdue.map(ref => row(ref, true)).join("");
    }
    function back() {
      if (exportDialog.open) { if (!exportBusy) exportDialog.close(); return true; }
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
          const date = host.today();
          if (date === ref.date) return;
          H.move(state(), ref, date);
          save(); renderPlan(); host.toast("计划已更新"); return;
        }
        save(); renderPlan(); host.toast("计划已更新");
      });
    }
    $("#openHolidaySettingsButton").hidden = true;
    $("#planRangeOptions").addEventListener("toggle", () => {
      if ($("#planRangeOptions").open && currentHoliday()) {
        $("#planDayCount").value = H.days(currentHoliday().planDate, currentHoliday().end).length;
        updateRangeStepper();
      }
    });
    document.addEventListener("click", event => {
      const options = $("#planRangeOptions");
      if (options.open && !options.contains(event.target)) options.open = false;
    });
    $("#planRangeOptions").addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation();
        $("#planRangeOptions").open = false; $("#planRangeSummary").focus();
      }
    });
    function applyRange(count) {
      attempt(() => {
        H.setRange(state(), currentHoliday(), count);
        if (viewDate > currentHoliday().end) viewDate = currentHoliday().planDate;
        sortIds = null; repeatDates(); save(); renderPlan(true); $("#planRangeOptions").open = false;
        host.toast("安排天数已更新，已有作业都保留");
      });
    }
    function updateRangeStepper() {
      const count = Number($("#planDayCount").value);
      $("#planDayDecrease").disabled = count <= 1;
      $("#planDayIncrease").disabled = count >= 366;
    }
    function stepRange(delta) {
      const input = $("#planDayCount"), count = Number(input.value);
      input.value = Math.min(366, Math.max(1, (Number.isFinite(count) ? Math.round(count) : 1) + delta));
      updateRangeStepper();
    }
    function submitRange() {
      if ($("#planDayCount").reportValidity() && $("#planDayCount").value !== "") applyRange(Number($("#planDayCount").value));
    }
    $("#planDayDecrease").addEventListener("click", () => stepRange(-1));
    $("#planDayIncrease").addEventListener("click", () => stepRange(1));
    $("#planDayCount").addEventListener("input", updateRangeStepper);
    $("#planDayCount").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); submitRange(); } });
    $("#planApplyRange").addEventListener("click", submitRange);
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
    e.holidayPlanEntry.addEventListener("click", () => attempt(openCurrent));
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
      const drafts = host.parseDraft(e.holidayTaskTitle.value.trim(), e.holidaySubject.value);
      if (!drafts.length) throw Error("请填写作业内容");
      drafts.forEach(draft => H.add(state(), currentHoliday(), { ...draft, minutes: Number(taskMinutes.value), repeat }, dates));
      save(); e.holidayTaskTitle.value = ""; resizeDraft(); renderPlan(); e.holidayTaskList.scrollTop = e.holidayTaskList.scrollHeight; e.holidayTaskTitle.focus({ preventScroll: true }); host.toast(`已安排 ${dates.length} 天`);
    }); });
    e.holidaySort.addEventListener("click", () => attempt(() => { if (sortIds) { H.order(state(), viewDate, sortIds); sortIds = null; save(); } else sortIds = []; renderPlan(); }));
    e.holidaySortReset.addEventListener("click", () => { sortIds = []; renderPlan(); });
    $("#holidaySortUndo").addEventListener("click", () => { if (sortIds?.length) { sortIds.pop(); renderPlan(); } });
    $("#holidayConfirm").addEventListener("click", () => attempt(() => {
      if (!ready()) throw Error("请先核对假期作业");
      if (e.holidayTaskTitle.value.trim()) throw Error("还有未添加的作业，请先点加号");
      if (sortIds) H.order(state(), viewDate, sortIds);
      const firstConfirmation = !currentHoliday().confirmed && !fromSettings;
      H.confirm(state(), currentHoliday()); save(); back(); host.toast("作业计划已保存，每天按当天清单完成");
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
          if (date < host.today()) throw Error("补做或改期请选择今天或之后的日期");
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
    $("#holidayTaskEditForm").addEventListener("submit", event => { event.preventDefault(); attempt(() => { if (!editRef) return; H.edit(state(), editRef, e.holidayEditContent.value, Number(e.holidayEditMinutes.value), !e.holidayEditSeriesLabel.hidden && e.holidayEditSeries.checked, host.today()); save(); closeEdit(); renderPlan(); }); });
    return { renderHome, back, openPlan, openCurrent, resize, hide() { subjectMenu(false); if (!e.holidayPlanPage.hidden) document.body.classList.remove("task-entry-page-open"); e.holidaySettingsPage.hidden = true; e.holidayPlanPage.hidden = true; closeEdit(); }, isOpen: () => !e.holidayPlanPage.hidden || !e.holidaySettingsPage.hidden };
  };
})(globalThis);
