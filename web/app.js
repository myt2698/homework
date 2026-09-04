(() => {
  "use strict";

  const STORAGE_KEY = "homework-ledger-v1";
  const RULES = {
    best: { label: "8:30 及以前", amount: 1.5 },
    good: { label: "8:30 后至 8:40", amount: 1 },
    neutral: { label: "8:40 后至 9:30", amount: 0 },
    late: { label: "9:30 以后", amount: -0.5 }
  };
  const TIME_FIELDS = ["startTime", "dinnerTime", "resumeTime", "finishTime"];
  const SPORTS = ["跳绳", "仰卧起坐", "50米跑", "踢毽子", "坐位体前屈"];
  const $ = (selector) => document.querySelector(selector);
  const todayIso = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  };
  const currentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };
  const defaultState = () => ({ startDate: todayIso(), records: {}, weekends: {} });

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== "object") return defaultState();
      const parsedStart = /^\d{4}-\d{2}-\d{2}$/.test(parsed.startDate) ? parsed.startDate : todayIso();
      return {
        startDate: parsedStart > todayIso() ? todayIso() : parsedStart,
        records: parsed.records && typeof parsed.records === "object" ? parsed.records : {},
        weekends: parsed.weekends && typeof parsed.weekends === "object" ? parsed.weekends : {}
      };
    } catch (_) {
      return defaultState();
    }
  }

  let state = loadState();
  let toastTimer = null;
  const elements = {
    settingsButton: $("#settingsButton"), settingsPanel: $("#settingsPanel"),
    startDate: $("#startDate"), saveSettingsButton: $("#saveSettingsButton"),
    recordDate: $("#recordDate"), todayButton: $("#todayButton"), viewModeLabel: $("#viewModeLabel"),
    recordHeading: $("#recordHeading"),
    weekendTaskPlanner: $("#weekendTaskPlanner"), weekendPlannerKicker: $("#weekendPlannerKicker"),
    weekendPlannerTitle: $("#weekendPlannerTitle"), weekendPlannerHelp: $("#weekendPlannerHelp"),
    weekendTaskPlanList: $("#weekendTaskPlanList"), weekendPlanSummary: $("#weekendPlanSummary"),
    weekendPlanHint: $("#weekendPlanHint"), saveWeekendTaskPlanButton: $("#saveWeekendTaskPlanButton"),
    weekendPenaltyButton: $("#weekendPenaltyButton"), weekendResult: $("#weekendResult"),
    weekendResultLabel: $("#weekendResultLabel"), weekendResultAmount: $("#weekendResultAmount"),
    sportCard: $("#sportCard"), sportStatus: $("#sportStatus"), sportOptions: $("#sportOptions"),
    readingButton: $("#readingButton"), readingStatus: $("#readingStatus"),
    choresButton: $("#choresButton"), choresStatus: $("#choresStatus"),
    ledgerButton: $("#ledgerButton"), ledgerStatus: $("#ledgerStatus"),
    taskEntry: $("#taskEntry"), subjectTabs: $("#subjectTabs"),
    voiceTaskButton: $("#voiceTaskButton"), voiceStatus: $("#voiceStatus"),
    taskDraft: $("#taskDraft"), addTasksButton: $("#addTasksButton"),
    clearTaskDraftButton: $("#clearTaskDraftButton"), taskSummary: $("#taskSummary"),
    taskPanelTitle: $("#taskPanelTitle"), taskPanelHelp: $("#taskPanelHelp"),
    taskOrderButton: $("#taskOrderButton"),
    activeTaskBanner: $("#activeTaskBanner"), activeTaskTitle: $("#activeTaskTitle"),
    activeTaskTime: $("#activeTaskTime"), taskList: $("#taskList"),
    emptyTaskList: $("#emptyTaskList"), taskConfirmHint: $("#taskConfirmHint"),
    confirmTaskListButton: $("#confirmTaskListButton"), dayResult: $("#dayResult"),
    focusModal: $("#focusModal"), focusCloseButton: $("#focusCloseButton"),
    focusModalSubject: $("#focusModalSubject"), focusModalTitle: $("#focusModalTitle"),
    focusModalElapsed: $("#focusModalElapsed"), focusModalStartedAt: $("#focusModalStartedAt"),
    focusPauseButton: $("#focusPauseButton"), focusCompleteButton: $("#focusCompleteButton"),
    resultLabel: $("#resultLabel"), resultAmount: $("#resultAmount"),
    resetDayButton: $("#resetDayButton"), historyList: $("#historyList"),
    emptyState: $("#emptyState"), balance: $("#balance"), periodLabel: $("#periodLabel"),
    recordDays: $("#recordDays"), rewardDays: $("#rewardDays"),
    deductionTotal: $("#deductionTotal"), toast: $("#toast")
  };

  let speechRecognition = null;
  let speechListening = false;
  let selectedTaskSubject = "语文";
  let focusModalTaskId = null;
  let taskListExpanded = false;
  let completedTasksExpanded = false;
  let draggingTaskId = null;

  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function recordFor(date, create = false) {
    const existing = state.records[date];
    if (existing && typeof existing === "object") return existing;
    if (!create) return null;
    state.records[date] = {};
    return state.records[date];
  }

  function currentRecord(create = false) { return recordFor(elements.recordDate.value, create); }
  function parseIsoDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  function isoFromDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function addDays(value, count) {
    const date = parseIsoDate(value);
    date.setDate(date.getDate() + count);
    return isoFromDate(date);
  }
  function weekendKeyFor(date) {
    const day = parseIsoDate(date).getDay();
    if (day === 5) return date;
    if (day === 6) return addDays(date, -1);
    if (day === 0) return addDays(date, -2);
    return null;
  }
  function weekendForDate(date, create = false) {
    const key = weekendKeyFor(date);
    if (!key) return null;
    const existing = state.weekends[key];
    if (existing && typeof existing === "object") return existing;
    if (!create) return null;
    state.weekends[key] = {};
    return state.weekends[key];
  }
  function isWeekendMeaningful(record) {
    return Boolean(record && (record.confirmed || record.dailySeparated || record.specialSeparated
      || record.planSaved || record.fridayDone || record.saturdayMorningDone
      || record.allDoneDate || record.penaltyConfirmed || (Array.isArray(record.tasks) && record.tasks.length)));
  }
  function includeDailyInLedger(date, record) {
    const key = weekendKeyFor(date);
    if (!key) return true;
    return Boolean(record?.ruleId && !isWeekendMeaningful(state.weekends[key]));
  }
  function isMeaningful(record) {
    return Boolean(record && (record.ropeDone || (Array.isArray(record.sportActivities) && record.sportActivities.length)
      || record.ledgerConfirmed || record.readingDone || record.choresDone || record.note || record.ruleId
      || record.tasksConfirmed || (Array.isArray(record.tasks) && record.tasks.length)
      || TIME_FIELDS.some((field) => record[field])));
  }

  function sportsForRecord(record) {
    if (Array.isArray(record?.sportActivities)) return record.sportActivities.filter((item) => SPORTS.includes(item));
    return record?.ropeDone ? ["跳绳"] : [];
  }
  function cleanupCurrentRecord() {
    const date = elements.recordDate.value;
    if (!isMeaningful(state.records[date])) delete state.records[date];
  }

  function cleanupWeekend(date = elements.recordDate.value) {
    const key = weekendKeyFor(date);
    if (key && !isWeekendMeaningful(state.weekends[key])) delete state.weekends[key];
  }

  function taskOwnerForDate(date = elements.recordDate.value, create = false) {
    return weekendKeyFor(date) ? weekendForDate(date, create) : recordFor(date, create);
  }
  function tasksForDate(date = elements.recordDate.value) {
    const tasks = taskOwnerForDate(date)?.tasks;
    return Array.isArray(tasks) ? tasks : [];
  }
  function taskListConfirmed(date = elements.recordDate.value) {
    const owner = taskOwnerForDate(date);
    return Boolean(owner && (weekendKeyFor(date) ? owner.confirmed : owner.tasksConfirmed));
  }
  function taskOrderSaved(date = elements.recordDate.value) {
    const owner = taskOwnerForDate(date);
    const tasks = tasksForDate(date);
    return Boolean(owner?.orderSaved || tasks.some((task) => (task.status || "pending") !== "pending"));
  }
  function activeTaskForDate(date = elements.recordDate.value) {
    return tasksForDate(date).find((task) => task.status === "active") || null;
  }
  function allTasksDone(date = elements.recordDate.value) {
    const tasks = tasksForDate(date);
    return tasks.length > 0 && tasks.every((task) => task.status === "done");
  }
  function plannedDayForTask(task) {
    return task?.plannedDay === "sunday" ? "sunday" : "saturday";
  }
  function plannedDayLabel(task) {
    return plannedDayForTask(task) === "sunday" ? "周日" : "周六";
  }
  function plannedDateForTask(key, task) {
    return addDays(key, plannedDayForTask(task) === "sunday" ? 2 : 1);
  }
  function taskElapsedMs(task, live = true) {
    const saved = Number(task?.elapsedMs || 0);
    return saved + (live && task?.status === "active" && Number(task.activeSince)
      ? Math.max(0, Date.now() - Number(task.activeSince)) : 0);
  }
  function taskDurationLabel(task) {
    const seconds = Math.floor(taskElapsedMs(task) / 1000);
    if (seconds < 60) return `${seconds} 秒`;
    return `${Math.floor(seconds / 60)} 分 ${String(seconds % 60).padStart(2, "0")} 秒`;
  }
  function taskClockLabel(task) {
    const seconds = Math.floor(taskElapsedMs(task) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }
  function stopTaskClock(task, nextStatus) {
    if (task.status === "active" && Number(task.activeSince)) {
      task.elapsedMs = taskElapsedMs(task);
    }
    delete task.activeSince;
    task.status = nextStatus;
  }
  function taskById(id) {
    return tasksForDate().find((task) => String(task.id) === String(id));
  }

  function updateFocusModal() {
    if (!focusModalTaskId || elements.focusModal.hidden) return;
    const task = taskById(focusModalTaskId);
    if (!task || task.status !== "active") return closeFocusModal();
    elements.focusModalSubject.textContent = task.subject || "其他";
    elements.focusModalTitle.textContent = task.title || "当前作业";
    elements.focusModalElapsed.textContent = taskClockLabel(task);
    elements.focusModalStartedAt.textContent = task.startedAt || "--:--";
  }
  function openFocusModal(id) {
    focusModalTaskId = String(id);
    elements.focusModal.hidden = false;
    document.body.style.overflow = "hidden";
    updateFocusModal();
  }
  function closeFocusModal() {
    focusModalTaskId = null;
    elements.focusModal.hidden = true;
    document.body.style.overflow = "";
  }

  const SUBJECT_PATTERN = "语文|数学|英语|科学|道法|体育|音乐|美术|其他";
  function numberedTaskParts(value) {
    const marker = /(^|[\s；;])(?:（\s*(\d{1,2})\s*）|\(?(\d{1,2})\s*[.．、)])\s*/gm;
    const matches = [...value.matchAll(marker)].map((match) => ({
      index: match.index,
      end: match.index + match[0].length,
      number: Number(match[2] || match[3])
    }));
    const first = matches.findIndex((match) => match.number === 1);
    if (first < 0) return null;
    const sequence = [matches[first]];
    for (let index = first + 1; index < matches.length; index += 1) {
      if (matches[index].number !== sequence.length + 1) break;
      sequence.push(matches[index]);
    }
    return sequence.map((match, index) => value
      .slice(match.end, index + 1 < sequence.length ? sequence[index + 1].index : value.length)
      .trim()).filter(Boolean);
  }
  function parseTaskDraft(value, defaultSubject = selectedTaskSubject) {
    const numbered = numberedTaskParts(value);
    const normalized = numbered ? null : value
      .replace(new RegExp(`(${SUBJECT_PATTERN})(?:作业)?`, "g"), "\n$1：")
      .replace(/[，,](?=\s*(?:语文|数学|英语|科学|道法|体育|音乐|美术|其他))/g, "\n");
    const parts = numbered || normalized.split(/[\n；;]+/);
    let currentSubject = defaultSubject;
    return parts.map((part) => part.trim().replace(/[，,\s]+$/, "")).filter(Boolean).map((part) => {
      const match = part.match(new RegExp(`^(${SUBJECT_PATTERN})[\\s：:、，,-]*(.*)$`));
      if (match) {
        currentSubject = match[1];
        return { subject: currentSubject, title: match[2].trim() };
      }
      return { subject: currentSubject, title: part };
    }).filter((task) => task.title);
  }

  function timeMinutes(time) {
    if (!/^\d{2}:\d{2}$/.test(time || "")) return null;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
  function segmentMinutes(from, to) {
    const start = timeMinutes(from);
    const end = timeMinutes(to);
    if (start === null || end === null) return 0;
    return end >= start ? end - start : end + 1440 - start;
  }
  function focusDuration(record, includeLive = false) {
    if (Array.isArray(record?.tasks) && record.tasks.length) {
      const totalMs = record.tasks.reduce((sum, task) => sum + taskElapsedMs(task, includeLive), 0);
      return Math.floor(totalMs / 60000);
    }
    if (!record?.startTime) return 0;
    const end = record.finishTime || (includeLive ? currentTime() : null);
    if (record.dinnerTime) {
      const first = segmentMinutes(record.startTime, record.dinnerTime);
      const secondEnd = record.finishTime || (includeLive ? currentTime() : null);
      const second = record.resumeTime && secondEnd ? segmentMinutes(record.resumeTime, secondEnd) : 0;
      return first + second;
    }
    return end ? segmentMinutes(record.startTime, end) : 0;
  }
  function ruleForFinish(time) {
    const value = timeMinutes(time);
    if (value === null) return null;
    if (value <= 20 * 60 + 30) return { id: "best", ...RULES.best };
    if (value <= 20 * 60 + 40) return { id: "good", ...RULES.good };
    if (value <= 21 * 60 + 30) return { id: "neutral", ...RULES.neutral };
    return { id: "late", ...RULES.late };
  }
  function resultFor(record) {
    if (record?.finishTime) return ruleForFinish(record.finishTime);
    if (record?.ruleId && RULES[record.ruleId]) return { id: record.ruleId, ...RULES[record.ruleId] };
    return null;
  }
  function weekendResultFor(key, weekend) {
    if (!weekend) return null;
    const tasks = Array.isArray(weekend.tasks) ? weekend.tasks : [];
    const orderReady = Boolean(weekend.orderSaved
      || tasks.some((task) => (task.status || "pending") !== "pending"));
    const planningPart = weekend.planSaved && orderReady ? 0.5 : 0;
    if (weekend.penaltyConfirmed && !weekend.allDoneDate) {
      return { label: "周日结束仍未完成", amount: planningPart - 0.5 };
    }
    if (!weekend.allDoneDate) return null;
    const followedPlan = tasks.length
      ? tasks.every((task) => task.status === "done" && (task.completedDate || weekend.allDoneDate) <= plannedDateForTask(key, task))
      : weekend.allDoneDate <= addDays(key, 1);
    return {
      label: followedPlan ? "按周五计划完成" : "全部完成，但晚于计划",
      amount: planningPart + (followedPlan ? 1 : 0.5)
    };
  }
  function weekendActualMinutes(key) {
    const weekendTasks = Array.isArray(state.weekends[key]?.tasks) ? state.weekends[key].tasks : [];
    if (weekendTasks.length) {
      const totalMs = weekendTasks.reduce((sum, task) => sum + taskElapsedMs(task, true), 0);
      return Math.floor(totalMs / 60000);
    }
    return [key, addDays(key, 1), addDays(key, 2)].reduce((sum, date) => {
      const record = recordFor(date);
      return sum + focusDuration(record, date === todayIso());
    }, 0);
  }
  function amountText(value, spaced = true) {
    const gap = spaced ? " " : "";
    if (value > 0) return `+${gap}¥${value.toFixed(2)}`;
    if (value < 0) return `−${gap}¥${Math.abs(value).toFixed(2)}`;
    return `¥${value.toFixed(2)}`;
  }
  function formatDate(date) {
    return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" })
      .format(new Date(`${date}T00:00:00`));
  }
  function weekday(date) {
    return new Intl.DateTimeFormat("zh-CN", { weekday: "long" })
      .format(new Date(`${date}T00:00:00`));
  }
  function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 1800);
  }
  function datedRecords() {
    return Object.entries(state.records)
      .filter(([date, record]) => date >= state.startDate && isMeaningful(record))
      .sort(([a], [b]) => b.localeCompare(a));
  }

  function renderSummary() {
    const dailyCompleted = datedRecords()
      .filter(([date, record]) => includeDailyInLedger(date, record))
      .map(([, record]) => resultFor(record))
      .filter(Boolean);
    const activeWeekends = Object.entries(state.weekends)
      .filter(([key, weekend]) => addDays(key, 2) >= state.startDate && isWeekendMeaningful(weekend));
    const weekendCompleted = activeWeekends
      .map(([key, weekend]) => weekendResultFor(key, weekend))
      .filter(Boolean);
    const completed = [...dailyCompleted, ...weekendCompleted];
    const total = completed.reduce((sum, result) => sum + result.amount, 0);
    const deductions = dailyCompleted.filter((result) => result.amount < 0)
      .reduce((sum, result) => sum + Math.abs(result.amount), 0)
      + activeWeekends.filter(([, weekend]) => weekend.penaltyConfirmed && !weekend.allDoneDate).length * 0.5;
    elements.balance.textContent = total < 0 ? `− ¥ ${Math.abs(total).toFixed(2)}` : `¥ ${total.toFixed(2)}`;
    elements.balance.style.color = total < 0 ? "#ffd5ce" : "#f9fff9";
    elements.periodLabel.textContent = `从 ${formatDate(state.startDate)} 开始记录成长`;
    elements.recordDays.textContent = String(completed.length);
    elements.rewardDays.textContent = String(completed.filter((result) => result.amount > 0).length);
    elements.deductionTotal.textContent = `¥${deductions.toFixed(2)}`;
  }

  function latestStatus(record) {
    if (record?.finishTime) return `${record.finishTime} 完成 · 有效 ${focusDuration(record)} 分钟`;
    if (record?.ruleId) return "旧版手动记录";
    if (record?.resumeTime) return `${record.resumeTime} 饭后继续，进行中`;
    if (record?.dinnerTime) return `${record.dinnerTime} 吃饭暂停`;
    if (record?.startTime) return `${record.startTime} 开始，进行中`;
    if (record?.ledgerConfirmed) return "成长记录册已补全";
    if (record?.readingDone && record?.choresDone) return "阅读和家务已打卡";
    if (record?.readingDone) return "阅读已打卡";
    if (record?.choresDone) return "家务已打卡";
    if (sportsForRecord(record).length) return `运动已打卡 ${sportsForRecord(record).length} 项`;
    return "尚未开始";
  }
  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }
  function renderHistory() {
    const dailyEntries = datedRecords()
      .filter(([date, record]) => includeDailyInLedger(date, record))
      .map(([date, record]) => ({ type: "daily", date, record }));
    const weekendEntries = Object.entries(state.weekends)
      .filter(([key, weekend]) => addDays(key, 2) >= state.startDate && isWeekendMeaningful(weekend))
      .map(([date, weekend]) => ({ type: "weekend", date, weekend }));
    const entries = [...dailyEntries, ...weekendEntries].sort((a, b) => b.date.localeCompare(a.date));
    elements.emptyState.hidden = entries.length > 0;
    elements.historyList.innerHTML = "";
    entries.forEach((entry) => {
      const { date } = entry;
      const result = entry.type === "daily" ? resultFor(entry.record) : weekendResultFor(date, entry.weekend);
      const amountClass = !result ? "pending" : result.amount < 0 ? "negative" : result.amount === 0 ? "zero" : "";
      const item = document.createElement("article");
      item.className = "history-item";
      const mainStatus = entry.type === "daily"
        ? latestStatus(entry.record)
        : entry.weekend.allDoneDate
          ? `${formatDate(entry.weekend.allDoneDate)} ${entry.weekend.allDoneTime || ""} 全部完成`
          : entry.weekend.penaltyConfirmed ? "周日结束仍未完成"
            : entry.weekend.planSaved && taskOrderSaved(date) ? "周五计划已完成，周末进行中"
              : entry.weekend.planSaved ? "等待确定闯关顺序" : "等待周五安排";
      const subStatus = entry.type === "daily"
        ? entry.record.note || (result ? result.label : "流程尚未完成")
        : result ? result.label : "按周五清单安排周六、周日";
      item.innerHTML = `
        <div class="history-date"><strong>${formatDate(date)}${entry.type === "weekend" ? "周末" : ""}</strong><span>${weekday(date)}</span></div>
        <div class="history-detail">
          <strong>${escapeHtml(mainStatus)}</strong>
          <span>${escapeHtml(subStatus)}</span>
        </div>
        <div class="history-amount ${amountClass}">${result ? amountText(result.amount) : "进行中"}</div>
        <div class="history-menu">
          <button type="button" data-action="edit" data-kind="${entry.type}" data-date="${date}">查看</button>
          <button type="button" data-action="delete" data-kind="${entry.type}" data-date="${date}">删除</button>
        </div>`;
      elements.historyList.appendChild(item);
    });
  }

  function markStep(element, done, active = false) {
    element.classList.toggle("done", done);
    element.classList.toggle("active", active);
  }
  const primaryAction = (label, action) => `<button class="primary-button" type="button" data-session-action="${action}">${label}</button>`;
  const secondaryAction = (label, action) => `<button class="secondary-button" type="button" data-session-action="${action}">${label}</button>`;

  function setPrepState(button, selected) {
    button.setAttribute("aria-pressed", String(Boolean(selected)));
  }

  function renderWeekend() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const weekendMode = Boolean(key);
    elements.weekendTaskPlanner.hidden = !weekendMode;
    elements.viewModeLabel.textContent = !weekendMode ? "平日记录"
      : date === key ? "周五录入与安排" : date === addDays(key, 1) ? "周六按计划完成" : "周日按计划完成";
    if (!weekendMode) return;

    const weekend = weekendForDate(date) || {};
    const tasks = tasksForDate(date);
    const saturday = addDays(key, 1);
    const sunday = addDays(key, 2);
    const isFriday = date === key;
    const executionStarted = tasks.some((task) => (task.status || "pending") !== "pending");
    const saturdayTasks = tasks.filter((task) => plannedDayForTask(task) === "saturday");
    const sundayTasks = tasks.filter((task) => plannedDayForTask(task) === "sunday");
    const completed = (items) => items.filter((task) => task.status === "done").length;

    elements.weekendPlannerKicker.textContent = isFriday ? "周五安排" : "周五计划已自动带入";
    elements.weekendPlannerTitle.textContent = isFriday ? "给每项作业安排完成日期" : `今天按${date === saturday ? "周六" : "周日"}计划完成`;
    elements.weekendPlannerHelp.textContent = isFriday
      ? "默认安排在周六；确实需要周日完成的，再改成周日。"
      : `这份清单来自 ${formatDate(key)}（周五），今天不需要重新录入。`;
    elements.weekendPlanSummary.textContent = weekend.planSaved
      ? `周六 ${saturdayTasks.length} 项 · 周日 ${sundayTasks.length} 项` : "尚未保存";

    if (isFriday && weekend.confirmed && tasks.length) {
      elements.weekendTaskPlanList.innerHTML = tasks.map((task) => {
        const day = plannedDayForTask(task);
        const disabled = executionStarted ? " disabled" : "";
        return `<div class="weekend-plan-row">
          <div class="weekend-plan-copy"><strong>${escapeHtml(`${task.subject || "其他"} · ${task.title || "未命名作业"}`)}</strong><small>选择计划完成日</small></div>
          <div class="plan-day-tabs" role="group" aria-label="${escapeHtml(task.title || "作业")}计划日期">
            <button type="button" data-plan-day="saturday" data-task-id="${escapeHtml(String(task.id))}" aria-pressed="${day === "saturday"}"${disabled}>周六</button>
            <button type="button" data-plan-day="sunday" data-task-id="${escapeHtml(String(task.id))}" aria-pressed="${day === "sunday"}"${disabled}>周日</button>
          </div>
        </div>`;
      }).join("");
    } else if (!isFriday && weekend.planSaved) {
      elements.weekendTaskPlanList.innerHTML = `<div class="weekend-plan-row${date === saturday ? " today" : ""}">
          <div class="weekend-plan-copy"><strong>周六计划</strong><small>已完成 ${completed(saturdayTasks)} / ${saturdayTasks.length} 项</small></div><span class="plan-day-badge">${saturdayTasks.length} 项</span>
        </div><div class="weekend-plan-row${date === sunday ? " today" : ""}">
          <div class="weekend-plan-copy"><strong>周日计划</strong><small>已完成 ${completed(sundayTasks)} / ${sundayTasks.length} 项</small></div><span class="plan-day-badge">${sundayTasks.length} 项</span>
        </div>`;
    } else {
      elements.weekendTaskPlanList.innerHTML = "";
    }

    elements.saveWeekendTaskPlanButton.hidden = !isFriday || !weekend.confirmed || !tasks.length || executionStarted;
    elements.saveWeekendTaskPlanButton.textContent = weekend.planSaved ? "更新周末安排" : "保存周末安排";
    elements.weekendPlanHint.textContent = !weekend.confirmed
      ? isFriday ? "先核对并确认上面的作业清单。" : "周五的作业清单还没有确认。"
      : !weekend.planSaved ? isFriday ? "选好每项作业的完成日，再保存安排。" : "周五还没有保存周末安排。"
        : executionStarted && isFriday ? "周末已经开始执行，安排已锁定。"
          : isFriday && !taskOrderSaved(date) ? "日期已安排，再回到上面排好周六、周日的闯关顺序。"
            : isFriday ? "周末日期和闯关顺序都安排好啦。"
          : date === saturday ? `今天优先完成周六的 ${saturdayTasks.length} 项。`
            : date === sunday ? `今天完成周日的 ${sundayTasks.length} 项，并补齐未完成项。` : "安排保存后，周六和周日会自动显示。";

    const result = weekendResultFor(key, weekend);
    elements.weekendResult.hidden = !result;
    if (result) {
      elements.weekendResultLabel.textContent = result.label;
      elements.weekendResultAmount.textContent = amountText(result.amount);
      elements.weekendResult.className = `day-result${result.amount < 0 ? " negative" : result.amount === 0 ? " neutral" : ""}`;
    }
    elements.weekendPenaltyButton.hidden = date !== sunday || !weekend.planSaved || Boolean(weekend.allDoneDate);
    elements.weekendPenaltyButton.textContent = weekend.penaltyConfirmed ? "撤销未完成结算" : "周日结束仍未完成";
  }

  function taskButton(label, action, id, className = "") {
    return `<button class="${className}" type="button" data-task-action="${action}" data-task-id="${escapeHtml(String(id))}">${label}</button>`;
  }

  function renderTasks() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const weekend = key ? weekendForDate(date) || {} : null;
    const isFriday = Boolean(key && date === key);
    const canEditList = !key || isFriday;
    const ledgerReady = key && !isFriday ? true : Boolean(recordFor(date)?.ledgerConfirmed);
    const tasks = tasksForDate(date);
    const confirmed = taskListConfirmed(date);
    const doneCount = tasks.filter((task) => task.status === "done").length;
    const active = activeTaskForDate(date);
    const orderSaved = taskOrderSaved(date);
    const allPending = tasks.every((task) => (task.status || "pending") === "pending");
    const canArrangeOrder = confirmed && canEditList && allPending && (!key || weekend.planSaved);
    const sortingMode = canArrangeOrder && !orderSaved;
    const orderPendingWeekend = confirmed && Boolean(key && !isFriday && weekend.planSaved && !orderSaved);
    elements.taskEntry.hidden = confirmed || !canEditList || !ledgerReady;
    elements.emptyTaskList.hidden = tasks.length > 0;
    elements.emptyTaskList.textContent = key && !isFriday
      ? "周五还没有录入作业清单，请回到周五完成录入和安排。"
      : ledgerReady ? "还没有作业，点击麦克风连续报完，或直接输入文字。" : "先核对钉钉和成长记录册，再录入作业。";
    elements.confirmTaskListButton.hidden = tasks.length === 0 || !canEditList || (confirmed && !allPending);
    elements.confirmTaskListButton.textContent = confirmed ? "修改作业清单" : "确认作业清单";
    elements.taskOrderButton.hidden = !canArrangeOrder;
    elements.taskOrderButton.textContent = sortingMode ? "确定顺序，开始闯关" : "调整闯关顺序";
    elements.taskOrderButton.className = sortingMode
      ? "primary-button compact-button" : "text-button bordered compact-order-button";
    const currentRecordData = recordFor(date) || {};
    elements.taskConfirmHint.textContent = sortingMode
      ? key ? "分别排好周六、周日的顺序，确定后就按计划闯关。" : "拖动作业，或使用箭头排好顺序，再确定开始。"
      : orderPendingWeekend ? "周末顺序还没有确定，请回到周五完成最后一步。"
      : key && isFriday && orderSaved ? "周末完成日期和闯关顺序都安排好了。"
      : !canEditList
      ? weekend?.planSaved ? "清单来自周五，按计划日期逐项完成。" : "请先回到周五保存周末安排。"
      : !ledgerReady ? "第 1 步：先核对钉钉和成长记录册。"
        : confirmed
      ? doneCount === tasks.length && tasks.length
        ? key ? "周末清单已全部完成并自动结算。"
          : currentRecordData.finishTime ? "最后一项完成时已自动结算。" : "清单已完成，确认成长记录册后自动结算。"
        : key ? "清单已确认；接下来给每项作业安排周六或周日。" : "清单已确认；一次只开始一项。"
      : tasks.length ? "核对无误后再确认清单。" : "录入后先核对，避免漏掉作业。";
    const questMode = confirmed && orderSaved && (!key || (!isFriday && weekend.planSaved));
    const questTasks = !questMode ? tasks : !key ? tasks
      : date === addDays(key, 1)
        ? tasks.filter((task) => plannedDayForTask(task) === "saturday")
        : [
          ...tasks.filter((task) => plannedDayForTask(task) === "saturday"
            && (task.status !== "done" || task.completedDate === date)),
          ...tasks.filter((task) => plannedDayForTask(task) === "sunday")
        ];
    const questDone = questTasks.filter((task) => task.status === "done");
    const questRemaining = questTasks.filter((task) => task.status !== "done");
    const progressTotal = questMode ? questTasks.length : tasks.length;
    const progressDone = questMode ? questDone.length : doneCount;
    elements.taskPanelTitle.textContent = sortingMode ? "安排你的闯关顺序"
      : orderPendingWeekend ? "还差一步：确定顺序"
        : questMode ? "今天一关一关来" : "选一项，轻松开始吧";
    elements.taskPanelHelp.textContent = sortingMode
      ? "这是你的计划，想先做哪一项由你决定。"
      : orderPendingWeekend ? "请回到周五排好顺序，再开始周末作业。"
        : questMode ? "不用一次想完，只看眼前这一项。"
          : "一次专心做一项，每完成一项都很棒！";
    elements.taskSummary.textContent = progressTotal ? `${progressDone} / ${progressTotal} 项完成` : "0 项";
    elements.activeTaskBanner.hidden = !active || questMode;
    if (active) {
      elements.activeTaskTitle.textContent = `${active.subject} · ${active.title}`;
      elements.activeTaskTime.textContent = `已专注 ${taskDurationLabel(active)}`;
    }

    const canDoTaskToday = (task) => !key || (weekend.planSaved && !isFriday
      && (date === addDays(key, 2) || plannedDayForTask(task) === "saturday"));
    const questCurrent = questMode
      ? active || questRemaining.find((task) => task.status === "paused") || questRemaining[0] || null
      : null;
    const suggestedTask = active ? null : questCurrent
      || tasks.find((task) => (task.status || "pending") === "pending" && canDoTaskToday(task));

    const taskCard = (task, options = {}) => {
      const status = task.status || "pending";
      let buttons = "";
      const canDoToday = canDoTaskToday(task);
      const allowActions = options.allowActions !== false;
      if (options.sortable) {
        buttons = `<button class="order-arrow" type="button" data-order-action="up" data-task-id="${escapeHtml(String(task.id))}" aria-label="向前移动"${options.moveUp ? "" : " disabled"}>↑</button>
          <button class="order-arrow" type="button" data-order-action="down" data-task-id="${escapeHtml(String(task.id))}" aria-label="向后移动"${options.moveDown ? "" : " disabled"}>↓</button>`;
      } else if (confirmed && canDoToday && allowActions) {
        if (status === "active") {
          buttons = taskButton("暂停", "pause", task.id) + taskButton("完成", "complete", task.id, "primary-task-action");
        } else if (status === "paused") {
          buttons = taskButton("继续", "start", task.id, "primary-task-action") + taskButton("完成", "complete", task.id);
        } else if (status === "done") {
          buttons = taskButton("撤销完成", "undo", task.id);
        } else {
          const suggested = suggestedTask && String(suggestedTask.id) === String(task.id);
          buttons = taskButton("开始", "start", task.id,
            suggested ? "primary-task-action start-task-action" : "quiet-start-action");
        }
      } else if (!confirmed && canEditList) {
        buttons = taskButton("删除", "delete", task.id, "danger-task-action");
      }
      const meta = options.sortable ? "长按拖动，或用右侧箭头调整"
        : status === "done"
        ? `${task.completedDate ? `${formatDate(task.completedDate)} ` : ""}${task.completedAt || "已"} 完成 · 用时 ${taskDurationLabel(task)}`
        : status === "active" ? `正在进行 · ${taskDurationLabel(task)}`
          : status === "paused" ? `已暂停 · 已用 ${taskDurationLabel(task)}`
            : key && weekend.planSaved && !isFriday && !canDoToday ? `计划${plannedDayLabel(task)}完成` : "待开始";
      const planBadge = key && weekend.planSaved ? `<span class="task-plan-badge">${plannedDayLabel(task)}</span>` : "";
      const plannedToday = key && !isFriday && plannedDateForTask(key, task) === date;
      const sortAttributes = options.sortable
        ? ` sortable" draggable="true" data-sort-task-id="${escapeHtml(String(task.id))}` : "";
      return `<article class="task-item ${status}${plannedToday ? " planned-today" : ""}${options.current ? " quest-current-card" : ""}${options.compact ? " quest-compact-card" : ""}${sortAttributes}" data-subject="${escapeHtml(task.subject || "其他")}">
        <div class="task-main-row">
          ${options.sortable ? `<span class="drag-handle" aria-hidden="true">⠿</span><span class="order-number">${options.orderNumber}</span>` : ""}
          <div class="task-copy">
            <span class="subject-badge">${escapeHtml(task.subject || "其他")}</span><strong class="task-title">${escapeHtml(task.title || "未命名作业")}</strong>${planBadge}
            <small class="task-meta">${escapeHtml(meta)}</small>
          </div>
          <div class="task-buttons">${buttons}</div>
        </div>
      </article>`;
    };

    if (sortingMode) {
      const groupHtml = (label, groupTasks, help) => groupTasks.length ? `<section class="order-group">
        ${label ? `<div class="order-group-title"><strong>${label}</strong><small>${help}</small></div>` : ""}
        ${groupTasks.map((task, index) => taskCard(task, {
          sortable: true, orderNumber: index + 1, moveUp: index > 0, moveDown: index < groupTasks.length - 1
        })).join("")}</section>` : "";
      const orderBody = key
        ? groupHtml("周六闯关顺序", tasks.filter((task) => plannedDayForTask(task) === "saturday"), "先完成周六计划")
          + groupHtml("周日闯关顺序", tasks.filter((task) => plannedDayForTask(task) === "sunday"), "周日按这个顺序完成")
        : groupHtml("", tasks, "");
      elements.taskSummary.textContent = `${tasks.length} 关待安排`;
      elements.activeTaskBanner.hidden = true;
      elements.taskList.innerHTML = `<div class="order-intro">🧭 先选一项容易开始的热身，再安排最需要动脑的作业。</div>${orderBody}`;
      return;
    }

    if (!questMode) {
      elements.taskList.innerHTML = tasks.map((task) => taskCard(task, { allowActions: !orderPendingWeekend })).join("");
      return;
    }

    const progress = progressTotal ? Math.round(progressDone / progressTotal * 100) : 100;
    const remainingCount = Math.max(0, progressTotal - progressDone);
    let encouragement = "先完成一小项，作业就会开始变少啦！";
    if (progressDone > 0 && progress < 50) encouragement = "已经闯过第一关，作业没有想象中那么难！";
    else if (progress >= 50 && progress < 80) encouragement = "已经完成一半多啦，胜利正在靠近！";
    else if (progress >= 80 && progress < 100) encouragement = `快到终点了，只剩 ${remainingCount} 项！`;
    else if (progress === 100) encouragement = "全部通关，今天的坚持太棒了！";

    const progressHtml = `<div class="quest-progress${progress === 100 ? " complete" : ""}">
      <div class="quest-progress-head"><div><span>${progress === 100 ? "🏆 今日通关" : `第 ${progressDone + 1} 关 · 共 ${progressTotal} 关`}</span><strong>${progress === 100 ? "全部完成啦！" : `还剩 ${remainingCount} 项`}</strong></div><b>${progress}%</b></div>
      <div class="quest-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i style="width:${progress}%"></i></div>
      <p>${encouragement}</p>
    </div>`;

    if (progress === 100) {
      const completedHtml = questDone.length
        ? `<button class="quest-toggle" type="button" data-list-toggle="completed">${completedTasksExpanded ? "收起已完成作业" : `看看闯过的 ${questDone.length} 关`} <span>${completedTasksExpanded ? "⌃" : "⌄"}</span></button>
          ${completedTasksExpanded ? `<div class="quest-collapsed-list">${questDone.map((task) => taskCard(task, { compact: true })).join("")}</div>` : ""}` : "";
      elements.taskList.innerHTML = `${progressHtml}<div class="quest-victory"><span>🎉</span><strong>太棒了，全部通关！</strong><small>看起来很多的作业，也被你一项一项完成啦。</small></div>${completedHtml}`;
      return;
    }

    const upcoming = questRemaining.filter((task) => task !== questCurrent).slice(0, 2);
    const later = questRemaining.filter((task) => task !== questCurrent && !upcoming.includes(task));
    const currentHtml = questCurrent ? `<div class="quest-section-title"><span>🎯 现在只做这一关</span><small>不用想后面的，先把眼前这一项做好</small></div>${taskCard(questCurrent, { current: true })}` : "";
    const upcomingHtml = upcoming.length ? `<div class="quest-section-title compact"><span>接下来</span><small>提前看一眼就好</small></div><div class="quest-preview-list">${upcoming.map((task) => taskCard(task, { compact: true, allowActions: false })).join("")}</div>` : "";
    const laterHtml = later.length ? `<button class="quest-toggle" type="button" data-list-toggle="later">${taskListExpanded ? "收起后面的作业" : `稍后还有 ${later.length} 项`} <span>${taskListExpanded ? "⌃" : "⌄"}</span></button>
      ${taskListExpanded ? `<div class="quest-collapsed-list">${later.map((task) => taskCard(task, { compact: true, allowActions: false })).join("")}</div>` : ""}` : "";
    const doneHtml = questDone.length ? `<button class="quest-toggle completed" type="button" data-list-toggle="completed">✅ 已闯过 ${questDone.length} 关 <span>${completedTasksExpanded ? "⌃" : "⌄"}</span></button>
      ${completedTasksExpanded ? `<div class="quest-collapsed-list">${questDone.map((task) => taskCard(task, { compact: true })).join("")}</div>` : ""}` : "";
    elements.taskList.innerHTML = `${progressHtml}${currentHtml}${upcomingHtml}${laterHtml}${doneHtml}`;
  }

  function renderCurrentRecord() {
    const date = elements.recordDate.value;
    const record = currentRecord() || {};
    const weekendMode = Boolean(weekendKeyFor(date));
    elements.recordHeading.textContent = date === todayIso()
      ? "今天也一起加油吧！"
      : `${formatDate(date)}的记录`;
    const key = weekendKeyFor(date);
    elements.ledgerButton.hidden = Boolean(key && date !== key);
    const sports = sportsForRecord(record);
    elements.sportCard.classList.toggle("completed", sports.length > 0);
    elements.sportStatus.textContent = sports.length
      ? `${record.sportAt || record.ropeAt || "已"} 完成：${sports.join("、")}` : "选择今天完成的运动";
    elements.sportOptions.querySelectorAll("button[data-sport]").forEach((button) => {
      button.setAttribute("aria-pressed", String(sports.includes(button.dataset.sport)));
    });
    elements.ledgerButton.setAttribute("aria-pressed", String(Boolean(record.ledgerConfirmed)));
    elements.ledgerStatus.textContent = record.ledgerConfirmed
      ? `${record.ledgerAt || "已"} 完成核对，可以录入清单` : "先确定今天全部作业，再录入清单";
    setPrepState(elements.readingButton, record.readingDone);
    setPrepState(elements.choresButton, record.choresDone);
    elements.readingStatus.textContent = record.readingDone
      ? `${record.readingAt || "已"} 完成阅读` : "今天完成阅读后打卡";
    elements.choresStatus.textContent = record.choresDone
      ? `${record.choresAt || "已"} 完成家务` : "今天做完家务后打卡";

    const result = weekendMode && !includeDailyInLedger(date, record) ? null : resultFor(record);
    elements.dayResult.hidden = !result;
    if (result) {
      elements.resultLabel.textContent = result.label;
      elements.resultAmount.textContent = amountText(result.amount);
      elements.dayResult.className = `day-result${result.amount < 0 ? " negative" : result.amount === 0 ? " neutral" : ""}`;
    }
  }

  function render() {
    elements.startDate.value = state.startDate;
    elements.recordDate.min = state.startDate;
    renderSummary();
    renderWeekend();
    renderTasks();
    renderCurrentRecord();
    renderHistory();
  }
  function saveAndRender(message) {
    cleanupCurrentRecord();
    persist();
    render();
    if (message) showToast(message);
  }
  function togglePrep(field, timeField, message) {
    const record = currentRecord(true);
    record[field] = !record[field];
    if (record[field]) record[timeField] = currentTime(); else delete record[timeField];
    if (field === "ledgerConfirmed" && tasksForDate().length && allTasksDone()) {
      if (record[field]) {
        record.finishTime = record.tasksFinishedAt || currentTime();
        const result = ruleForFinish(record.finishTime);
        return saveAndRender(`成长记录册已确认，自动${result.amount < 0 ? "扣款" : result.amount === 0 ? "结算" : "奖励"} ${amountText(result.amount, false)}`);
      }
      delete record.finishTime;
    }
    saveAndRender(message);
  }

  function toggleSport(activity) {
    const record = currentRecord(true);
    const sports = sportsForRecord(record);
    const selected = sports.includes(activity);
    const next = selected ? sports.filter((item) => item !== activity) : [...sports, activity];
    if (next.length) {
      record.sportActivities = next;
      if (!record.sportAt) record.sportAt = currentTime();
    } else {
      delete record.sportActivities;
      delete record.sportAt;
    }
    delete record.ropeDone;
    delete record.ropeAt;
    saveAndRender(selected ? `已取消${activity}` : `${activity}已打卡`);
  }
  function performSessionAction(action) {
    const record = currentRecord(true);
    const now = currentTime();
    if (action === "replace-legacy") {
      delete record.ruleId;
      saveAndRender("可以开始记录今天的流程了");
    } else if (action === "start") {
      record.startTime = now;
      saveAndRender(weekendKeyFor(elements.recordDate.value) ? "本段作业已开始" : "饭前作业已开始");
    } else if (action === "dinner") {
      const activeTask = activeTaskForDate();
      if (activeTask) stopTaskClock(activeTask, "paused");
      record.dinnerTime = now;
      saveAndRender(weekendKeyFor(elements.recordDate.value) ? "已暂停休息" : "已暂停，安心吃饭吧");
    } else if (action === "resume") {
      record.resumeTime = now;
      saveAndRender(weekendKeyFor(elements.recordDate.value) ? "已继续作业" : "饭后作业已继续");
    } else if (action === "finish") {
      const weekendMode = Boolean(weekendKeyFor(elements.recordDate.value));
      const weekend = weekendForDate(elements.recordDate.value);
      const tasks = tasksForDate();
      if (activeTaskForDate()) return showToast("请先暂停或完成当前作业");
      if (tasks.length && !taskListConfirmed()) return showToast("请先确认作业清单");
      if (!weekendMode && tasks.length && !allTasksDone()) return showToast("还有作业没有完成");
      if (weekendMode && (!weekend?.confirmed || !weekend?.planSaved))
        return showToast("请先确认作业并保存周末计划");
      if (!weekendMode && !record.ledgerConfirmed)
        return showToast("请先确认成长记录册已经补全");
      record.finishTime = now;
      delete record.ruleId;
      if (weekendMode) {
        saveAndRender("今天的作业时段已结束");
      } else {
        const result = ruleForFinish(now);
        saveAndRender(`已完成，今日${result.amount < 0 ? "扣款" : result.amount === 0 ? "不奖不罚" : "奖励"} ${amountText(result.amount, false)}`);
      }
    }
  }

  function openTimeEditor() {
    const record = currentRecord() || {};
    elements.editStartTime.value = record.startTime || "";
    elements.editDinnerTime.value = record.dinnerTime || "";
    elements.editResumeTime.value = record.resumeTime || "";
    elements.editFinishTime.value = record.finishTime || "";
    elements.timeEditor.hidden = false;
    elements.timeEditor.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function validateTimes(values) {
    const [start, dinner, resume, finish] = values.map(timeMinutes);
    if (finish !== null && start === null) return "填写完成时间前，需要先填写开始时间";
    if (dinner !== null && start === null) return "填写吃饭时间前，需要先填写开始时间";
    if (resume !== null && dinner === null) return "填写饭后继续时间前，需要先填写吃饭时间";
    if (dinner !== null && resume === null && finish !== null) return "有吃饭暂停时，需要填写饭后继续时间";
    const ordered = [start, dinner, resume, finish].filter((value) => value !== null);
    if (ordered.some((value, index) => index > 0 && value < ordered[index - 1])) return "请调整时间顺序：开始、吃饭、继续、完成";
    return null;
  }
  function saveAdjustedTimes() {
    const values = [elements.editStartTime.value, elements.editDinnerTime.value,
      elements.editResumeTime.value, elements.editFinishTime.value];
    const error = validateTimes(values);
    if (error) return showToast(error);
    const weekendMode = Boolean(weekendKeyFor(elements.recordDate.value));
    const weekend = weekendForDate(elements.recordDate.value);
    if (values[3] && activeTaskForDate()) return showToast("请先暂停或完成当前作业");
    if (values[3] && !weekendMode && tasksForDate().length && !allTasksDone())
      return showToast("还有作业没有完成");
    if (values[3] && weekendMode && (!weekend?.confirmed || !weekend?.planSaved))
      return showToast("请先确认作业并保存周末计划");
    if (values[3] && !weekendMode && !currentRecord()?.ledgerConfirmed)
      return showToast("请先确认成长记录册已经补全");
    const record = currentRecord(true);
    TIME_FIELDS.forEach((field, index) => {
      if (values[index]) record[field] = values[index]; else delete record[field];
    });
    if (values.some(Boolean)) delete record.ruleId;
    elements.timeEditor.hidden = true;
    saveAndRender("时间已调整");
  }
  function setRecordDate(date) {
    closeFocusModal();
    taskListExpanded = false;
    completedTasksExpanded = false;
    elements.recordDate.value = date;
    render();
  }

  function addTasksFromDraft() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    if (key && date !== key) return showToast("周六、周日直接使用周五清单，不需要重新录入");
    if (!currentRecord()?.ledgerConfirmed) return showToast("请先核对钉钉和成长记录册");
    const parsed = parseTaskDraft(elements.taskDraft.value.trim(), selectedTaskSubject);
    if (!parsed.length) return showToast("请先说出或输入作业内容");
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    const existing = Array.isArray(owner.tasks) ? owner.tasks : [];
    const stamp = Date.now();
    owner.tasks = existing.concat(parsed.map((task, index) => ({
      id: `${stamp}-${index}`,
      subject: task.subject,
      title: task.title,
      status: "pending",
      elapsedMs: 0,
      ...(key ? { plannedDay: "saturday" } : {})
    })));
    if (key) {
      owner.confirmed = false;
      delete owner.confirmedAt;
      delete owner.planSaved;
      delete owner.planSavedAt;
    } else {
      owner.tasksConfirmed = false;
      delete owner.tasksConfirmedAt;
      delete owner.finishTime;
      delete owner.tasksFinishedAt;
      delete owner.ruleId;
    }
    delete owner.orderSaved;
    delete owner.orderSavedAt;
    elements.taskDraft.value = "";
    persist();
    render();
    showToast(`已加入 ${parsed.length} 项作业`);
  }

  function toggleTaskListConfirmation() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    if (key && date !== key) return showToast("周六、周日使用周五已经确认的清单");
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    const tasks = tasksForDate();
    if (!tasks.length) return showToast("请先录入作业");
    const confirmed = taskListConfirmed();
    if (!confirmed && !currentRecord()?.ledgerConfirmed) return showToast("请先核对钉钉和成长记录册");
    if (confirmed && activeTaskForDate()) return showToast("请先暂停当前作业再修改清单");
    if (confirmed && tasks.some((task) => (task.status || "pending") !== "pending"))
      return showToast("已经开始闯关，不能再修改清单");
    if (key) {
      owner.confirmed = !confirmed;
      if (owner.confirmed) owner.confirmedAt = currentTime(); else delete owner.confirmedAt;
      if (confirmed) {
        delete owner.planSaved;
        delete owner.planSavedAt;
      }
    } else {
      owner.tasksConfirmed = !confirmed;
      if (owner.tasksConfirmed) owner.tasksConfirmedAt = currentTime(); else delete owner.tasksConfirmedAt;
      if (confirmed) {
        delete owner.finishTime;
        delete owner.tasksFinishedAt;
        delete owner.ruleId;
      } else if (tasks.every((task) => task.status === "done")) {
        owner.tasksFinishedAt = tasks.map((task) => task.completedAt || "00:00").sort().slice(-1)[0] || currentTime();
        if (owner.ledgerConfirmed) owner.finishTime = owner.tasksFinishedAt;
      }
    }
    if (!confirmed) {
      owner.orderSaved = false;
      delete owner.orderSavedAt;
    } else {
      delete owner.orderSaved;
      delete owner.orderSavedAt;
    }
    taskListExpanded = false;
    completedTasksExpanded = false;
    persist();
    render();
    showToast(confirmed ? "可以修改作业清单了" : `清单已确认，共 ${tasks.length} 项`);
  }

  function toggleTaskOrder() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const tasks = tasksForDate(date);
    const owner = taskOwnerForDate(date, true);
    if (!taskListConfirmed(date) || !tasks.length) return showToast("请先确认完整的作业清单");
    if (key && date !== key) return showToast("周末顺序请回到周五安排");
    if (key && !owner.planSaved) return showToast("请先安排每项作业在周六还是周日完成");
    if (tasks.some((task) => (task.status || "pending") !== "pending"))
      return showToast("已经开始闯关，顺序不能再调整");
    if (taskOrderSaved(date)) {
      owner.orderSaved = false;
      delete owner.orderSavedAt;
      taskListExpanded = false;
      completedTasksExpanded = false;
      persist();
      render();
      showToast("可以重新安排顺序了");
      return;
    }
    owner.orderSaved = true;
    owner.orderSavedAt = currentTime();
    taskListExpanded = false;
    completedTasksExpanded = false;
    persist();
    render();
    showToast(key ? "周末闯关顺序已确定！" : "顺序已确定，开始第一关吧！");
  }

  function reorderTask(sourceId, targetId) {
    if (String(sourceId) === String(targetId)) return;
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const tasks = tasksForDate(date);
    const fromIndex = tasks.findIndex((task) => String(task.id) === String(sourceId));
    const targetIndex = tasks.findIndex((task) => String(task.id) === String(targetId));
    if (fromIndex < 0 || targetIndex < 0) return;
    if (key && plannedDayForTask(tasks[fromIndex]) !== plannedDayForTask(tasks[targetIndex]))
      return showToast("周六和周日的作业请分别排序");
    const [moved] = tasks.splice(fromIndex, 1);
    tasks.splice(targetIndex, 0, moved);
    const owner = taskOwnerForDate(date, true);
    owner.tasks = tasks;
    owner.orderSaved = false;
    delete owner.orderSavedAt;
    persist();
    render();
  }

  function moveTaskOneStep(id, direction) {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const tasks = tasksForDate(date);
    const task = tasks.find((item) => String(item.id) === String(id));
    if (!task) return;
    const group = key ? tasks.filter((item) => plannedDayForTask(item) === plannedDayForTask(task)) : tasks;
    const position = group.indexOf(task);
    const target = group[position + direction];
    if (target) reorderTask(task.id, target.id);
  }

  function performTaskAction(action, id) {
    const task = taskById(id);
    if (!task) return;
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const weekend = key ? weekendForDate(date, true) : null;
    const tasks = tasksForDate();
    let openFocusAfterRender = false;
    if (action === "delete") {
      if (key && date !== key) return showToast("周末清单只能在周五修改");
      const owner = taskOwnerForDate(elements.recordDate.value, true);
      owner.tasks = tasks.filter((item) => String(item.id) !== String(id));
      if (key) {
        delete owner.planSaved;
        delete owner.planSavedAt;
      } else {
        delete owner.finishTime;
        delete owner.tasksFinishedAt;
        delete owner.ruleId;
      }
      cleanupCurrentRecord();
      cleanupWeekend();
      taskListExpanded = false;
      completedTasksExpanded = false;
      persist();
      render();
      return showToast("作业已删除");
    }
    if (!taskListConfirmed()) return showToast("请先确认作业清单");
    if (!taskOrderSaved()) return showToast(key && date !== key ? "请回到周五确定周末闯关顺序" : "请先确定闯关顺序");
    if (key && (!weekend.planSaved || date === key)) return showToast(date === key ? "请先安排好周六、周日，周末再开始作业" : "请先在周五保存周末安排");
    if (key && date === addDays(key, 1) && plannedDayForTask(task) === "sunday" && action !== "undo")
      return showToast("这项安排在周日，今天先做周六计划");
    const record = currentRecord(true);
    if (!key && record.finishTime && action !== "undo") return showToast("当天已经结算，如需修改可先撤销一项完成");
    if (action === "start") {
      const active = activeTaskForDate();
      if (active && active !== task) return showToast(`请先暂停或完成“${active.title}”`);
      task.status = "active";
      task.activeSince = Date.now();
      if (!task.startedAt) task.startedAt = currentTime();
      if (!record.startTime) record.startTime = currentTime();
      openFocusAfterRender = true;
      showToast(`开始：${task.title}`);
    } else if (action === "pause") {
      stopTaskClock(task, "paused");
      closeFocusModal();
      showToast("已暂停，可以休息或选择下一项");
    } else if (action === "complete") {
      stopTaskClock(task, "done");
      closeFocusModal();
      task.completedAt = currentTime();
      if (key) task.completedDate = date;
      const completedAll = tasks.every((item) => item.status === "done");
      if (completedAll && !key) {
        record.tasksFinishedAt = task.completedAt;
        delete record.ruleId;
        if (record.ledgerConfirmed) {
          record.finishTime = record.tasksFinishedAt;
          const result = ruleForFinish(record.finishTime);
          showToast(`已全部完成，自动${result.amount < 0 ? "扣款" : result.amount === 0 ? "结算" : "奖励"} ${amountText(result.amount, false)}`);
        } else {
          delete record.finishTime;
          showToast("作业已全部完成，确认成长记录册后自动结算");
        }
      } else if (completedAll && key) {
        weekend.allDoneDate = date;
        weekend.allDoneTime = task.completedAt;
        delete weekend.penaltyConfirmed;
        const result = weekendResultFor(key, weekend);
        showToast(`周末作业已全部完成，${result.label} ${amountText(result.amount, false)}`);
      } else {
        const todayTasks = !key ? tasks : date === addDays(key, 1)
          ? tasks.filter((item) => plannedDayForTask(item) === "saturday")
          : tasks.filter((item) => plannedDayForTask(item) === "sunday"
            || item.status !== "done" || item.completedDate === date);
        const todayDone = todayTasks.filter((item) => item.status === "done").length;
        const remaining = Math.max(0, todayTasks.length - todayDone);
        if (remaining === 0) showToast("今天安排的作业已通关，太棒了！");
        else if (remaining <= 2) showToast(`太棒了，快到终点了，只剩 ${remaining} 项！`);
        else if (todayDone >= Math.ceil(todayTasks.length / 2)) showToast("成功闯过一关，已经完成一半多啦！");
        else showToast(`成功闯过一关！已经完成 ${todayDone} 项`);
      }
    } else if (action === "undo") {
      task.status = "paused";
      delete task.completedAt;
      delete task.completedDate;
      if (key) {
        delete weekend.allDoneDate;
        delete weekend.allDoneTime;
        delete weekend.penaltyConfirmed;
      } else {
        delete record.finishTime;
        delete record.tasksFinishedAt;
        delete record.ruleId;
      }
      showToast("已撤销完成，可以继续这项作业");
    }
    taskListExpanded = false;
    completedTasksExpanded = false;
    persist();
    render();
    if (openFocusAfterRender) openFocusModal(id);
  }

  function updateSpeechState(listening, message) {
    speechListening = listening;
    elements.voiceTaskButton.classList.toggle("listening", listening);
    elements.voiceTaskButton.textContent = listening ? "■ 结束录入" : "🎙 开始报作业";
    if (message) elements.voiceStatus.textContent = message;
  }

  function selectTaskSubject(subject) {
    selectedTaskSubject = subject;
    elements.subjectTabs.querySelectorAll("button[data-subject]").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.subject === subject));
    });
    elements.addTasksButton.textContent = `生成${subject}清单`;
    elements.taskDraft.placeholder = `例如：1. ${subject}背诵第3课  2. 练习册第12页  3. 阅读课文`;
  }

  function toggleVoiceInput() {
    if (speechListening && speechRecognition) {
      speechRecognition.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return showToast("当前浏览器不支持语音录入，请直接输入文字");
    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = "zh-CN";
    speechRecognition.continuous = true;
    speechRecognition.interimResults = false;
    speechRecognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
      }
      if (transcript.trim()) {
        const prefix = elements.taskDraft.value.trim() ? "；" : "";
        elements.taskDraft.value += `${prefix}${transcript.trim()}`;
      }
    };
    speechRecognition.onerror = (event) => {
      const message = event.error === "not-allowed" ? "请允许浏览器使用麦克风" : "没有听清，可以再试一次";
      updateSpeechState(false, message);
      showToast(message);
    };
    speechRecognition.onend = () => updateSpeechState(false, "语音已转成文字，请核对后生成清单");
    try {
      speechRecognition.start();
      updateSpeechState(true, "正在听，请连续报完每项作业……");
    } catch (_) {
      updateSpeechState(false, "语音录入暂时不可用，请直接输入文字");
    }
  }

  function selectWeekendTaskDay(id, plannedDay) {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    if (!key || date !== key) return showToast("周末安排只能在周五制定");
    const weekend = weekendForDate(date, true);
    if (!weekend.confirmed) return showToast("请先确认作业清单");
    if (tasksForDate().some((task) => (task.status || "pending") !== "pending"))
      return showToast("周末已经开始执行，安排已锁定");
    const task = taskById(id);
    if (!task) return;
    task.plannedDay = plannedDay === "sunday" ? "sunday" : "saturday";
    delete weekend.planSaved;
    delete weekend.planSavedAt;
    weekend.orderSaved = false;
    delete weekend.orderSavedAt;
    persist();
    render();
  }

  function saveWeekendTaskPlan() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    if (!key || date !== key) return showToast("周末安排只能在周五保存");
    const weekend = weekendForDate(date, true);
    const tasks = tasksForDate();
    if (!weekend.confirmed || !tasks.length) return showToast("请先确认完整的作业清单");
    if (tasks.some((task) => (task.status || "pending") !== "pending")) return showToast("周末已经开始执行，安排已锁定");
    tasks.forEach((task) => { task.plannedDay = plannedDayForTask(task); });
    weekend.planSaved = true;
    weekend.planSavedAt = currentTime();
    weekend.orderSaved = false;
    delete weekend.orderSavedAt;
    delete weekend.penaltyConfirmed;
    persist();
    render();
    showToast("完成日期已保存，再给两天的作业排好顺序吧");
  }

  function toggleWeekendPenalty() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const weekend = weekendForDate(date, true);
    if (!key || date !== addDays(key, 2) || !weekend.planSaved || weekend.allDoneDate) return;
    if (!weekend.penaltyConfirmed && !window.confirm("确认到周日结束，学校作业仍未全部完成吗？")) return;
    weekend.penaltyConfirmed = !weekend.penaltyConfirmed;
    persist();
    render();
    showToast(weekend.penaltyConfirmed ? "周末未完成已结算" : "已撤销未完成结算");
  }

  elements.settingsButton.addEventListener("click", () => {
    const willOpen = elements.settingsPanel.hidden;
    elements.settingsPanel.hidden = !willOpen;
    elements.settingsButton.setAttribute("aria-expanded", String(willOpen));
  });
  elements.saveSettingsButton.addEventListener("click", () => {
    if (!elements.startDate.value) return;
    if (elements.startDate.value > todayIso()) return showToast("开始日期不能晚于今天");
    state.startDate = elements.startDate.value;
    persist();
    if (elements.recordDate.value < state.startDate) setRecordDate(state.startDate);
    render();
    showToast("开始日期已更新");
  });
  elements.recordDate.addEventListener("change", () => setRecordDate(elements.recordDate.value));
  elements.todayButton.addEventListener("click", () => setRecordDate(todayIso() < state.startDate ? state.startDate : todayIso()));
  elements.weekendTaskPlanList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-plan-day]");
    if (button) selectWeekendTaskDay(button.dataset.taskId, button.dataset.planDay);
  });
  elements.saveWeekendTaskPlanButton.addEventListener("click", saveWeekendTaskPlan);
  elements.weekendPenaltyButton.addEventListener("click", toggleWeekendPenalty);
  elements.sportOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sport]");
    if (button) toggleSport(button.dataset.sport);
  });
  elements.ledgerButton.addEventListener("click", () => togglePrep("ledgerConfirmed", "ledgerAt", "成长记录册状态已更新"));
  elements.readingButton.addEventListener("click", () => togglePrep("readingDone", "readingAt", "阅读打卡状态已更新"));
  elements.choresButton.addEventListener("click", () => togglePrep("choresDone", "choresAt", "家务打卡状态已更新"));
  elements.voiceTaskButton.addEventListener("click", toggleVoiceInput);
  elements.subjectTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-subject]");
    if (button) selectTaskSubject(button.dataset.subject);
  });
  elements.addTasksButton.addEventListener("click", addTasksFromDraft);
  elements.clearTaskDraftButton.addEventListener("click", () => { elements.taskDraft.value = ""; });
  elements.confirmTaskListButton.addEventListener("click", toggleTaskListConfirmation);
  elements.taskOrderButton.addEventListener("click", toggleTaskOrder);
  elements.taskList.addEventListener("click", (event) => {
    const orderButton = event.target.closest("button[data-order-action]");
    if (orderButton) {
      moveTaskOneStep(orderButton.dataset.taskId, orderButton.dataset.orderAction === "up" ? -1 : 1);
      return;
    }
    const toggle = event.target.closest("button[data-list-toggle]");
    if (toggle) {
      if (toggle.dataset.listToggle === "later") taskListExpanded = !taskListExpanded;
      if (toggle.dataset.listToggle === "completed") completedTasksExpanded = !completedTasksExpanded;
      renderTasks();
      return;
    }
    const button = event.target.closest("button[data-task-action]");
    if (button) performTaskAction(button.dataset.taskAction, button.dataset.taskId);
  });
  elements.taskList.addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-sort-task-id]");
    if (!card) return;
    draggingTaskId = card.dataset.sortTaskId;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggingTaskId);
  });
  elements.taskList.addEventListener("dragover", (event) => {
    const card = event.target.closest("[data-sort-task-id]");
    if (!card || !draggingTaskId || card.dataset.sortTaskId === draggingTaskId) return;
    event.preventDefault();
    elements.taskList.querySelectorAll(".drag-over").forEach((item) => item.classList.remove("drag-over"));
    card.classList.add("drag-over");
  });
  elements.taskList.addEventListener("drop", (event) => {
    const card = event.target.closest("[data-sort-task-id]");
    if (!card || !draggingTaskId) return;
    event.preventDefault();
    const sourceId = draggingTaskId;
    draggingTaskId = null;
    reorderTask(sourceId, card.dataset.sortTaskId);
  });
  elements.taskList.addEventListener("dragend", () => {
    draggingTaskId = null;
    elements.taskList.querySelectorAll(".dragging, .drag-over").forEach((item) => item.classList.remove("dragging", "drag-over"));
  });
  elements.focusCloseButton.addEventListener("click", closeFocusModal);
  elements.focusPauseButton.addEventListener("click", () => {
    if (focusModalTaskId) performTaskAction("pause", focusModalTaskId);
  });
  elements.focusCompleteButton.addEventListener("click", () => {
    if (focusModalTaskId) performTaskAction("complete", focusModalTaskId);
  });
  elements.resetDayButton.addEventListener("click", () => {
    const date = elements.recordDate.value;
    if (!isMeaningful(state.records[date])) return showToast("这一天还没有记录");
    if (!window.confirm(`确定清除 ${formatDate(date)} 的全部记录吗？`)) return;
    closeFocusModal();
    delete state.records[date];
    saveAndRender("当天记录已清除");
  });
  elements.historyList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, date, kind } = button.dataset;
    if (action === "edit") {
      const sunday = addDays(date, 2);
      const target = kind === "weekend"
        ? todayIso() >= date && todayIso() <= sunday ? todayIso() : todayIso() > sunday ? sunday : date
        : date;
      setRecordDate(target);
      document.querySelector(".record-card").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (action === "delete") {
      if (!window.confirm(`确定删除 ${formatDate(date)} 的记录吗？`)) return;
      if (kind === "weekend") delete state.weekends[date];
      else delete state.records[date];
      persist();
      render();
      showToast("记录已删除");
    }
  });

  elements.recordDate.value = todayIso() < state.startDate ? state.startDate : todayIso();
  selectTaskSubject(selectedTaskSubject);
  render();
  setInterval(() => {
    updateFocusModal();
    const active = activeTaskForDate();
    if (active) elements.activeTaskTime.textContent = `已专注 ${taskDurationLabel(active)}`;
  }, 1000);
  setInterval(() => {
    const record = currentRecord();
    if (record?.startTime && !record.finishTime && !record.ruleId) {
      renderCurrentRecord();
      if (activeTaskForDate()) renderTasks();
    }
  }, 30000);
})();
