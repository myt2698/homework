(() => {
  "use strict";

  const STORAGE_KEY = "homework-ledger-v1";
  const BREAK_SESSION_KEY = "homework-break-session-v1";
  const BREAK_ALARM_KEY = "homework-break-alarm-v1";
  const RULES = {
    best: { label: "8:30 及以前", amount: 1.5 },
    good: { label: "8:30 后至 8:40", amount: 1 },
    neutral: { label: "8:40 后至 9:30", amount: 0 },
    late: { label: "9:30 以后", amount: -0.5 }
  };
  const TIME_FIELDS = ["startTime", "dinnerTime", "resumeTime", "finishTime"];
  const SPORTS = ["跳绳", "踢毽子", "坐位体前屈", "50米", "仰卧起坐"];
  const TASK_SUBJECTS = ["语文", "数学", "英语", "科学"];
  const DEFAULT_TASK_KEYWORDS = {
    语文: ["背诵", "默写", "生抄本", "作文", "小练习", "预习", "小古文", "订正", "朗读"],
    数学: ["口算", "课作本", "书本", "小练习"],
    英语: ["校本", "预习课本"],
    科学: []
  };
  const ESTIMATE_OPTIONS = [5, 10, 15, 20, 30];
  const DICTATION_LESSONS = [
    { id: "lesson-1", label: "第1课", words: "奇观 据说 人山人海 顿时 风平浪静 逐渐 齐头并进 浩浩荡荡 山崩地裂 霎时 余波 随时 河堤 拥堵 高墙".split(" ") },
    { id: "lesson-2", label: "第2课", words: "繁星 密密麻麻 忘记 谈话 渐渐 模糊 周围 飞舞 柔和 梦幻 怀抱 沉睡 安静 熟人 躺倒".split(" ") },
    { id: "lesson-4", label: "第4课", words: "暖洋洋 舒适 揭晓 身份 暖和 的确 曾经 打滚 水沟 注视 涨红 滚动 滑落 擦洗 探望 头昏脑涨".split(" ") },
    { id: "lesson-5", label: "第5课", words: "蚊子 即使 问题 绳子 苍蝇 证明 相互 配合 研究 类似 能够 嘴巴 驾驶".split(" ") },
    { id: "lesson-6", label: "第6课", words: "帽子 脑袋 舒服 假如 设法 懂事 一溜烟 各式各样 摆放 玻璃 纽扣 折扣 圆筒".split(" ") },
    { id: "garden-2", label: "语文园地二", words: "提纲 生锈 泡沫 综合 氧气 结账 矿物 俱乐部 揍人 挨揍".split(" ") },
    { id: "lesson-8", label: "第8课", words: "残留 铺床 墙壁 横线 侧面 山峰 庐山 缘分 投降 评论 文章 服输".split(" ") },
    { id: "lesson-9", label: "第9课", words: "爬山虎 操场 嫩绿 新鲜 均匀 空隙 叶柄 触角 弯曲 痕迹 瞧不起 牢固 脚步 鲜嫩".split(" ") },
    { id: "lesson-10", label: "第10课", words: "住宅 选择 住址 大厅 柔弱 平坦 光滑 修理 重要 增长 丝毫 专家 比较 后腿".split(" ") },
    { id: "lesson-11", label: "第11课", words: "宇宙 黑乎乎 翻身 下降 精疲力竭 飘动 照耀 四肢 奔流不息 茂盛 整个 苏醒 缓慢 踏步 丈量 撑船 万丈".split(" ") },
    { id: "lesson-12", label: "第12课", words: "填空 帝国 或曰 女娃 衔接".split(" ") },
    { id: "lesson-13", label: "第13课", words: "喷射 气急败坏 严厉 立即 执行 敬佩 坚定 忍受 遭受 尽管 屈服 肝脏 获得 颗粒 既然".split(" ") },
    { id: "garden-4", label: "语文园地四", words: "花卉 玫瑰 牡丹 花蕾 茉莉 海棠".split(" ") },
    { id: "lesson-15", label: "第15课", words: "麻雀 悄悄 猛烈 无可奈何 身躯 掩护 紧张 浑身 牺牲 庞大 强大 力量 勇气 嗅觉".split(" ") },
    { id: "lesson-16", label: "第16课", words: "石级 发颤 年纪 奋力 猴子 纪念 笑呵呵 鼓舞 陡坡 铁链 好哩 攀登 好啦".split(" ") },
    { id: "lesson-17", label: "第17课", words: "崇山峻岭 盘旋 扩建 修筑 平整 打仗 自然 当地 耗费 大量 智慧 工程 奇迹 城砖 间隔 扶手".split(" ") },
    { id: "lesson-18", label: "第18课", words: "柱子 栏杆 人物 神清气爽 建筑 耸立 半山腰 金碧辉煌 镜子 隐隐约约 游人 狮子 姿态 围绕 栽种 幅度".split(" ") },
    { id: "garden-5", label: "语文园地六", words: "陵寝 景观 丝绸 拉萨 昭告 都江堰 尼龙 走廊".split(" ") },
    { id: "lesson-20", label: "第20课", words: "虽然 拳头 故意 神气 忙乱 鞋子 助威 胳膊 纷纷 可笑 无缘无故 白鹅 骑车 竟然 胸口 拖地 拖拉 把握 摔倒".split(" ") },
    { id: "lesson-21", label: "第21课", words: "文艺 表演 角色 排练 主意 通情达理 充分 提示 演技 撤换 等候 哄堂大笑 垂头丧气 我们俩 吹捧 推广".split(" ") },
    { id: "lesson-23", label: "第23课", words: "戎马 诸多 诸位 竞争 竞赛 唯一".split(" ") },
    { id: "garden-6", label: "语文园地七", words: "韭菜 芹菜 辣椒 红薯 莲藕 芋头 大蒜 生姜".split(" ") },
    { id: "lesson-24", label: "第24课", words: "主席 举行 心情 补充 激动 状态 奉献 运动员 训练 建设 勤劳 邀请 抛弃 万亿".split(" ") },
    { id: "lesson-25", label: "第25课", words: "崛起 严肃 干脆 默默 若有所思 清晰 离开 随便 忘怀 非凡 惩处 训斥 燃烧 响亮".split(" ") },
    { id: "lesson-27", label: "第27课", words: "词语 葡萄 水杯 秦朝 将领 杰出 鬼怪 雄伟 项目".split(" ") }
  ];
  const DICTATION_AUDIO_DB_NAME = "homework-ledger-dictation-audio-v1";
  const DICTATION_AUDIO_STORE = "recordings";
  const DICTATION_RECORDING_MIN_MS = 400;
  const DICTATION_RECORDING_LIMIT_MS = 10000;
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
  const defaultState = () => ({
    records: {},
    weekends: {},
    dictationCustom: {},
    dictationLesson: DICTATION_LESSONS[0].id,
    taskKeywords: defaultTaskKeywords()
  });

  function defaultTaskKeywords() {
    return Object.fromEntries(TASK_SUBJECTS.map((subject) => [subject,
      DEFAULT_TASK_KEYWORDS[subject].map((label, index) => ({
        id: `builtin-${TASK_SUBJECTS.indexOf(subject)}-${index}`,
        label,
        visible: true
      }))
    ]));
  }

  function normalizeTaskKeywords(value) {
    const defaults = defaultTaskKeywords();
    const source = value && typeof value === "object" ? value : null;
    return Object.fromEntries(TASK_SUBJECTS.map((subject) => {
      const raw = source && Array.isArray(source[subject]) ? source[subject] : defaults[subject];
      const seen = new Set();
      const items = raw.map((item, index) => {
        const label = typeof item === "string" ? item.trim() : String(item?.label || "").trim();
        if (!label || seen.has(label)) return null;
        seen.add(label);
        return {
          id: typeof item === "object" && item?.id ? String(item.id) : `keyword-${subject}-${index}-${label}`,
          label,
          visible: typeof item === "object" ? item.visible !== false : true
        };
      }).filter(Boolean);
      return [subject, items];
    }));
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== "object") return defaultState();
      return {
        records: parsed.records && typeof parsed.records === "object" ? parsed.records : {},
        weekends: parsed.weekends && typeof parsed.weekends === "object" ? parsed.weekends : {},
        dictationCustom: parsed.dictationCustom && typeof parsed.dictationCustom === "object" ? parsed.dictationCustom : {},
        taskKeywords: normalizeTaskKeywords(parsed.taskKeywords),
        dictationLesson: typeof parsed.dictationLesson === "string"
          && DICTATION_LESSONS.some((lesson) => lesson.id === parsed.dictationLesson)
          ? parsed.dictationLesson
          : DICTATION_LESSONS[0].id
      };
    } catch (_) {
      return defaultState();
    }
  }

  let state = loadState();
  let toastTimer = null;
  const elements = {
    mainPage: $("#mainPage"), historyPage: $("#historyPage"), dictationPage: $("#dictationPage"), settingsPage: $("#settingsPage"),
    openHistoryButton: $("#openHistoryButton"), closeHistoryButton: $("#closeHistoryButton"),
    openDictationButton: $("#openDictationButton"), closeDictationButton: $("#closeDictationButton"),
    dictationLessonSelect: $("#dictationLessonSelect"), dictationLessonCount: $("#dictationLessonCount"),
    dictationLessonTitle: $("#dictationLessonTitle"), dictationWordBank: $("#dictationWordBank"),
    dictationWords: $("#dictationWords"), dictationWordInput: $("#dictationWordInput"),
    addDictationWordsButton: $("#addDictationWordsButton"), dictationHiddenWords: $("#dictationHiddenWords"),
    dictationStatus: $("#dictationStatus"), dictationTimingHint: $("#dictationTimingHint"),
    dictationProgress: $("#dictationProgress"), dictationProgressFill: $("#dictationProgressFill"),
    dictationProgressText: $("#dictationProgressText"), startDictationButton: $("#startDictationButton"),
    stopDictationButton: $("#stopDictationButton"),
    previousDictationLessonButton: $("#previousDictationLessonButton"),
    nextDictationLessonButton: $("#nextDictationLessonButton"),
    settingsButton: $("#settingsButton"), closeSettingsButton: $("#closeSettingsButton"),
    keywordSettingsSubjects: $("#keywordSettingsSubjects"), keywordSettingsList: $("#keywordSettingsList"),
    keywordSettingsInput: $("#keywordSettingsInput"), addKeywordButton: $("#addKeywordButton"),
    exportDataButton: $("#exportDataButton"), importDataButton: $("#importDataButton"),
    importDataInput: $("#importDataInput"), historyManageButton: $("#historyManageButton"),
    recordDate: $("#recordDate"), todayButton: $("#todayButton"),
    historicalDateNotice: $("#historicalDateNotice"), historicalDateLabel: $("#historicalDateLabel"),
    recordHeading: $("#recordHeading"),
    weekendPlanEntry: $("#weekendPlanEntry"), weekendPlanEntryTitle: $("#weekendPlanEntryTitle"),
    weekendPlanEntryStatus: $("#weekendPlanEntryStatus"), weekendPlanModal: $("#weekendPlanModal"),
    weekendPlanCloseButton: $("#weekendPlanCloseButton"),
    weekendTaskPlanner: $("#weekendTaskPlanner"), weekendPlannerKicker: $("#weekendPlannerKicker"),
    weekendPlannerTitle: $("#weekendPlannerTitle"), weekendPlannerHelp: $("#weekendPlannerHelp"),
    weekendTaskPlanList: $("#weekendTaskPlanList"), weekendPlanSummary: $("#weekendPlanSummary"),
    weekendPlanHint: $("#weekendPlanHint"), saveWeekendTaskPlanButton: $("#saveWeekendTaskPlanButton"),
    weekendPenaltyButton: $("#weekendPenaltyButton"), weekendResult: $("#weekendResult"),
    weekendResultLabel: $("#weekendResultLabel"), weekendResultAmount: $("#weekendResultAmount"),
    dailyCheckinsToggle: $("#dailyCheckinsToggle"), dailyCheckinsBody: $("#dailyCheckinsBody"),
    dailyCheckinsSummary: $("#dailyCheckinsSummary"),
    sportCard: $("#sportCard"), sportStatus: $("#sportStatus"), sportOptions: $("#sportOptions"),
    readingButton: $("#readingButton"), readingStatus: $("#readingStatus"),
    mathThinkingButton: $("#mathThinkingButton"), mathThinkingStatus: $("#mathThinkingStatus"),
    englishReadingButton: $("#englishReadingButton"), englishReadingStatus: $("#englishReadingStatus"),
    ledgerButton: $("#ledgerButton"), ledgerTitle: $("#ledgerTitle"), ledgerStatus: $("#ledgerStatus"),
    taskEntryLauncher: $("#taskEntryLauncher"), taskEntryLauncherStatus: $("#taskEntryLauncherStatus"),
    taskEntryModal: $("#taskEntryModal"), taskEntryDialog: $("#taskEntryDialog"), taskEntryCloseButton: $("#taskEntryCloseButton"),
    taskEntry: $("#taskEntry"), subjectPicker: $("#subjectPicker"),
    subjectPickerButton: $("#subjectPickerButton"), subjectPickerLabel: $("#subjectPickerLabel"),
    subjectTabs: $("#subjectTabs"),
    taskEntryComposer: $("#taskEntryComposer"),
    taskKeywordSuggestions: $("#taskKeywordSuggestions"),
    taskEntryEmpty: $("#taskEntryEmpty"),
    taskEntryPendingSection: $("#taskEntryPendingSection"), taskEntryPendingList: $("#taskEntryPendingList"),
    taskEntryPendingSummary: $("#taskEntryPendingSummary"), taskEntryConfirmButton: $("#taskEntryConfirmButton"),
    taskEntryStickyFooter: $("#taskEntryStickyFooter"),
    taskEntryUndoDeleteButton: $("#taskEntryUndoDeleteButton"), taskDraftError: $("#taskDraftError"),
    taskEditModal: $("#taskEditModal"), taskEditCloseButton: $("#taskEditCloseButton"),
    taskEditTitle: $("#taskEditTitle"), taskEditInput: $("#taskEditInput"),
    taskEditEstimate: $("#taskEditEstimate"), taskEditSteps: $("#taskEditSteps"),
    taskEditCancelButton: $("#taskEditCancelButton"), taskEditSaveButton: $("#taskEditSaveButton"),
    stepEditorModal: $("#stepEditorModal"), stepEditorCloseButton: $("#stepEditorCloseButton"),
    stepEditorTaskTitle: $("#stepEditorTaskTitle"), stepEditorInput: $("#stepEditorInput"),
    stepEditorCancelButton: $("#stepEditorCancelButton"), stepEditorSaveButton: $("#stepEditorSaveButton"),
    voiceTaskButton: $("#voiceTaskButton"), voiceStatus: $("#voiceStatus"),
    taskDraft: $("#taskDraft"), addTasksButton: $("#addTasksButton"),
    taskSummary: $("#taskSummary"),
    taskPanel: $("#taskPanel"), taskPanelTitle: $("#taskPanelTitle"), taskPanelHelp: $("#taskPanelHelp"),
    taskOrderButton: $("#taskOrderButton"),
    activeTaskBanner: $("#activeTaskBanner"), activeTaskTitle: $("#activeTaskTitle"),
    activeTaskTime: $("#activeTaskTime"), taskList: $("#taskList"),
    emptyTaskList: $("#emptyTaskList"), taskListFooter: $("#taskListFooter"), taskConfirmHint: $("#taskConfirmHint"),
    confirmTaskListButton: $("#confirmTaskListButton"), dayResult: $("#dayResult"),
    focusModal: $("#focusModal"), focusCloseButton: $("#focusCloseButton"),
    focusModalSubject: $("#focusModalSubject"), focusModalTitle: $("#focusModalTitle"),
    focusModalStep: $("#focusModalStep"), focusModalStepTitle: $("#focusModalStepTitle"),
    focusModalElapsed: $("#focusModalElapsed"), focusModalEstimate: $("#focusModalEstimate"),
    focusModalComparison: $("#focusModalComparison"), focusModalStartedAt: $("#focusModalStartedAt"),
    focusPauseButton: $("#focusPauseButton"), focusCompleteButton: $("#focusCompleteButton"),
    recordAlarmButton: $("#recordAlarmButton"),
    previewAlarmButton: $("#previewAlarmButton"), resetAlarmButton: $("#resetAlarmButton"),
    alarmRecordHint: $("#alarmRecordHint"), breakChoiceModal: $("#breakChoiceModal"),
    breakChoiceCloseButton: $("#breakChoiceCloseButton"),
    breakChoiceTitle: $("#breakChoiceTitle"), breakChoiceNextTask: $("#breakChoiceNextTask"),
    changeBreakNextTaskButton: $("#changeBreakNextTaskButton"),
    breakReturnTime: $("#breakReturnTime"), startTimedBreakButton: $("#startTimedBreakButton"),
    startNextTaskNowButton: $("#startNextTaskNowButton"), breakTimerModal: $("#breakTimerModal"),
    breakTimerTitle: $("#breakTimerTitle"), breakCountdown: $("#breakCountdown"),
    breakPlannedReturn: $("#breakPlannedReturn"), breakTimerNextTask: $("#breakTimerNextTask"),
    extendBreakButton: $("#extendBreakButton"), startNextTaskButton: $("#startNextTaskButton"),
    cancelBreakButton: $("#cancelBreakButton"),
    resultLabel: $("#resultLabel"), resultAmount: $("#resultAmount"),
    resetDayButton: $("#resetDayButton"), historyList: $("#historyList"),
    emptyState: $("#emptyState"), balance: $("#balance"), periodLabel: $("#periodLabel"),
    recordDays: $("#recordDays"), rewardDays: $("#rewardDays"),
    deductionTotal: $("#deductionTotal"), weeklyReviewRange: $("#weeklyReviewRange"),
    weeklyPlanDays: $("#weeklyPlanDays"), weeklyEstimatedTime: $("#weeklyEstimatedTime"),
    weeklyActualTime: $("#weeklyActualTime"), weeklyReviewInsight: $("#weeklyReviewInsight"),
    toast: $("#toast")
  };

  let speechRecognition = null;
  let speechListening = false;
  let selectedTaskSubject = "语文";
  let selectedKeywordSettingsSubject = "语文";
  let focusModalTaskId = null;
  let taskEditTaskId = null;
  let stepEditorTaskId = null;
  let taskListExpanded = false;
  let completedTasksExpanded = false;
  let editingPendingTaskId = null;
  let lastDeletedTask = null;
  let undoDeleteTimer = null;
  let dailyCheckinsExpanded = false;
  let historyManageMode = false;
  let pointerTaskDrag = null;
  let selectedDictationLesson = state.dictationLesson;
  let dictationSession = null;
  let dictationAudioDbPromise = null;
  let dictationAudioReady = false;
  let dictationAudioStoreError = false;
  let dictationRecordingWords = new Set();
  let dictationRecorder = null;
  let dictationRecordingStream = null;
  let dictationRecordingWord = null;
  let dictationRecordingStartedAt = 0;
  let dictationRecordingLimitTimer = null;
  let dictationRecordingSaveOnStop = false;
  let dictationRecordingNotifyOnStop = false;
  let dictationPreview = null;
  let breakChoiceTaskId = null;
  let breakChoiceSourceTaskId = null;
  let breakChoiceMode = "checkpoint";
  let breakChoiceChanged = false;
  let breakTimer = null;
  let breakSession = loadBreakSession();
  let alarmRecorder = null;
  let alarmStream = null;
  let alarmChunks = [];
  let alarmRecordingStartedAt = 0;
  let alarmRecordingTimer = null;
  let alarmPlayback = null;

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
  function weekRange(value = todayIso()) {
    const day = parseIsoDate(value).getDay();
    const start = addDays(value, -((day + 6) % 7));
    return { start, end: addDays(start, 6) };
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
      || record.ledgerConfirmed || record.readingDone || record.mathThinkingDone || record.englishReadingDone
      || record.choresDone || record.note || record.ruleId
      || record.tasksConfirmed || (Array.isArray(record.tasks) && record.tasks.length)
      || TIME_FIELDS.some((field) => record[field])));
  }

  function sportsForRecord(record) {
    if (Array.isArray(record?.sportActivities)) {
      return SPORTS.filter((activity) => record.sportActivities.includes(activity)
        || (activity === "50米" && record.sportActivities.includes("50米跑")));
    }
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
    if (task?.plannedDay === "friday") return "friday";
    return task?.plannedDay === "sunday" ? "sunday" : "saturday";
  }
  function plannedDayLabel(task) {
    const day = plannedDayForTask(task);
    return day === "friday" ? "周五" : day === "sunday" ? "周日" : "周六";
  }
  function plannedDateForTask(key, task) {
    const day = plannedDayForTask(task);
    return addDays(key, day === "friday" ? 0 : day === "sunday" ? 2 : 1);
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
  function estimatedMinutes(task) {
    const value = Number(task?.estimatedMinutes);
    return ESTIMATE_OPTIONS.includes(value) ? value : 15;
  }
  function taskActualMinutes(task) {
    const elapsed = taskElapsedMs(task, false);
    return elapsed > 0 ? Math.max(1, Math.round(elapsed / 60000)) : 0;
  }
  function remainingEstimatedMinutes(tasks) {
    return tasks.reduce((sum, task) => {
      if ((task.status || "pending") === "done") return sum;
      const spent = task.status === "active" ? Math.floor(taskElapsedMs(task) / 60000) : 0;
      return sum + Math.max(0, estimatedMinutes(task) - spent);
    }, 0);
  }
  function taskSteps(task) {
    return Array.isArray(task?.steps)
      ? task.steps.filter((step) => step && typeof step.title === "string" && step.title.trim()) : [];
  }
  function currentTaskStep(task) { return taskSteps(task).find((step) => !step.done) || null; }
  function taskStepSummary(task) {
    const steps = taskSteps(task);
    if (!steps.length) return "";
    return `${steps.filter((step) => step.done).length} / ${steps.length} 步`;
  }
  function taskClockLabel(task) {
    const seconds = Math.floor(taskElapsedMs(task) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return hours > 0
      ? `${String(hours).padStart(2, "0")}\u2009:\u2009${String(minutes).padStart(2, "0")}\u2009:\u2009${String(remainder).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}\u2009:\u2009${String(remainder).padStart(2, "0")}`;
  }
  function taskEstimateComparisonLabel(task) {
    const difference = estimatedMinutes(task) * 60000 - taskElapsedMs(task);
    if (difference > 0) return `距估时约 ${Math.max(1, Math.ceil(difference / 60000))} 分钟`;
    if (difference > -60000) return "刚到预计时间";
    return `已超过约 ${Math.max(1, Math.floor(Math.abs(difference) / 60000))} 分钟`;
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
    const step = currentTaskStep(task);
    elements.focusModalStep.hidden = !step;
    elements.focusModalStepTitle.textContent = step?.title || "";
    elements.focusModalElapsed.textContent = taskClockLabel(task);
    elements.focusModalEstimate.textContent = `${estimatedMinutes(task)} 分钟`;
    elements.focusModalComparison.textContent = taskEstimateComparisonLabel(task);
    elements.focusModalStartedAt.textContent = task.startedAt || "--:--";
    elements.focusCompleteButton.textContent = step
      ? taskSteps(task).filter((item) => !item.done).length === 1 ? "完成最后一步" : "完成本步"
      : "完成这项";
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

  function loadBreakSession() {
    try {
      const value = JSON.parse(localStorage.getItem(BREAK_SESSION_KEY));
      return value && typeof value === "object" && value.taskId && Number(value.endAt) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function saveBreakSession() {
    if (breakSession) localStorage.setItem(BREAK_SESSION_KEY, JSON.stringify(breakSession));
    else localStorage.removeItem(BREAK_SESSION_KEY);
  }

  function customAlarmAudio() {
    return localStorage.getItem(BREAK_ALARM_KEY) || "";
  }

  function renderAlarmSettings() {
    const custom = Boolean(customAlarmAudio());
    elements.resetAlarmButton.hidden = !custom;
    elements.previewAlarmButton.textContent = custom ? "🔊 试听我的录音" : "🔊 试听默认提示";
  }

  function setAlarmRecordHint(message) {
    elements.alarmRecordHint.textContent = message;
    elements.alarmRecordHint.hidden = !message;
  }

  function stopAlarmPlayback() {
    if (alarmPlayback) {
      alarmPlayback.pause();
      alarmPlayback = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function playDefaultAlarm(repeats = 1) {
    if (!("speechSynthesis" in window)) return showToast("作业时间到啦！");
    let remaining = repeats;
    const speak = () => {
      if (remaining <= 0) return;
      remaining -= 1;
      const message = new SpeechSynthesisUtterance("作业时间到啦");
      message.lang = "zh-CN";
      message.rate = 0.92;
      message.pitch = 1.08;
      message.volume = 1;
      const chineseVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang?.toLowerCase().startsWith("zh"));
      if (chineseVoice) message.voice = chineseVoice;
      message.onend = () => window.setTimeout(speak, 350);
      window.speechSynthesis.speak(message);
    };
    speak();
  }

  function playAlarm(repeats = 1) {
    stopAlarmPlayback();
    const source = customAlarmAudio();
    if (!source) return playDefaultAlarm(repeats);
    let remaining = repeats;
    const playNext = () => {
      if (remaining <= 0) return;
      remaining -= 1;
      const audio = new Audio(source);
      alarmPlayback = audio;
      audio.volume = 1;
      audio.onended = () => window.setTimeout(playNext, 350);
      audio.onerror = () => playDefaultAlarm(Math.max(1, remaining + 1));
      audio.play().catch(() => playDefaultAlarm(Math.max(1, remaining + 1)));
    };
    playNext();
  }

  function finishAlarmRecording() {
    if (!alarmRecorder || alarmRecorder.state === "inactive") return;
    alarmRecorder.stop();
  }

  async function toggleAlarmRecording() {
    if (alarmRecorder && alarmRecorder.state !== "inactive") return finishAlarmRecording();
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setAlarmRecordHint("当前浏览器不能录音。");
      return;
    }
    try {
      alarmStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      alarmChunks = [];
      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
        .find((type) => MediaRecorder.isTypeSupported?.(type));
      alarmRecorder = preferred ? new MediaRecorder(alarmStream, { mimeType: preferred }) : new MediaRecorder(alarmStream);
      alarmRecordingStartedAt = Date.now();
      alarmRecorder.ondataavailable = (event) => { if (event.data?.size) alarmChunks.push(event.data); };
      alarmRecorder.onstop = () => {
        window.clearTimeout(alarmRecordingTimer);
        alarmStream?.getTracks().forEach((track) => track.stop());
        alarmStream = null;
        elements.recordAlarmButton.classList.remove("listening");
        elements.recordAlarmButton.textContent = "🎙 重新录音";
        const duration = Date.now() - alarmRecordingStartedAt;
        const blob = new Blob(alarmChunks, { type: alarmRecorder?.mimeType || "audio/webm" });
        if (duration < 500 || !blob.size) {
          setAlarmRecordHint("录音太短了，请重新录一遍。");
          alarmRecorder = null;
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            localStorage.setItem(BREAK_ALARM_KEY, String(reader.result));
            setAlarmRecordHint("录音已保存。试听一下，确认声音清楚、响亮。");
            renderAlarmSettings();
          } catch (_) {
            setAlarmRecordHint("录音太长，无法保存。请录一段更短的提示。");
          }
        };
        reader.readAsDataURL(blob);
        alarmRecorder = null;
      };
      alarmRecorder.start();
      elements.recordAlarmButton.classList.add("listening");
      elements.recordAlarmButton.textContent = "■ 完成录音";
      setAlarmRecordHint("正在录音……说完后点“完成录音”，最长 8 秒。");
      alarmRecordingTimer = window.setTimeout(finishAlarmRecording, 8000);
    } catch (_) {
      alarmStream?.getTracks().forEach((track) => track.stop());
      alarmStream = null;
      setAlarmRecordHint("没有取得麦克风权限，可以在浏览器设置中允许后重试。");
    }
  }

  function openSettingsPage() {
    stopDictation(false, false);
    closeTaskEntryModal();
    closeWeekendPlanModal();
    closeTaskStepsEditor();
    closeTaskEditor();
    closeFocusModal();
    elements.mainPage.hidden = true;
    elements.historyPage.hidden = true;
    elements.dictationPage.hidden = true;
    elements.settingsPage.hidden = false;
    renderAlarmSettings();
    renderTaskKeywordSettings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeSettingsPage() {
    finishAlarmRecording();
    stopAlarmPlayback();
    elements.settingsPage.hidden = true;
    elements.mainPage.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function taskCanRunToday(task, date = elements.recordDate.value) {
    const key = weekendKeyFor(date);
    if (!key) return true;
    const weekend = weekendForDate(date);
    if (!weekend?.planSaved) return false;
    if (date === key) return plannedDayForTask(task) === "friday";
    if (date === addDays(key, 1)) return plannedDayForTask(task) !== "sunday";
    return true;
  }

  function nextTaskForToday(date = elements.recordDate.value) {
    return tasksForDate(date).find((task) => task.status !== "done" && taskCanRunToday(task, date)) || null;
  }

  function availableBreakTasks(date = elements.recordDate.value) {
    return tasksForDate(date).filter((task) => task.status !== "done" && taskCanRunToday(task, date));
  }

  function breakKindLabel(kind) {
    if (kind === "toilet") return "上厕所";
    if (kind === "short") return "短休息";
    if (kind === "long") return "多休息一会";
    return kind === "meal" ? "吃饭" : "休息";
  }

  function timeFromEpoch(value) {
    const date = new Date(Number(value));
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function createBreakLog(kind, endAt) {
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    if (!Array.isArray(owner.breaks)) owner.breaks = [];
    const startedAt = Date.now();
    const entry = {
      id: `break-${startedAt}`,
      kind,
      kindLabel: breakKindLabel(kind),
      trigger: breakChoiceMode,
      sourceTaskId: breakChoiceSourceTaskId,
      nextTaskId: breakChoiceTaskId,
      nextTaskChanged: breakChoiceChanged,
      startedAt,
      plannedEndAt: endAt,
      plannedMinutes: Math.max(1, Math.ceil((endAt - startedAt) / 60000)),
      plannedReturnAt: timeFromEpoch(endAt),
      status: "resting"
    };
    owner.breaks.push(entry);
    persist();
    return entry;
  }

  function finishBreakLog(status) {
    if (!breakSession?.breakId) return null;
    const owner = taskOwnerForDate(breakSession.date, true);
    const log = Array.isArray(owner.breaks)
      ? owner.breaks.find((entry) => String(entry.id) === String(breakSession.breakId)) : null;
    if (!log) return null;
    const returnedAt = Date.now();
    log.status = status;
    log.actualEndAt = returnedAt;
    log.actualReturnAt = timeFromEpoch(returnedAt);
    log.actualMinutes = Math.max(1, Math.ceil((returnedAt - Number(log.startedAt || returnedAt)) / 60000));
    log.overtimeMinutes = Math.max(0, log.actualMinutes - Number(log.plannedMinutes || 0));
    log.extended = Boolean(breakSession.extended);
    persist();
    return log;
  }

  function closeBreakChoice() {
    breakChoiceTaskId = null;
    breakChoiceSourceTaskId = null;
    breakChoiceMode = "checkpoint";
    breakChoiceChanged = false;
    elements.breakChoiceModal.hidden = true;
    if (elements.breakTimerModal.hidden) document.body.classList.remove("modal-open");
  }

  function updateBreakChoiceTask() {
    const task = taskById(breakChoiceTaskId);
    if (!task) return;
    elements.breakChoiceNextTask.textContent = `${task.subject || "其他"} · ${task.title}`;
    const candidates = availableBreakTasks();
    elements.changeBreakNextTaskButton.hidden = candidates.length < 2;
    elements.changeBreakNextTaskButton.disabled = breakChoiceChanged;
    elements.changeBreakNextTaskButton.textContent = breakChoiceChanged ? "已更换下一项" : "换一个下一项（仅一次）";
  }

  function changeBreakNextTask() {
    if (breakChoiceChanged) return;
    const candidates = availableBreakTasks();
    const currentIndex = candidates.findIndex((task) => String(task.id) === String(breakChoiceTaskId));
    const next = candidates[(currentIndex + 1 + candidates.length) % candidates.length];
    if (!next || String(next.id) === String(breakChoiceTaskId)) return;
    breakChoiceTaskId = String(next.id);
    breakChoiceChanged = true;
    updateBreakChoiceTask();
  }

  function openBreakChoice(taskId, mode = "checkpoint", sourceTaskId = null) {
    const task = taskById(taskId);
    if (!task) return;
    breakChoiceTaskId = String(taskId);
    breakChoiceSourceTaskId = sourceTaskId ? String(sourceTaskId) : null;
    breakChoiceMode = mode;
    breakChoiceChanged = false;
    elements.breakChoiceTitle.textContent = "休息多久？";
    elements.startNextTaskNowButton.textContent = mode === "pause" ? "不休息，继续这项" : "不休息，开始下一项";
    updateBreakChoiceTask();
    const suggested = new Date(Date.now() + 30 * 60000);
    elements.breakReturnTime.value = `${String(suggested.getHours()).padStart(2, "0")}:${String(suggested.getMinutes()).padStart(2, "0")}`;
    elements.breakChoiceModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeBreakTimer() {
    window.clearInterval(breakTimer);
    breakTimer = null;
    elements.breakTimerModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function renderBreakTimer() {
    if (!breakSession) return closeBreakTimer();
    const task = tasksForDate(breakSession.date).find((item) => String(item.id) === String(breakSession.taskId));
    if (!task || task.status === "done") return cancelBreak(false);
    elements.breakTimerNextTask.textContent = `${task.subject || "其他"} · ${task.title}`;
    const remaining = Math.max(0, Number(breakSession.endAt) - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    elements.breakCountdown.textContent = remaining > 0
      ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}\u2009:\u2009${String(seconds % 60).padStart(2, "0")}`
      : "时间到";
    elements.breakTimerTitle.textContent = remaining > 0 ? "我正在休息" : "我计划的休息时间到了";
    elements.breakPlannedReturn.textContent = `我计划 ${timeFromEpoch(breakSession.endAt)} 回来`;
    elements.breakTimerModal.querySelector(".break-timer-dialog").classList.toggle("time-up", remaining <= 0);
    elements.extendBreakButton.hidden = Boolean(breakSession.extended);
    elements.startNextTaskButton.textContent = remaining <= 0 ? "开始下一项" : "我提前回来了，开始下一项";
    if (remaining <= 0 && !breakSession.alerted) {
      breakSession.alerted = true;
      saveBreakSession();
      playAlarm(2);
    }
  }

  function openBreakTimer() {
    if (!breakSession) return;
    closeBreakChoice();
    elements.breakTimerModal.hidden = false;
    document.body.classList.add("modal-open");
    renderBreakTimer();
    window.clearInterval(breakTimer);
    breakTimer = window.setInterval(renderBreakTimer, 1000);
  }

  function startBreak(endAt, kind = "short") {
    if (!breakChoiceTaskId) return;
    const log = createBreakLog(kind, endAt);
    breakSession = {
      taskId: breakChoiceTaskId,
      date: elements.recordDate.value,
      startedAt: Date.now(),
      endAt,
      kind,
      breakId: log.id,
      extended: false,
      alerted: false
    };
    saveBreakSession();
    openBreakTimer();
  }

  function cancelBreak(notify = true) {
    if (breakSession) finishBreakLog("cancelled");
    breakSession = null;
    saveBreakSession();
    stopAlarmPlayback();
    closeBreakTimer();
    if (notify) showToast("这次休息提醒已取消");
  }

  function startNextTaskAfterBreak(taskId = breakSession?.taskId, date = breakSession?.date) {
    if (!taskId) taskId = breakChoiceTaskId;
    if (!taskId) return;
    const log = breakSession ? finishBreakLog("returned") : null;
    closeBreakChoice();
    breakSession = null;
    saveBreakSession();
    stopAlarmPlayback();
    closeBreakTimer();
    if (date && elements.recordDate.value !== date) setRecordDate(date);
    performTaskAction("start", taskId);
    if (log) window.setTimeout(() => showToast(`计划休息 ${log.plannedMinutes} 分钟，实际 ${log.actualMinutes} 分钟`), 80);
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
      .filter(([, record]) => isMeaningful(record))
      .sort(([a], [b]) => b.localeCompare(a));
  }

  function renderSummary() {
    const dailyCompleted = datedRecords()
      .filter(([date, record]) => includeDailyInLedger(date, record))
      .map(([, record]) => resultFor(record))
      .filter(Boolean);
    const activeWeekends = Object.entries(state.weekends)
      .filter(([, weekend]) => isWeekendMeaningful(weekend));
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
    elements.periodLabel.textContent = "全部成长记录";
    elements.recordDays.textContent = String(completed.length);
    elements.rewardDays.textContent = String(completed.filter((result) => result.amount > 0).length);
    elements.deductionTotal.textContent = `¥${deductions.toFixed(2)}`;
  }

  function renderWeeklyReview() {
    const range = weekRange();
    const planned = [];
    Object.entries(state.records).forEach(([date, record]) => {
      if (date < range.start || date > range.end || !Array.isArray(record?.tasks)) return;
      record.tasks.forEach((task) => planned.push({ task, plannedDate: date }));
    });
    Object.entries(state.weekends).forEach(([key, weekend]) => {
      if (!Array.isArray(weekend?.tasks)) return;
      weekend.tasks.forEach((task) => {
        const plannedDate = plannedDateForTask(key, task);
        if (plannedDate >= range.start && plannedDate <= range.end) planned.push({ task, plannedDate });
      });
    });
    const byDay = new Map();
    planned.forEach((entry) => {
      if (!byDay.has(entry.plannedDate)) byDay.set(entry.plannedDate, []);
      byDay.get(entry.plannedDate).push(entry.task);
    });
    const planDays = [...byDay.entries()].filter(([plannedDate, tasks]) => tasks.length
      && tasks.every((task) => task.status === "done"
        && (!task.completedDate || task.completedDate <= plannedDate))).length;
    const completed = planned.map((entry) => entry.task).filter((task) => task.status === "done");
    const estimated = completed.reduce((sum, task) => sum + estimatedMinutes(task), 0);
    const actual = completed.reduce((sum, task) => sum + taskActualMinutes(task), 0);
    elements.weeklyReviewRange.textContent = `${Number(range.start.slice(5, 7))}月${Number(range.start.slice(8, 10))}日—${Number(range.end.slice(5, 7))}月${Number(range.end.slice(8, 10))}日`;
    elements.weeklyPlanDays.textContent = `${planDays} 天`;
    elements.weeklyEstimatedTime.textContent = `${estimated} 分钟`;
    elements.weeklyActualTime.textContent = `${actual} 分钟`;
    if (!completed.length) {
      elements.weeklyReviewInsight.textContent = "完成几项作业后，我就能更了解自己的时间。";
      return;
    }
    const difference = actual - estimated;
    const tolerance = Math.max(5, Math.round(estimated * 0.2));
    elements.weeklyReviewInsight.textContent = Math.abs(difference) <= tolerance
      ? "这周的预计时间和实际时间很接近，我估得越来越准了。"
      : difference > 0
        ? `这些作业比预计多用了 ${difference} 分钟，下次我要给长作业多留一点时间。`
        : `这些作业比预计少用了 ${Math.abs(difference)} 分钟，我越来越了解自己的速度了。`;
  }

  function latestStatus(record) {
    if (record?.finishTime) return `${record.finishTime} 完成 · 有效 ${focusDuration(record)} 分钟`;
    if (record?.ruleId) return "旧版手动记录";
    if (record?.resumeTime) return `${record.resumeTime} 饭后继续，进行中`;
    if (record?.dinnerTime) return `${record.dinnerTime} 吃饭暂停`;
    if (record?.startTime) return `${record.startTime} 开始，进行中`;
    if (record?.ledgerConfirmed) return "成长记录册已补全";
    const dailyCheckins = [];
    if (sportsForRecord(record).length) dailyCheckins.push("运动");
    if (record?.readingDone) dailyCheckins.push("中文阅读");
    if (record?.mathThinkingDone) dailyCheckins.push("数学思维");
    if (record?.englishReadingDone) dailyCheckins.push("英文阅读");
    if (dailyCheckins.length) return `${dailyCheckins.join("、")}已打卡`;
    if (record?.choresDone) return "家务已打卡";
    return "尚未开始";
  }
  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }
  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function renderHistory() {
    const dailyEntries = datedRecords()
      .filter(([date, record]) => includeDailyInLedger(date, record))
      .map(([date, record]) => ({ type: "daily", date, record }));
    const weekendEntries = Object.entries(state.weekends)
      .filter(([, weekend]) => isWeekendMeaningful(weekend))
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
            : entry.weekend.planSaved && taskOrderSaved(date) ? "三天计划已制定，正在闯关"
              : entry.weekend.planSaved ? "等待确定闯关顺序" : "等待周五安排";
      const subStatus = entry.type === "daily"
        ? entry.record.note || (result ? result.label : "流程尚未完成")
        : result ? result.label : "按周五清单安排三天任务";
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
    const action = button.querySelector(".habit-action");
    if (action) action.textContent = selected ? "已完成" : "打卡";
  }

  function openWeekendPlanModal() {
    if (elements.weekendPlanEntry.hidden) return;
    elements.weekendPlanModal.hidden = false;
    document.body.classList.add("modal-open");
    elements.weekendPlanCloseButton.focus();
  }

  function closeWeekendPlanModal() {
    elements.weekendPlanModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openTaskEntryModal() {
    if (elements.taskEntryLauncher.hidden) return;
    editingPendingTaskId = null;
    setTaskDraftError();
    setSubjectPickerOpen(false);
    elements.taskEntryModal.hidden = false;
    document.body.classList.add("modal-open");
    renderTasks();
    (tasksForDate().length ? elements.taskEntryCloseButton : elements.taskDraft).focus();
  }

  function closeTaskEntryModal() {
    if (elements.taskEntryModal.hidden) return;
    setSubjectPickerOpen(false);
    elements.taskEntryModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function keepTaskEntryComposerFixed(taskId) {
    window.requestAnimationFrame(() => {
      if (elements.taskEntryModal.hidden) return;
      const addedRow = taskId
        ? [...elements.taskEntryPendingList.querySelectorAll("[data-pending-task-id]")]
          .find((row) => row.dataset.pendingTaskId === String(taskId))
        : null;
      if (addedRow) addedRow.scrollIntoView({ block: "nearest" });
      else elements.taskEntryPendingSection.scrollTop = elements.taskEntryPendingSection.scrollHeight;
      elements.taskDraft.focus();
      elements.taskDraft.setSelectionRange(elements.taskDraft.value.length, elements.taskDraft.value.length);
    });
  }

  function resizeTaskDraft() {
    elements.taskDraft.style.height = "42px";
    elements.taskDraft.style.height = `${Math.min(elements.taskDraft.scrollHeight, 72)}px`;
  }

  function setSubjectPickerOpen(open) {
    elements.subjectTabs.hidden = !open;
    elements.subjectPickerButton.setAttribute("aria-expanded", String(open));
  }

  function setTaskDraftError(message = "") {
    const hasError = Boolean(message);
    elements.taskDraftError.textContent = message || "先说出或输入作业内容";
    elements.taskDraftError.hidden = !hasError;
    elements.taskDraft.setAttribute("aria-invalid", String(hasError));
  }

  function openTaskStepsEditor(id) {
    const task = taskById(id);
    if (!task || task.status !== "pending") return showToast("作业开始后不能再修改步骤");
    stepEditorTaskId = String(id);
    elements.stepEditorTaskTitle.textContent = `${task.subject || "其他"} · ${task.title || "当前作业"}`;
    elements.stepEditorInput.value = taskSteps(task)
      .map((step, index) => `${index + 1}. ${step.title}`)
      .join("\n");
    elements.stepEditorModal.hidden = false;
    document.body.classList.add("modal-open");
    elements.stepEditorInput.focus();
    elements.stepEditorInput.setSelectionRange(elements.stepEditorInput.value.length, elements.stepEditorInput.value.length);
  }

  function closeTaskStepsEditor() {
    if (elements.stepEditorModal.hidden) return;
    elements.stepEditorModal.hidden = true;
    stepEditorTaskId = null;
    document.body.classList.remove("modal-open");
  }

  function openTaskEditor(id) {
    const task = taskById(id);
    if (!task || (task.status || "pending") !== "pending" || !taskOrderSaved()) {
      return showToast("排好顺序后，才能从卡片修改作业");
    }
    taskEditTaskId = String(id);
    elements.taskEditTitle.textContent = `修改${task.subject || ""}作业`;
    elements.taskEditInput.value = task.title || "";
    elements.taskEditEstimate.value = String(estimatedMinutes(task));
    elements.taskEditSteps.value = taskSteps(task)
      .map((step, index) => `${index + 1}. ${step.title}`)
      .join("\n");
    elements.taskEditModal.hidden = false;
    document.body.classList.add("modal-open");
    elements.taskEditInput.focus();
    elements.taskEditInput.setSelectionRange(elements.taskEditInput.value.length, elements.taskEditInput.value.length);
  }

  function closeTaskEditor() {
    if (elements.taskEditModal.hidden) return;
    elements.taskEditModal.hidden = true;
    taskEditTaskId = null;
    document.body.classList.remove("modal-open");
  }

  function openHistoryPage() {
    stopDictation(false, false);
    closeTaskEntryModal();
    closeWeekendPlanModal();
    closeTaskStepsEditor();
    closeTaskEditor();
    closeFocusModal();
    historyManageMode = false;
    document.body.classList.remove("history-manage-mode");
    elements.historyManageButton.setAttribute("aria-pressed", "false");
    elements.historyManageButton.textContent = "管理记录";
    renderHistory();
    elements.mainPage.hidden = true;
    elements.dictationPage.hidden = true;
    elements.settingsPage.hidden = true;
    elements.historyPage.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeHistoryPage() {
    historyManageMode = false;
    document.body.classList.remove("history-manage-mode");
    elements.historyPage.hidden = true;
    elements.mainPage.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function dictationLesson() {
    return DICTATION_LESSONS.find((lesson) => lesson.id === selectedDictationLesson) || DICTATION_LESSONS[0];
  }

  function customDictationWords(lessonId = selectedDictationLesson) {
    const words = state.dictationCustom[lessonId];
    return Array.isArray(words) ? words.filter((word) => typeof word === "string" && word.trim()) : [];
  }

  function dictationWordsForLesson(lesson = dictationLesson()) {
    return [...lesson.words, ...customDictationWords(lesson.id)];
  }

  function setDictationProgress(completed, total, current = null) {
    const percent = total ? Math.round(completed / total * 100) : 0;
    elements.dictationProgress.setAttribute("aria-valuenow", String(percent));
    elements.dictationProgressFill.style.width = `${percent}%`;
    elements.dictationProgressText.textContent = current === null ? `${completed} / ${total}` : `${current} / ${total}`;
  }

  function dictationWordGapMs(word) {
    return [...String(word).replace(/\s/g, "")].length === 4 ? 3000 : 2000;
  }

  function openDictationAudioDb() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("IndexedDB unavailable"));
    if (dictationAudioDbPromise) return dictationAudioDbPromise;
    dictationAudioDbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DICTATION_AUDIO_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DICTATION_AUDIO_STORE)) {
          db.createObjectStore(DICTATION_AUDIO_STORE, { keyPath: "word" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("无法打开录音数据库"));
    });
    return dictationAudioDbPromise;
  }

  async function loadDictationRecordingWords() {
    try {
      const db = await openDictationAudioDb();
      const keys = await new Promise((resolve, reject) => {
        const request = db.transaction(DICTATION_AUDIO_STORE).objectStore(DICTATION_AUDIO_STORE).getAllKeys();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("无法读取录音目录"));
      });
      dictationRecordingWords = new Set(keys.filter((key) => typeof key === "string"));
      dictationAudioReady = true;
    } catch (_) {
      dictationAudioStoreError = true;
    }
    renderDictation();
  }

  async function getDictationRecording(word) {
    const db = await openDictationAudioDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(DICTATION_AUDIO_STORE).objectStore(DICTATION_AUDIO_STORE).get(word);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error || new Error("无法读取录音"));
    });
  }

  async function saveDictationRecording(word, blob) {
    const db = await openDictationAudioDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(DICTATION_AUDIO_STORE, "readwrite");
      transaction.objectStore(DICTATION_AUDIO_STORE).put({ word, blob, updatedAt: Date.now() });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("无法保存录音"));
      transaction.onabort = () => reject(transaction.error || new Error("录音保存已取消"));
    });
    dictationRecordingWords.add(word);
  }

  async function removeDictationRecording(word) {
    const db = await openDictationAudioDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(DICTATION_AUDIO_STORE, "readwrite");
      transaction.objectStore(DICTATION_AUDIO_STORE).delete(word);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("无法删除录音"));
      transaction.onabort = () => reject(transaction.error || new Error("录音删除已取消"));
    });
    dictationRecordingWords.delete(word);
  }

  function dictationWordMarkup(word, index, customIndex = null) {
    const hasRecording = dictationRecordingWords.has(word);
    const recordingThisWord = dictationRecordingWord === word;
    const busy = Boolean(dictationRecordingWord || dictationSession?.running || !dictationAudioReady);
    const previewing = dictationPreview?.word === word;
    const status = recordingThisWord ? "正在录音，读完后点击停止"
      : hasRecording ? "已录音" : "未录音";
    const recordLabel = recordingThisWord ? "停止" : hasRecording ? "重录" : "录音";
    const recordClass = !hasRecording && !recordingThisWord ? "primary" : recordingThisWord ? "danger" : "";
    const disabled = busy && !recordingThisWord ? " disabled" : "";
    const previewActions = hasRecording && !recordingThisWord
      ? `<button type="button" data-dictation-action="preview" data-word-index="${index}"${busy ? " disabled" : ""}>${previewing ? "停止" : "试听"}</button><button class="danger" type="button" data-dictation-action="delete-recording" data-word-index="${index}"${busy ? " disabled" : ""}>删录音</button>`
      : "";
    const removeWordAction = customIndex === null ? ""
      : `<button type="button" data-dictation-action="delete-word" data-custom-word-index="${customIndex}"${busy ? " disabled" : ""}>删词语</button>`;
    return `<div class="dictation-word${customIndex === null ? "" : " custom"}"><div class="dictation-word-info"><span class="dictation-word-number">${index + 1}</span><span class="dictation-word-copy"><strong>${escapeHtml(word)}${customIndex === null ? "" : " · 自定义"}</strong><small>${status}</small></span></div><div class="dictation-word-actions"><button class="${recordClass}" type="button" data-dictation-action="record" data-word-index="${index}"${disabled}>${recordLabel}</button>${previewActions}${removeWordAction}</div></div>`;
  }

  function renderDictation() {
    const lesson = dictationLesson();
    const lessonIndex = DICTATION_LESSONS.findIndex((item) => item.id === lesson.id);
    const custom = customDictationWords(lesson.id);
    const words = [...lesson.words, ...custom];
    elements.dictationLessonSelect.value = lesson.id;
    elements.dictationLessonTitle.textContent = lesson.label;
    const recordedCount = words.filter((word) => dictationRecordingWords.has(word)).length;
    elements.dictationLessonCount.textContent = `已录 ${recordedCount} / ${words.length}`;
    const builtInHtml = lesson.words.map((word, index) => dictationWordMarkup(word, index)).join("");
    const customHtml = custom.map((word, index) => dictationWordMarkup(word, lesson.words.length + index, index)).join("");
    elements.dictationWords.innerHTML = builtInHtml + customHtml;
    const running = Boolean(dictationSession?.running);
    const recording = Boolean(dictationRecordingWord);
    elements.dictationLessonSelect.disabled = running || recording;
    elements.previousDictationLessonButton.disabled = running || recording || lessonIndex <= 0;
    elements.nextDictationLessonButton.disabled = running || recording || lessonIndex >= DICTATION_LESSONS.length - 1;
    elements.dictationWordInput.disabled = running || recording;
    elements.addDictationWordsButton.disabled = running || recording;
    elements.dictationWordBank.hidden = running;
    elements.dictationHiddenWords.hidden = !running;
    elements.startDictationButton.hidden = running;
    elements.startDictationButton.disabled = recording || !dictationAudioReady || recordedCount !== words.length;
    elements.stopDictationButton.hidden = !running;
    if (!running && !elements.dictationStatus.dataset.result) {
      elements.dictationStatus.textContent = dictationAudioStoreError
        ? "当前浏览器无法保存词语录音"
        : !dictationAudioReady
          ? "正在读取本机录音…"
          : recording
            ? `正在录制「${dictationRecordingWord}」`
            : recordedCount === words.length
              ? "本课人声已录齐，可以开始听写"
              : `还有 ${words.length - recordedCount} 个词语未录音`;
      elements.dictationTimingHint.textContent = recording
        ? "清楚地读一遍，读完点击“停止”保存；单个词最长录制10秒。"
        : "使用逐词人工录制的语音；每个词连续播放两遍，两遍间隔1秒，四字词后停3秒，其余词语停2秒。";
      setDictationProgress(0, words.length);
    }
  }

  function selectDictationLesson(lessonId) {
    if (dictationSession?.running || dictationRecordingWord
      || !DICTATION_LESSONS.some((lesson) => lesson.id === lessonId)) return;
    stopDictationPreview();
    stopDictation(false, false);
    selectedDictationLesson = lessonId;
    state.dictationLesson = lessonId;
    persist();
    delete elements.dictationStatus.dataset.result;
    renderDictation();
  }

  function moveDictationLesson(offset) {
    const index = DICTATION_LESSONS.findIndex((lesson) => lesson.id === selectedDictationLesson);
    const target = DICTATION_LESSONS[index + offset];
    if (target) selectDictationLesson(target.id);
  }

  function stopDictationPreview(shouldRender = false) {
    const preview = dictationPreview;
    dictationPreview = null;
    if (preview) {
      preview.audio.pause();
      preview.audio.removeAttribute("src");
      URL.revokeObjectURL(preview.url);
    }
    if (shouldRender) renderDictation();
  }

  function preferredDictationMimeType() {
    if (typeof window.MediaRecorder !== "function" || typeof window.MediaRecorder.isTypeSupported !== "function") return "";
    return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
      .find((type) => window.MediaRecorder.isTypeSupported(type)) || "";
  }

  async function beginDictationWordRecording(word) {
    if (dictationRecordingWord || dictationSession?.running) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder !== "function") {
      showToast("当前浏览器不支持录音，请使用最新版 Chrome 或 Edge");
      return;
    }
    stopDictationPreview();
    dictationRecordingWord = word;
    delete elements.dictationStatus.dataset.result;
    renderDictation();

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (_) {
      if (dictationRecordingWord === word) dictationRecordingWord = null;
      renderDictation();
      showToast("无法使用麦克风，请允许浏览器录音权限后重试");
      return;
    }
    if (dictationRecordingWord !== word) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const chunks = [];
    const mimeType = preferredDictationMimeType();
    let recorder;
    try {
      recorder = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (_) {
      stream.getTracks().forEach((track) => track.stop());
      dictationRecordingWord = null;
      renderDictation();
      showToast("浏览器无法创建录音，请换用最新版 Chrome 或 Edge");
      return;
    }

    dictationRecorder = recorder;
    dictationRecordingStream = stream;
    dictationRecordingStartedAt = Date.now();
    dictationRecordingSaveOnStop = false;
    dictationRecordingNotifyOnStop = false;
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };
    recorder.onerror = () => {
      dictationRecordingSaveOnStop = false;
      dictationRecordingNotifyOnStop = false;
      if (recorder.state !== "inactive") recorder.stop();
      showToast("词语录音失败，请重试");
    };
    recorder.onstop = async () => {
      const longEnough = Date.now() - dictationRecordingStartedAt >= DICTATION_RECORDING_MIN_MS;
      const shouldSave = dictationRecordingSaveOnStop && longEnough;
      const shouldNotify = dictationRecordingNotifyOnStop;
      clearTimeout(dictationRecordingLimitTimer);
      dictationRecordingLimitTimer = null;
      stream.getTracks().forEach((track) => track.stop());
      if (dictationRecorder === recorder) dictationRecorder = null;
      if (dictationRecordingStream === stream) dictationRecordingStream = null;
      if (dictationRecordingWord === word) dictationRecordingWord = null;
      dictationRecordingSaveOnStop = false;
      dictationRecordingNotifyOnStop = false;

      let saved = false;
      let saveFailed = false;
      if (shouldSave) {
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
        if (blob.size > 0) {
          try {
            await saveDictationRecording(word, blob);
            saved = true;
          } catch (_) {
            saveFailed = true;
            showToast("无法保存录音，请检查浏览器存储权限");
          }
        }
      }
      renderDictation();
      if (shouldNotify && !saved && !saveFailed) showToast("录音时间太短，请重新录制");
      else if (shouldNotify && saved) {
        showToast(`“${word}”的录音已保存，正在自动试听`);
        await toggleDictationWordPreview(word);
      }
    };

    recorder.start();
    dictationRecordingLimitTimer = setTimeout(
      () => stopDictationWordRecording(true, true),
      DICTATION_RECORDING_LIMIT_MS
    );
    renderDictation();
  }

  function stopDictationWordRecording(keepRecording = true, notify = true) {
    const recorder = dictationRecorder;
    if (!recorder) {
      dictationRecordingWord = null;
      renderDictation();
      return;
    }
    dictationRecordingSaveOnStop = keepRecording;
    dictationRecordingNotifyOnStop = notify;
    if (recorder.state !== "inactive") recorder.stop();
  }

  function toggleDictationWordRecording(word) {
    if (dictationRecordingWord === word) {
      stopDictationWordRecording(true, true);
      return;
    }
    beginDictationWordRecording(word);
  }

  async function toggleDictationWordPreview(word) {
    if (dictationRecordingWord || dictationSession?.running) return;
    if (dictationPreview?.word === word) {
      stopDictationPreview(true);
      return;
    }
    stopDictationPreview();
    try {
      const blob = await getDictationRecording(word);
      if (!blob) {
        dictationRecordingWords.delete(word);
        renderDictation();
        showToast("这个词还没有录音");
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      dictationPreview = { word, audio, url };
      audio.onended = () => {
        if (dictationPreview?.audio === audio) stopDictationPreview(true);
      };
      audio.onerror = () => {
        if (dictationPreview?.audio === audio) stopDictationPreview(true);
        showToast("无法播放这条词语录音");
      };
      await audio.play();
      renderDictation();
    } catch (_) {
      stopDictationPreview(true);
      showToast("无法播放这条词语录音");
    }
  }

  async function deleteDictationWordRecording(word) {
    if (!window.confirm(`确定删除“${word}”的录音吗？`)) return;
    if (dictationPreview?.word === word) stopDictationPreview();
    try {
      await removeDictationRecording(word);
      delete elements.dictationStatus.dataset.result;
      renderDictation();
      showToast("词语录音已删除");
    } catch (_) {
      showToast("无法删除词语录音");
    }
  }

  function releaseDictationSessionAudio(session) {
    if (!session) return;
    if (session.audio) {
      session.audio.pause();
      session.audio.removeAttribute("src");
      session.audio = null;
    }
    if (session.audioUrl) {
      URL.revokeObjectURL(session.audioUrl);
      session.audioUrl = null;
    }
  }

  function stopDictation(completed = false, notify = true) {
    const session = dictationSession;
    if (!session) return;
    if (session?.timer) clearTimeout(session.timer);
    if (session) session.running = false;
    releaseDictationSessionAudio(session);
    dictationSession = null;
    if (!elements.dictationStatus) return;
    const total = session?.words.length || dictationWordsForLesson().length;
    elements.dictationStatus.dataset.result = "true";
    elements.dictationStatus.textContent = completed ? `听写完成，共 ${total} 个词语！` : "听写已停止";
    elements.dictationTimingHint.textContent = completed ? "太棒了，我可以打开词语表自己核对啦！" : "可以重新选择课程，准备好后再次开始。";
    setDictationProgress(completed ? total : session?.index || 0, total);
    renderDictation();
    if (notify && completed) showToast("听写完成，我来认真核对一下");
  }

  function handleDictationAudioDone(session, nextWordGap) {
    if (dictationSession !== session || !session.running) return;
    if (session.repeat === 0) {
      session.repeat = 1;
      elements.dictationStatus.textContent = `第 ${session.index + 1} 个词语 · 1秒后再播放一遍`;
      session.timer = setTimeout(playCurrentDictationWord, 1000);
      return;
    }
    if (session.index + 1 >= session.words.length) {
      stopDictation(true);
      return;
    }
    session.index += 1;
    session.repeat = 0;
    elements.dictationStatus.textContent = `已完成 ${session.index} 个 · ${nextWordGap / 1000}秒后下一个词语`;
    setDictationProgress(session.index, session.words.length);
    session.timer = setTimeout(playCurrentDictationWord, nextWordGap);
  }

  async function playCurrentDictationWord() {
    const session = dictationSession;
    if (!session?.running) return;
    const word = session.words[session.index];
    const repeatNumber = session.repeat + 1;
    const nextWordGap = dictationWordGapMs(word);
    elements.dictationStatus.textContent = `第 ${session.index + 1} 个词语 · 正在播放录音第 ${repeatNumber} 遍`;
    elements.dictationTimingHint.textContent = repeatNumber === 1
      ? "我要认真听，1秒后会再播放一遍。"
      : session.index + 1 >= session.words.length
        ? "这是最后一个词，我写完就可以核对啦。"
        : `我写下这个词，${nextWordGap / 1000}秒后进入下一个。`;
    setDictationProgress(session.index, session.words.length, session.index + 1);
    try {
      const blob = await getDictationRecording(word);
      if (dictationSession !== session || !session.running) return;
      if (!blob) {
        dictationRecordingWords.delete(word);
        stopDictation(false, false);
        showToast(`“${word}”的录音不存在，请重新录制`);
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      session.audio = audio;
      session.audioUrl = url;
      audio.onended = () => {
        if (dictationSession !== session || !session.running || session.audio !== audio) return;
        releaseDictationSessionAudio(session);
        handleDictationAudioDone(session, nextWordGap);
      };
      audio.onerror = () => {
        if (dictationSession !== session || session.audio !== audio) return;
        releaseDictationSessionAudio(session);
        stopDictation(false, false);
        showToast(`无法播放“${word}”的录音，请重新录制`);
      };
      await audio.play();
    } catch (_) {
      if (dictationSession !== session || !session.running) return;
      releaseDictationSessionAudio(session);
      stopDictation(false, false);
      showToast(`无法播放“${word}”的录音，请重新录制`);
    }
  }

  function startDictation() {
    if (!dictationAudioReady) return showToast("本机录音还未准备好，请稍后重试");
    const words = dictationWordsForLesson();
    if (!words.length) return showToast("请先添加听写词语");
    const missing = words.filter((word) => !dictationRecordingWords.has(word));
    if (missing.length) return showToast(`还有 ${missing.length} 个词未录音，请先录制“${missing[0]}”`);
    stopDictationPreview();
    stopDictation(false, false);
    delete elements.dictationStatus.dataset.result;
    dictationSession = { words, index: 0, repeat: 0, timer: null, audio: null, audioUrl: null, running: true };
    renderDictation();
    playCurrentDictationWord();
  }

  function addDictationWords() {
    const lesson = dictationLesson();
    const entered = elements.dictationWordInput.value.trim().split(/[\s,，、;；]+/).filter(Boolean);
    if (!entered.length) return showToast("请先输入要添加的词语");
    const existing = new Set(dictationWordsForLesson(lesson));
    const additions = entered.filter((word) => !existing.has(word) && (existing.add(word), true));
    if (!additions.length) return showToast("这些词语已经在本课词语表中");
    state.dictationCustom[lesson.id] = customDictationWords(lesson.id).concat(additions);
    elements.dictationWordInput.value = "";
    persist();
    delete elements.dictationStatus.dataset.result;
    renderDictation();
    showToast(`已添加 ${additions.length} 个词语`);
  }

  function openDictationPage() {
    closeTaskEntryModal();
    closeWeekendPlanModal();
    closeTaskEditor();
    closeFocusModal();
    elements.historyPage.hidden = true;
    elements.settingsPage.hidden = true;
    elements.mainPage.hidden = true;
    elements.dictationPage.hidden = false;
    renderDictation();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeDictationPage() {
    stopDictation(false, false);
    stopDictationWordRecording(false, false);
    stopDictationPreview();
    elements.dictationPage.hidden = true;
    elements.mainPage.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderWeekend() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const weekendMode = Boolean(key);
    elements.weekendPlanEntry.hidden = !weekendMode;
    elements.weekendTaskPlanner.hidden = !weekendMode;
    if (!weekendMode) {
      closeWeekendPlanModal();
      return;
    }

    const weekend = weekendForDate(date) || {};
    const tasks = tasksForDate(date);
    const saturday = addDays(key, 1);
    const sunday = addDays(key, 2);
    const isFriday = date === key;
    const executionStarted = tasks.some((task) => (task.status || "pending") !== "pending");
    const fridayTasks = tasks.filter((task) => plannedDayForTask(task) === "friday");
    const saturdayTasks = tasks.filter((task) => plannedDayForTask(task) === "saturday");
    const sundayTasks = tasks.filter((task) => plannedDayForTask(task) === "sunday");
    const completed = (items) => items.filter((task) => task.status === "done").length;
    const orderSaved = taskOrderSaved(date);

    elements.weekendPlanEntryTitle.textContent = isFriday ? "周五安排与闯关" : "查看三天作业计划";
    elements.weekendPlanEntryStatus.textContent = !weekend.confirmed
      ? "确认作业清单后，再从这里开始安排"
      : !weekend.planSaved ? "待分配到周五、周六或周日"
        : !orderSaved ? "完成日已分配，接着安排闯关顺序"
          : `周五 ${fridayTasks.length} 项 · 周六 ${saturdayTasks.length} 项 · 周日 ${sundayTasks.length} 项`;
    elements.weekendPlanEntry.classList.toggle("needs-action", isFriday && weekend.confirmed && (!weekend.planSaved || !orderSaved));

    elements.weekendPlannerKicker.textContent = isFriday ? "周五安排与闯关" : "周五计划已自动带入";
    elements.weekendPlannerTitle.textContent = isFriday ? "给每项作业安排完成日期" : `今天按${date === saturday ? "周六" : "周日"}计划完成`;
    elements.weekendPlannerHelp.textContent = isFriday
      ? "默认安排在周六；挑一部分放到今天完成，其余再分到周末。"
      : `这份清单来自 ${formatDate(key)}（周五），今天不需要重新录入。`;
    elements.weekendPlanSummary.textContent = weekend.planSaved
      ? `周五 ${fridayTasks.length} 项 · 周六 ${saturdayTasks.length} 项 · 周日 ${sundayTasks.length} 项` : "尚未保存";

    if (isFriday && weekend.confirmed && tasks.length) {
      elements.weekendTaskPlanList.innerHTML = tasks.map((task) => {
        const day = plannedDayForTask(task);
        const disabled = executionStarted ? " disabled" : "";
        const subject = task.subject || "其他";
        return `<div class="weekend-plan-row" data-subject="${escapeHtml(subject)}">
          <div class="weekend-plan-copy"><strong><span class="subject-badge">${escapeHtml(subject)}</span>${escapeHtml(task.title || "未命名作业")}</strong><small>选择计划完成日</small></div>
          <div class="plan-day-tabs" role="group" aria-label="${escapeHtml(task.title || "作业")}计划日期">
            <button type="button" data-plan-day="friday" data-task-id="${escapeHtml(String(task.id))}" aria-pressed="${day === "friday"}"${disabled}>周五</button>
            <button type="button" data-plan-day="saturday" data-task-id="${escapeHtml(String(task.id))}" aria-pressed="${day === "saturday"}"${disabled}>周六</button>
            <button type="button" data-plan-day="sunday" data-task-id="${escapeHtml(String(task.id))}" aria-pressed="${day === "sunday"}"${disabled}>周日</button>
          </div>
        </div>`;
      }).join("");
    } else if (!isFriday && weekend.planSaved) {
      elements.weekendTaskPlanList.innerHTML = `<div class="weekend-plan-row">
          <div class="weekend-plan-copy"><strong>周五计划</strong><small>已完成 ${completed(fridayTasks)} / ${fridayTasks.length} 项</small></div><span class="plan-day-badge">${fridayTasks.length} 项</span>
        </div><div class="weekend-plan-row${date === saturday ? " today" : ""}">
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
        : executionStarted && isFriday ? "三天计划已经开始执行，安排已锁定。"
          : isFriday && !orderSaved ? "日期已安排，关闭弹窗后排好三天的闯关顺序。"
            : isFriday ? `安排好啦，今天先完成周五的 ${fridayTasks.length} 项。`
          : date === saturday ? `今天优先完成周六的 ${saturdayTasks.length} 项。`
            : date === sunday ? `今天完成周日的 ${sundayTasks.length} 项，并补齐未完成项。` : "安排保存后，三天会按计划显示。";

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

  function taskAddedKey(task, fallbackIndex) {
    const idMatch = String(task.id || "").match(/^(\d+)(?:-(\d+))?$/);
    const addedAt = Number(task.addedAt) || Number(idMatch?.[1]) || Number.MAX_SAFE_INTEGER;
    const sequence = Number.isFinite(Number(task.addedSequence))
      ? Number(task.addedSequence) : Number(idMatch?.[2]) || 0;
    return { addedAt, sequence, fallbackIndex };
  }

  function pendingTaskOrder(tasks) {
    const subjectRanks = new Map(TASK_SUBJECTS.map((subject, index) => [subject, index]));
    return tasks.map((task, index) => ({
      task,
      rank: subjectRanks.get(task.subject) ?? TASK_SUBJECTS.length,
      ...taskAddedKey(task, index)
    })).sort((left, right) => left.rank - right.rank
      || left.addedAt - right.addedAt
      || left.sequence - right.sequence
      || left.fallbackIndex - right.fallbackIndex)
      .map(({ task }) => task);
  }

  function pendingTaskGroups(tasks) {
    const groups = new Map();
    pendingTaskOrder(tasks).forEach((task) => {
      const subject = task.subject || "其他";
      if (!groups.has(subject)) groups.set(subject, []);
      groups.get(subject).push(task);
    });
    return [...groups.entries()];
  }

  function pendingTaskRow(task) {
    const id = escapeHtml(String(task.id));
    if (String(editingPendingTaskId || "") === String(task.id)) {
      return `<div class="pending-task-row" data-subject="${escapeHtml(task.subject || "其他")}" data-pending-task-id="${id}">
        <input class="pending-task-edit-input" data-pending-edit-id="${id}" maxlength="120" value="${escapeAttribute(task.title || "")}" aria-label="修改${escapeAttribute(task.subject || "作业")}内容">
        <div class="pending-task-actions">
          ${taskButton("保存", "save-edit", task.id)}
          ${taskButton("取消", "cancel-edit", task.id)}
        </div>
      </div>`;
    }
    return `<div class="pending-task-row" data-subject="${escapeHtml(task.subject || "其他")}" data-pending-task-id="${id}">
      <strong class="pending-task-title">${escapeHtml(task.title || "未命名作业")}</strong>
      <div class="pending-task-actions">
        ${taskButton("修改", "edit", task.id)}
        ${taskButton("删除", "delete", task.id, "danger-task-action")}
      </div>
    </div>`;
  }

  function pendingTaskListHtml(tasks) {
    return pendingTaskGroups(tasks).map(([subject, groupTasks]) => `<section class="pending-subject-group" data-subject="${escapeHtml(subject)}">
      <div class="pending-subject-heading"><strong>${escapeHtml(subject)}</strong><span>${groupTasks.length} 项</span></div>
      <div class="pending-subject-tasks">${groupTasks.map(pendingTaskRow).join("")}</div>
    </section>`).join("");
  }

  function renderTasks() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const weekend = key ? weekendForDate(date) || {} : null;
    const isFriday = Boolean(key && date === key);
    const canEditList = !key || isFriday;
    const ledgerReady = key && !isFriday ? true : Boolean(recordFor(date)?.ledgerConfirmed);
    const tasks = tasksForDate(date);
    const owner = taskOwnerForDate(date);
    const confirmed = taskListConfirmed(date);
    const doneCount = tasks.filter((task) => task.status === "done").length;
    const active = activeTaskForDate(date);
    const orderSaved = taskOrderSaved(date);
    const allPending = tasks.every((task) => (task.status || "pending") === "pending");
    const canArrangeOrder = confirmed && canEditList && allPending && (!key || weekend.planSaved);
    const sortingMode = canArrangeOrder && !orderSaved;
    const orderPendingWeekend = confirmed && Boolean(key && !isFriday && weekend.planSaved && !orderSaved);
    const canEnterTasks = !confirmed && canEditList && ledgerReady;
    elements.taskPanel.hidden = !ledgerReady && !confirmed && tasks.length === 0;
    elements.taskEntryLauncher.hidden = !canEnterTasks;
    elements.taskEntry.hidden = !canEnterTasks;
    const entryStatus = tasks.length
      ? `已录入 ${tasks.length} 项，可继续补充其他科目`
      : "选择科目，语音或文字录入";
    elements.taskEntryLauncherStatus.textContent = entryStatus;
    if (!canEnterTasks) closeTaskEntryModal();
    elements.emptyTaskList.hidden = tasks.length > 0 || canEnterTasks;
    elements.emptyTaskList.textContent = key && !isFriday
      ? "周五还没有录入作业清单，请回到周五完成录入和安排。"
      : ledgerReady ? "还没有作业，点击“录入作业”开始。" : "核对钉钉并补全成长记录册后，再录入作业。";
    elements.taskListFooter.hidden = !confirmed;
    elements.confirmTaskListButton.hidden = !confirmed || !canEditList || !allPending;
    elements.confirmTaskListButton.textContent = "修改作业清单";
    elements.taskOrderButton.hidden = !canArrangeOrder;
    elements.taskOrderButton.textContent = sortingMode ? "确定顺序，开始闯关" : "调整闯关顺序";
    elements.taskOrderButton.className = sortingMode
      ? "primary-button compact-button" : "text-button bordered compact-order-button";
    const currentRecordData = recordFor(date) || {};
    elements.taskConfirmHint.textContent = sortingMode
      ? key ? "分别排好周五、周六、周日的顺序，确定后就按计划闯关。" : "拖动作业，或使用箭头排好顺序，再确定开始。"
      : orderPendingWeekend ? "周末顺序还没有确定，请回到周五完成最后一步。"
      : key && isFriday && orderSaved ? "周末完成日期和三天顺序都安排好了。"
      : !canEditList
      ? weekend?.planSaved ? "清单来自周五，按计划日期逐项完成。" : "请先回到周五保存周末安排。"
      : !ledgerReady ? "第 1 步：核对钉钉，补全成长记录册。"
        : confirmed
      ? doneCount === tasks.length && tasks.length
        ? key ? "周末清单已全部完成并自动结算。"
          : currentRecordData.finishTime ? "最后一项完成时已自动结算。" : "清单已完成，补全成长记录册后自动结算。"
        : key ? "清单已确认；点击下方“周五安排与闯关”，给每项作业选择完成日。" : "清单已确认；一次只开始一项。"
      : tasks.length ? "核对无误后再确认清单。" : "点击“录入作业”添加完整清单。";
    const questMode = confirmed && orderSaved && (!key || weekend.planSaved);
    const questTasks = !questMode ? tasks : !key ? tasks
      : date === key
        ? tasks.filter((task) => plannedDayForTask(task) === "friday")
        : date === addDays(key, 1)
          ? [
            ...tasks.filter((task) => plannedDayForTask(task) === "friday"
              && (task.status !== "done" || task.completedDate === date)),
            ...tasks.filter((task) => plannedDayForTask(task) === "saturday")
          ]
          : [
            ...tasks.filter((task) => (plannedDayForTask(task) === "friday" || plannedDayForTask(task) === "saturday")
              && (task.status !== "done" || task.completedDate === date)),
            ...tasks.filter((task) => plannedDayForTask(task) === "sunday")
          ];
    const questDone = questTasks.filter((task) => task.status === "done");
    const questRemaining = questTasks.filter((task) => task.status !== "done");
    const progressTotal = questMode ? questTasks.length : tasks.length;
    const progressDone = questMode ? questDone.length : doneCount;
    elements.taskPanelTitle.textContent = !confirmed
      ? ledgerReady ? "" : "先核对今天的作业"
      : sortingMode ? ""
      : orderPendingWeekend ? "还差一步：确定顺序"
        : "我选一项，轻松开始！";
    elements.taskPanelHelp.textContent = !confirmed
      ? ""
      : sortingMode
      ? ""
      : orderPendingWeekend ? "请回到周五排好顺序，再开始周末作业。"
        : "我一次专心做一项，每完成一项都在前进！";
    elements.taskPanelTitle.hidden = questMode || sortingMode || (!confirmed && ledgerReady);
    elements.taskPanelHelp.hidden = questMode || !elements.taskPanelHelp.textContent;
    elements.taskSummary.textContent = !confirmed && tasks.length
      ? `已录 ${tasks.length} 项` : progressTotal ? questMode ? `${progressDone} / ${progressTotal}` : `${progressDone} / ${progressTotal} 项完成` : "0 项";
    elements.activeTaskBanner.hidden = !active || questMode;
    if (active) {
      elements.activeTaskTitle.textContent = `${active.subject} · ${active.title}`;
      elements.activeTaskTime.textContent = `已专注 ${taskDurationLabel(active)}`;
    }

    const canDoTaskToday = (task) => !key || (weekend.planSaved
      && (date === key ? plannedDayForTask(task) === "friday"
        : date === addDays(key, 1) ? plannedDayForTask(task) !== "sunday" : true));
    const questCurrent = questMode
      ? active || questRemaining.find((task) => task.status === "paused") || questRemaining[0] || null
      : null;
    const suggestedTask = active ? null : questCurrent
      || tasks.find((task) => (task.status || "pending") === "pending" && canDoTaskToday(task));

    const taskCard = (task, options = {}) => {
      const status = task.status || "pending";
      const editable = questMode && status === "pending";
      let buttons = "";
      const canDoToday = canDoTaskToday(task);
      const allowActions = options.allowActions !== false;
      const steps = taskSteps(task);
      const step = currentTaskStep(task);
      if (options.sortable) {
        buttons = `<button class="order-arrow" type="button" data-order-action="up" data-task-id="${escapeHtml(String(task.id))}" aria-label="向前移动"${options.moveUp ? "" : " disabled"}>↑</button>
          <button class="order-arrow" type="button" data-order-action="down" data-task-id="${escapeHtml(String(task.id))}" aria-label="向后移动"${options.moveDown ? "" : " disabled"}>↓</button>`;
      } else if (confirmed && canDoToday && allowActions) {
        if (status === "active") {
          buttons = taskButton("休息一下", "pause", task.id) + taskButton(step ? "完成本步" : "完成", "complete", task.id, "primary-task-action");
        } else if (status === "paused") {
          buttons = taskButton("继续", "start", task.id, "primary-task-action") + taskButton(step ? "完成本步" : "完成", "complete", task.id);
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
      const estimateText = `预计 ${estimatedMinutes(task)} 分钟`;
      const stepText = taskStepSummary(task);
      let meta = options.sortable ? `拖动或用箭头排序${stepText ? ` · ${stepText}` : ""}`
        : status === "done"
        ? `${task.completedDate ? `${formatDate(task.completedDate)} ` : ""}${task.completedAt || "已"} 完成 · ${estimateText} · 实际 ${taskActualMinutes(task)} 分钟${stepText ? ` · ${stepText}` : ""}`
        : status === "active" ? `${estimateText} · 已用 ${taskDurationLabel(task)}${stepText ? ` · ${stepText}` : ""}`
          : status === "paused" ? `${estimateText} · 已用 ${taskDurationLabel(task)}${stepText ? ` · ${stepText}` : ""}`
            : key && weekend.planSaved && !canDoToday ? `计划${plannedDayLabel(task)}完成 · ${estimateText}` : `${estimateText}${stepText ? ` · ${stepText}` : ""}`;
      if (task.breakAfter && status !== "done") meta += " · ☕ 完成后休息";
      const planBadge = key && weekend.planSaved ? `<span class="task-plan-badge">${plannedDayLabel(task)}</span>` : "";
      const plannedToday = key && plannedDateForTask(key, task) === date;
      const planningTools = options.sortable ? `<div class="task-planning-tools">
        <label>预计用时<select data-estimate-task-id="${escapeHtml(String(task.id))}" aria-label="${escapeHtml(task.title || "作业")}预计用时">${ESTIMATE_OPTIONS.map((minutes) => `<option value="${minutes}"${estimatedMinutes(task) === minutes ? " selected" : ""}>${minutes} 分钟</option>`).join("")}</select></label>
        <button type="button" data-plan-action="steps" data-task-id="${escapeHtml(String(task.id))}">${steps.length ? "修改步骤" : "拆成步骤"}</button>
        <button type="button" data-break-after="${escapeHtml(String(task.id))}" class="${task.breakAfter ? "break-selected" : ""}">${task.breakAfter ? "✓ 休息点" : "设为休息点"}</button>
        ${!key ? `<button type="button" data-meal-after="${escapeHtml(String(task.id))}" class="${String(owner?.mealAfterTaskId || "") === String(task.id) ? "selected" : ""}">${String(owner?.mealAfterTaskId || "") === String(task.id) ? "✓ 饭前到这里" : "饭前到这里"}</button>` : ""}
      </div>` : "";
      const stepsHtml = options.current && steps.length ? `<ol class="task-step-list">${steps.map((item) => `<li class="${item.done ? "done" : item === step ? "current" : ""}"><span>${item.done ? "✓" : item === step ? "→" : ""}</span>${escapeHtml(item.title)}</li>`).join("")}</ol>` : "";
      const mealDivider = options.sortable && !key && String(owner?.mealAfterTaskId || "") === String(task.id)
        ? `<div class="meal-divider"><span>🍚</span><strong>吃饭</strong><small>饭后从下一项继续</small></div>` : "";
      const breakDivider = options.sortable && task.breakAfter
        ? `<div class="break-divider"><span>☕</span><strong>我的休息点</strong><small>完成上面这项后，我安排一次休息</small></div>` : "";
      const editAttributes = editable
        ? ` data-edit-task-id="${escapeHtml(String(task.id))}" tabindex="0" aria-label="修改${escapeAttribute(task.title || "当前作业")}"`
        : "";
      return `<article class="task-item ${status}${plannedToday ? " planned-today" : ""}${options.current ? " quest-current-card" : ""}${options.compact ? " quest-compact-card" : ""}${options.sortable ? " sortable" : ""}${editable ? " editable-task-card" : ""}" data-subject="${escapeHtml(task.subject || "其他")}"${options.sortable ? ` data-sort-task-id="${escapeHtml(String(task.id))}"` : ""}${editAttributes}>
        <div class="task-main-row">
          ${options.sortable ? `<button class="drag-handle" type="button" data-drag-handle aria-label="按住拖动作业排序" title="按住拖动">⠿</button><span class="order-number">${options.orderNumber}</span>` : ""}
          <div class="task-copy">
            <span class="subject-badge">${escapeHtml(task.subject || "其他")}</span><strong class="task-title">${escapeHtml(task.title || "未命名作业")}</strong>${editable ? '<span class="task-edit-mark" aria-hidden="true">✎</span>' : ""}${planBadge}
            <small class="task-meta">${escapeHtml(meta)}</small>
          </div>
          <div class="task-buttons">${buttons}</div>
        </div>
        ${stepsHtml}${planningTools}
      </article>${breakDivider}${mealDivider}`;
    };

    const pendingTasks = pendingTaskOrder(tasks);
    elements.taskEntryComposer.hidden = !canEnterTasks;
    elements.taskEntry.classList.toggle("has-pending", canEnterTasks && !confirmed && canEditList && pendingTasks.length > 0);
    elements.taskEntryEmpty.hidden = !canEnterTasks || confirmed || !canEditList || pendingTasks.length > 0;
    elements.taskEntryPendingSection.hidden = !canEnterTasks || confirmed || !canEditList || pendingTasks.length === 0;
    elements.taskEntryPendingSummary.textContent = `${pendingTasks.length} 项`;
    elements.taskEntryPendingList.innerHTML = confirmed ? ""
      : pendingTaskListHtml(pendingTasks);
    const canUndoDelete = Boolean(lastDeletedTask && lastDeletedTask.date === date && !confirmed && canEditList);
    elements.taskEntryUndoDeleteButton.hidden = !canUndoDelete;
    elements.taskEntryStickyFooter.hidden = !canEnterTasks || confirmed || !canEditList || pendingTasks.length === 0;

    if (!confirmed) {
      elements.taskList.innerHTML = "";
      return;
    }

    if (sortingMode) {
      const groupHtml = (label, groupTasks, help) => groupTasks.length ? `<section class="order-group">
        ${label ? `<div class="order-group-title"><strong>${label}</strong><small>${help}</small></div>` : ""}
        ${groupTasks.map((task, index) => taskCard(task, {
          sortable: true, orderNumber: index + 1, moveUp: index > 0, moveDown: index < groupTasks.length - 1
        })).join("")}</section>` : "";
      const orderBody = key
        ? groupHtml("周五闯关顺序", tasks.filter((task) => plannedDayForTask(task) === "friday"), "放学后先完成这一部分")
          + groupHtml("周六闯关顺序", tasks.filter((task) => plannedDayForTask(task) === "saturday"), "完成周六计划")
          + groupHtml("周日闯关顺序", tasks.filter((task) => plannedDayForTask(task) === "sunday"), "周日按这个顺序完成")
        : groupHtml("", tasks, "");
      elements.taskSummary.textContent = `${tasks.length} 关待安排`;
      elements.activeTaskBanner.hidden = true;
      const totalEstimate = tasks.reduce((sum, task) => sum + estimatedMinutes(task), 0);
      const breakPointCount = tasks.filter((task) => task.breakAfter).length;
      elements.taskList.innerHTML = `<div class="order-intro">预计净学习 ${totalEstimate} 分钟。排好顺序，并设置最多两个休息点（已选 ${breakPointCount} 个）${key ? "。" : "；还可以选择饭前完成到哪一项。"}</div>${orderBody}`;
      return;
    }

    if (!questMode) {
      elements.taskList.innerHTML = tasks.map((task) => taskCard(task, { allowActions: !orderPendingWeekend })).join("");
      return;
    }

    const progress = progressTotal ? Math.round(progressDone / progressTotal * 100) : 100;
    const remainingMinutes = remainingEstimatedMinutes(questRemaining);
    const mealBoundary = !key && owner?.mealAfterTaskId
      ? tasks.findIndex((task) => String(task.id) === String(owner.mealAfterTaskId)) : -1;
    const currentIndex = questCurrent ? tasks.indexOf(questCurrent) : -1;
    const mealPhase = mealBoundary >= 0 && currentIndex >= 0
      ? currentIndex <= mealBoundary ? "饭前计划" : "饭后计划" : "今日计划";
    const progressHtml = `<div class="quest-progress${progress === 100 ? " complete" : ""}">
      <div class="quest-progress-track" role="progressbar" aria-label="今日作业进度：已完成 ${progressDone} 项，共 ${progressTotal} 项" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i style="width:${progress}%"></i></div>
      ${progress < 100 ? `<div class="quest-time-summary"><span>${mealPhase}</span><strong>预计还需 ${remainingMinutes} 分钟</strong></div>` : ""}
    </div>`;

    if (progress === 100) {
      const completedHtml = questDone.length
        ? `<button class="quest-toggle" type="button" data-list-toggle="completed">${completedTasksExpanded ? "收起已完成作业" : `看看闯过的 ${questDone.length} 关`} <span>${completedTasksExpanded ? "⌃" : "⌄"}</span></button>
          ${completedTasksExpanded ? `<div class="quest-collapsed-list">${questDone.map((task) => taskCard(task, { compact: true })).join("")}</div>` : ""}` : "";
      elements.taskList.innerHTML = `${progressHtml}<div class="quest-victory"><span>🎉</span><strong>我全部通关啦！</strong><small>看起来很多的作业，也被我一项一项完成啦。</small></div>${completedHtml}`;
      return;
    }

    const upcoming = questRemaining.filter((task) => task !== questCurrent).slice(0, 2);
    const later = questRemaining.filter((task) => task !== questCurrent && !upcoming.includes(task));
    const currentHtml = questCurrent ? taskCard(questCurrent, { current: true }) : "";
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
      ? "今天我也会一步一步完成！"
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
    elements.ledgerTitle.textContent = record.ledgerConfirmed
      ? "我已核对钉钉，也补全了成长记录册" : "核对钉钉，补全成长记录册";
    elements.ledgerStatus.textContent = record.ledgerConfirmed
      ? `${record.ledgerAt || "已"} 完成` : "把钉钉里新增的作业补充进去";
    setPrepState(elements.readingButton, record.readingDone);
    setPrepState(elements.mathThinkingButton, record.mathThinkingDone);
    setPrepState(elements.englishReadingButton, record.englishReadingDone);
    elements.readingStatus.textContent = record.readingDone
      ? `${record.readingAt || "已"} 完成中文阅读` : "完成中文阅读后打卡";
    elements.mathThinkingStatus.textContent = record.mathThinkingDone
      ? `${record.mathThinkingAt || "已"} 完成数学思维` : "完成数学思维练习后打卡";
    elements.englishReadingStatus.textContent = record.englishReadingDone
      ? `${record.englishReadingAt || "已"} 完成英文阅读` : "完成英文阅读后打卡";
    const dailyDoneCount = Number(sports.length > 0) + Number(Boolean(record.readingDone))
      + Number(Boolean(record.mathThinkingDone)) + Number(Boolean(record.englishReadingDone));
    elements.dailyCheckinsToggle.setAttribute("aria-expanded", String(dailyCheckinsExpanded));
    elements.dailyCheckinsToggle.classList.toggle("complete", dailyDoneCount === 4);
    elements.dailyCheckinsBody.hidden = !dailyCheckinsExpanded;
    elements.dailyCheckinsSummary.textContent = dailyDoneCount === 4
      ? "4 / 4 已完成 · 我今天也坚持下来啦"
      : `${dailyDoneCount} / 4 已完成 · ${dailyDoneCount ? "我再完成一项" : "我做完作业再来打卡"}`;

    const result = weekendMode && !includeDailyInLedger(date, record) ? null : resultFor(record);
    elements.dayResult.hidden = !result;
    if (result) {
      elements.resultLabel.textContent = result.label;
      elements.resultAmount.textContent = amountText(result.amount);
      elements.dayResult.className = `day-result${result.amount < 0 ? " negative" : result.amount === 0 ? " neutral" : ""}`;
    }
  }

  function render() {
    const today = todayIso();
    const viewingToday = elements.recordDate.value === today;
    elements.historicalDateNotice.hidden = viewingToday;
    elements.historicalDateLabel.textContent = viewingToday ? "" : formatDate(elements.recordDate.value);
    elements.historicalDateNotice.setAttribute("aria-label", viewingToday
      ? "当前查看今天" : `正在查看${formatDate(elements.recordDate.value)}，点击回到今天`);
    elements.todayButton.disabled = viewingToday;
    renderSummary();
    renderWeekend();
    renderTasks();
    renderCurrentRecord();
    renderHistory();
    renderWeeklyReview();
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
        return saveAndRender(`成长记录册已补全，自动${result.amount < 0 ? "扣款" : result.amount === 0 ? "结算" : "奖励"} ${amountText(result.amount, false)}`);
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
      record.sportActivities = SPORTS.filter((activity) => next.includes(activity));
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
        return showToast("请先核对钉钉，并补全成长记录册");
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
      return showToast("请先核对钉钉，并补全成长记录册");
    const record = currentRecord(true);
    TIME_FIELDS.forEach((field, index) => {
      if (values[index]) record[field] = values[index]; else delete record[field];
    });
    if (values.some(Boolean)) delete record.ruleId;
    elements.timeEditor.hidden = true;
    saveAndRender("时间已调整");
  }
  function setRecordDate(date) {
    closeTaskEntryModal();
    closeTaskEditor();
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
    if (!currentRecord()?.ledgerConfirmed) return showToast("请先核对钉钉，并补全成长记录册");
    const parsed = parseTaskDraft(elements.taskDraft.value.trim(), selectedTaskSubject);
    if (!parsed.length) {
      setTaskDraftError("先说出或输入作业内容");
      elements.taskDraft.focus();
      return;
    }
    setTaskDraftError();
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    const existing = Array.isArray(owner.tasks) ? owner.tasks : [];
    const stamp = Date.now();
    const addedTasks = parsed.map((task, index) => ({
      id: `${stamp}-${index}`,
      addedAt: stamp,
      addedSequence: index,
      subject: task.subject,
      title: task.title,
      status: "pending",
      elapsedMs: 0,
      estimatedMinutes: 15,
      ...(key ? { plannedDay: "saturday" } : {})
    }));
    owner.tasks = pendingTaskOrder(existing.concat(addedTasks));
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
    resizeTaskDraft();
    editingPendingTaskId = null;
    persist();
    render();
    keepTaskEntryComposerFixed(addedTasks[addedTasks.length - 1].id);
    showToast(`我把 ${parsed.length} 项作业收进清单了`);
  }

  function toggleTaskListConfirmation() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    if (key && date !== key) return showToast("周六、周日使用周五已经确认的清单");
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    const tasks = tasksForDate();
    if (!tasks.length) return showToast("请先录入作业");
    const confirmed = taskListConfirmed();
    if (!confirmed && !currentRecord()?.ledgerConfirmed) return showToast("请先核对钉钉，并补全成长记录册");
    if (confirmed && activeTaskForDate()) return showToast("请先暂停当前作业再修改清单");
    if (confirmed && tasks.some((task) => (task.status || "pending") !== "pending"))
      return showToast("已经开始闯关，不能再修改清单");
    owner.tasks = pendingTaskOrder(tasks);
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
    if (confirmed) openTaskEntryModal();
    showToast(confirmed ? "我可以继续修改清单了" : `清单收好了，接下来安排 ${tasks.length} 项作业的顺序`);
  }

  function setTaskEstimate(id, value) {
    const task = taskById(id);
    const minutes = Number(value);
    if (!task || task.status !== "pending" || !ESTIMATE_OPTIONS.includes(minutes)) return;
    task.estimatedMinutes = minutes;
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    owner.orderSaved = false;
    delete owner.orderSavedAt;
    persist();
    renderTasks();
  }

  function toggleMealAfter(id) {
    if (weekendKeyFor(elements.recordDate.value)) return showToast("周末作业已经按日期分段，不再设置饭前分界");
    const task = taskById(id);
    if (!task || task.status !== "pending") return;
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    owner.mealAfterTaskId = String(owner.mealAfterTaskId || "") === String(id) ? "" : String(id);
    owner.orderSaved = false;
    delete owner.orderSavedAt;
    persist();
    renderTasks();
  }

  function toggleTaskBreakPoint(id) {
    const task = taskById(id);
    if (!task || task.status !== "pending") return;
    const tasks = tasksForDate();
    if (!task.breakAfter && tasks.filter((item) => item.breakAfter).length >= 2) {
      return showToast("最多设置两个休息点，可以先取消一个再调整");
    }
    task.breakAfter = !task.breakAfter;
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    owner.orderSaved = false;
    delete owner.orderSavedAt;
    persist();
    renderTasks();
    showToast(task.breakAfter ? "这里已设为休息点" : "已取消这个休息点");
  }

  function parseStepTitles(value) {
    const numbered = numberedTaskParts(value);
    return (numbered || value.split(/[\n；;]+/))
      .map((item) => item.trim().replace(/^[-•]\s*/, ""))
      .filter(Boolean);
  }

  function saveTaskEdit() {
    const task = taskById(taskEditTaskId);
    if (!task || (task.status || "pending") !== "pending") {
      closeTaskEditor();
      return showToast("这项作业已经不能修改");
    }
    const title = elements.taskEditInput.value.trim();
    if (!title) {
      elements.taskEditInput.focus();
      return showToast("请填写作业内容");
    }
    task.title = title;
    task.estimatedMinutes = estimatedMinutes({ estimatedMinutes: Number(elements.taskEditEstimate.value) });
    const titles = parseStepTitles(elements.taskEditSteps.value);
    if (titles.length) {
      task.steps = titles.map((stepTitle, index) => ({
        id: `${task.id}-step-${index}`,
        title: stepTitle,
        done: false
      }));
    } else {
      delete task.steps;
    }
    persist();
    closeTaskEditor();
    renderTasks();
    showToast("这项作业修改好了");
  }

  function saveTaskSteps() {
    const task = taskById(stepEditorTaskId);
    if (!task || task.status !== "pending") {
      closeTaskStepsEditor();
      return showToast("这项作业已经不能修改步骤");
    }
    const titles = parseStepTitles(elements.stepEditorInput.value);
    let message = "已取消步骤拆分";
    if (titles.length) {
      task.steps = titles.map((title, index) => ({ id: `${task.id}-step-${index}`, title, done: false }));
      message = `已拆成 ${titles.length} 个步骤`;
    } else {
      delete task.steps;
    }
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    owner.orderSaved = false;
    delete owner.orderSavedAt;
    persist();
    closeTaskStepsEditor();
    renderTasks();
    showToast(message);
  }

  function toggleTaskOrder() {
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const tasks = tasksForDate(date);
    const owner = taskOwnerForDate(date, true);
    if (!taskListConfirmed(date) || !tasks.length) return showToast("请先确认完整的作业清单");
    if (key && date !== key) return showToast("周末顺序请回到周五安排");
    if (key && !owner.planSaved) return showToast("请先安排每项作业在周五、周六还是周日完成");
    if (tasks.some((task) => (task.status || "pending") !== "pending"))
      return showToast("已经开始闯关，顺序不能再调整");
    if (tasks.filter((task) => task.breakAfter).length > 2)
      return showToast("休息点最多两个，请先取消多余的休息点");
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
    showToast(key ? "周末闯关顺序已确定！" : "顺序已确定，我要开始第一关啦！");
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
      return showToast("三天的作业请分别排序");
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

  function saveTaskOrderFromDom() {
    const orderedIds = [...elements.taskList.querySelectorAll("[data-sort-task-id]")]
      .map((card) => card.dataset.sortTaskId);
    const tasks = tasksForDate();
    if (orderedIds.length !== tasks.length) return renderTasks();
    const byId = new Map(tasks.map((task) => [String(task.id), task]));
    const orderedTasks = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
    if (orderedTasks.length !== tasks.length) return renderTasks();
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    owner.tasks = orderedTasks;
    owner.orderSaved = false;
    delete owner.orderSavedAt;
    persist();
    render();
  }

  function beginPendingTaskEdit(id) {
    const task = taskById(id);
    if (!task || taskListConfirmed()) return;
    editingPendingTaskId = String(id);
    renderTasks();
    const input = [...elements.taskEntryPendingList.querySelectorAll("[data-pending-edit-id]")]
      .find((item) => item.dataset.pendingEditId === String(id));
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  function savePendingTaskEdit(id) {
    const task = taskById(id);
    const input = [...elements.taskEntryPendingList.querySelectorAll("[data-pending-edit-id]")]
      .find((item) => item.dataset.pendingEditId === String(id));
    if (!task || !input) return;
    const title = input.value.trim();
    if (!title) {
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return showToast("作业内容不能留空");
    }
    task.title = title;
    editingPendingTaskId = null;
    persist();
    render();
    showToast("这项作业已经改好了");
  }

  function rememberDeletedTask(task, date) {
    clearTimeout(undoDeleteTimer);
    lastDeletedTask = { date, task: JSON.parse(JSON.stringify(task)) };
    undoDeleteTimer = window.setTimeout(() => {
      lastDeletedTask = null;
      elements.taskEntryUndoDeleteButton.hidden = true;
    }, 15000);
  }

  function undoPendingTaskDelete() {
    if (!lastDeletedTask || lastDeletedTask.date !== elements.recordDate.value || taskListConfirmed()) return;
    const restored = lastDeletedTask.task;
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    owner.tasks = pendingTaskOrder([...(Array.isArray(owner.tasks) ? owner.tasks : []), restored]);
    clearTimeout(undoDeleteTimer);
    lastDeletedTask = null;
    persist();
    render();
    showToast("刚才删除的作业回来了");
  }

  function performTaskAction(action, id) {
    const task = taskById(id);
    if (!task) return;
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    const weekend = key ? weekendForDate(date, true) : null;
    const tasks = tasksForDate();
    let openFocusAfterRender = false;
    let offerBreakTaskId = null;
    let offerBreakMode = "checkpoint";
    let offerBreakSourceTaskId = null;
    if (action === "delete") {
      if (key && date !== key) return showToast("周末清单只能在周五修改");
      const owner = taskOwnerForDate(elements.recordDate.value, true);
      rememberDeletedTask(task, date);
      owner.tasks = tasks.filter((item) => String(item.id) !== String(id));
      if (String(owner.mealAfterTaskId || "") === String(id)) delete owner.mealAfterTaskId;
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
      editingPendingTaskId = null;
      persist();
      render();
      return showToast("已删除，可以在上方撤销");
    }
    if (!taskListConfirmed()) return showToast("请先确认作业清单");
    if (!taskOrderSaved()) return showToast(key && date !== key ? "请回到周五确定周末闯关顺序" : "请先确定闯关顺序");
    if (key && !weekend.planSaved) return showToast("请先在周五保存三天的作业安排");
    if (key && date === key && plannedDayForTask(task) !== "friday" && action !== "undo")
      return showToast("这项安排在周末，今天先做周五计划");
    if (key && date === addDays(key, 1) && plannedDayForTask(task) === "sunday" && action !== "undo")
      return showToast("这项安排在周日，今天先做周六计划");
    const record = currentRecord(true);
    if (!key && record.finishTime && action !== "undo") return showToast("当天已经结算，如需修改可先撤销一项完成");
    if (action === "start") {
      if (breakSession) cancelBreak(false);
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
      offerBreakTaskId = String(task.id);
      offerBreakMode = "pause";
      offerBreakSourceTaskId = String(task.id);
    } else if (action === "complete") {
      const step = currentTaskStep(task);
      if (step) {
        step.done = true;
        step.completedAt = currentTime();
        const nextStep = currentTaskStep(task);
        if (nextStep) {
          persist();
          render();
          updateFocusModal();
          showToast(`完成一步，接下来：${nextStep.title}`);
          return;
        }
      }
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
          showToast("作业已全部完成，补全成长记录册后自动结算");
        }
      } else if (completedAll && key) {
        weekend.allDoneDate = date;
        weekend.allDoneTime = task.completedAt;
        delete weekend.penaltyConfirmed;
        const result = weekendResultFor(key, weekend);
        showToast(`周末作业已全部完成，${result.label} ${amountText(result.amount, false)}`);
      } else if (!key && String(taskOwnerForDate(date)?.mealAfterTaskId || "") === String(task.id)) {
        showToast("饭前计划完成，可以准备吃饭啦");
      } else {
        const todayTasks = !key ? tasks : date === key
          ? tasks.filter((item) => plannedDayForTask(item) === "friday")
          : date === addDays(key, 1)
            ? tasks.filter((item) => plannedDayForTask(item) === "saturday"
              || (plannedDayForTask(item) === "friday" && (item.status !== "done" || item.completedDate === date)))
            : tasks.filter((item) => plannedDayForTask(item) === "sunday"
              || ((plannedDayForTask(item) === "friday" || plannedDayForTask(item) === "saturday")
                && (item.status !== "done" || item.completedDate === date)));
        const todayDone = todayTasks.filter((item) => item.status === "done").length;
        const remaining = Math.max(0, todayTasks.length - todayDone);
        if (remaining === 0) showToast("我完成今天安排的作业啦！");
        else if (remaining <= 2) showToast(`我快到终点了，只剩 ${remaining} 项！`);
        else if (todayDone >= Math.ceil(todayTasks.length / 2)) showToast("我又闯过一关，已经完成一半多啦！");
        else showToast(`我又闯过一关！已经完成 ${todayDone} 项`);
      }
      const nextTask = nextTaskForToday(date);
      if (task.breakAfter && nextTask) {
        offerBreakTaskId = String(nextTask.id);
        offerBreakSourceTaskId = String(task.id);
      }
    } else if (action === "undo") {
      task.status = "paused";
      const steps = taskSteps(task);
      if (steps.length && steps.every((step) => step.done)) {
        steps[steps.length - 1].done = false;
        delete steps[steps.length - 1].completedAt;
      }
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
    else if (offerBreakTaskId) openBreakChoice(offerBreakTaskId, offerBreakMode, offerBreakSourceTaskId);
  }

  function updateSpeechState(listening, message) {
    speechListening = listening;
    elements.voiceTaskButton.classList.toggle("listening", listening);
    elements.voiceTaskButton.textContent = "🎙";
    const actionLabel = listening ? "结束语音录入" : "开始报作业";
    elements.voiceTaskButton.setAttribute("aria-label", actionLabel);
    elements.voiceTaskButton.title = actionLabel;
    elements.voiceStatus.textContent = message || "";
    elements.voiceStatus.hidden = !message;
  }

  function taskKeywordItems(subject = selectedTaskSubject) {
    if (!state.taskKeywords || !Array.isArray(state.taskKeywords[subject])) {
      state.taskKeywords = normalizeTaskKeywords(state.taskKeywords);
    }
    return state.taskKeywords[subject];
  }

  function renderTaskKeywordSuggestions() {
    const keywords = taskKeywordItems(selectedTaskSubject).filter((item) => item.visible !== false);
    elements.taskKeywordSuggestions.dataset.subject = selectedTaskSubject;
    elements.taskKeywordSuggestions.hidden = keywords.length === 0;
    elements.taskKeywordSuggestions.innerHTML = keywords
      .map((item) => `<button type="button" data-task-keyword-id="${escapeAttribute(item.id)}">${escapeHtml(item.label)}</button>`)
      .join("");
  }

  function applyTaskKeyword(id) {
    const item = taskKeywordItems(selectedTaskSubject).find((keyword) => String(keyword.id) === String(id));
    if (!item) return;
    const current = elements.taskDraft.value.trim();
    elements.taskDraft.value = current ? `${current} ${item.label} ` : `${item.label} `;
    resizeTaskDraft();
    setTaskDraftError();
    elements.taskDraft.focus();
    elements.taskDraft.setSelectionRange(elements.taskDraft.value.length, elements.taskDraft.value.length);
  }

  function renderTaskKeywordSettings() {
    elements.keywordSettingsSubjects.querySelectorAll("button[data-keyword-settings-subject]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.keywordSettingsSubject === selectedKeywordSettingsSubject));
    });
    const keywords = taskKeywordItems(selectedKeywordSettingsSubject);
    elements.keywordSettingsList.innerHTML = keywords.length ? keywords.map((item, index) => `
      <div class="keyword-settings-row${item.visible === false ? " is-hidden" : ""}" data-keyword-id="${escapeAttribute(item.id)}">
        <strong class="keyword-settings-name">${escapeHtml(item.label)}</strong>
        <button class="keyword-visibility-button${item.visible === false ? " is-hidden" : ""}" type="button" data-keyword-action="toggle">${item.visible === false ? "已隐藏" : "显示中"}</button>
        <button class="keyword-order-button" type="button" data-keyword-action="up" aria-label="上移${escapeAttribute(item.label)}"${index === 0 ? " disabled" : ""}>↑</button>
        <button class="keyword-order-button" type="button" data-keyword-action="down" aria-label="下移${escapeAttribute(item.label)}"${index === keywords.length - 1 ? " disabled" : ""}>↓</button>
        <button class="keyword-delete-button" type="button" data-keyword-action="delete">删除</button>
      </div>`).join("") : `<div class="keyword-settings-empty">这个科目还没有关键词，可以在下方添加</div>`;
  }

  function saveTaskKeywordSettings(message) {
    persist();
    renderTaskKeywordSettings();
    renderTaskKeywordSuggestions();
    if (message) showToast(message);
  }

  function addTaskKeyword() {
    const label = elements.keywordSettingsInput.value.trim();
    if (!label) return showToast("请输入一个关键词");
    const keywords = taskKeywordItems(selectedKeywordSettingsSubject);
    if (keywords.some((item) => item.label === label)) return showToast("这个关键词已经有了");
    keywords.push({ id: `custom-${Date.now()}`, label, visible: true });
    elements.keywordSettingsInput.value = "";
    saveTaskKeywordSettings("关键词已添加");
    elements.keywordSettingsInput.focus();
  }

  function changeTaskKeyword(id, action) {
    const keywords = taskKeywordItems(selectedKeywordSettingsSubject);
    const index = keywords.findIndex((item) => String(item.id) === String(id));
    if (index < 0) return;
    if (action === "toggle") keywords[index].visible = keywords[index].visible === false;
    else if (action === "up" && index > 0) [keywords[index - 1], keywords[index]] = [keywords[index], keywords[index - 1]];
    else if (action === "down" && index < keywords.length - 1) [keywords[index], keywords[index + 1]] = [keywords[index + 1], keywords[index]];
    else if (action === "delete") {
      if (!window.confirm(`删除关键词“${keywords[index].label}”吗？`)) return;
      keywords.splice(index, 1);
    } else return;
    saveTaskKeywordSettings(action === "delete" ? "关键词已删除" : "关键词设置已更新");
  }

  function selectTaskSubject(subject) {
    selectedTaskSubject = subject;
    elements.subjectTabs.querySelectorAll("button[data-subject]").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.subject === subject));
    });
    elements.subjectPickerButton.dataset.subject = subject;
    elements.subjectPickerLabel.textContent = subject;
    const addLabel = `加入${subject}作业`;
    elements.addTasksButton.setAttribute("aria-label", addLabel);
    elements.addTasksButton.title = addLabel;
    elements.taskDraft.placeholder = "请输入一项作业…";
    setSubjectPickerOpen(false);
    renderTaskKeywordSuggestions();
  }

  function exportBackup() {
    const payload = { format: "homework-ledger-backup", version: 3, exportedAt: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `作业小账本备份-${todayIso()}.json`;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    link.remove();
    showToast("备份文件已导出");
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const source = parsed?.format === "homework-ledger-backup" ? parsed.state : parsed;
      if (!source || typeof source !== "object" || !source.records || !source.weekends) throw new Error("invalid");
      if (!window.confirm("恢复备份会替换当前全部记录，确定继续吗？")) return;
      state = {
        records: source.records && typeof source.records === "object" ? source.records : {},
        weekends: source.weekends && typeof source.weekends === "object" ? source.weekends : {},
        dictationCustom: source.dictationCustom && typeof source.dictationCustom === "object" ? source.dictationCustom : {},
        dictationLesson: typeof source.dictationLesson === "string" ? source.dictationLesson : DICTATION_LESSONS[0].id,
        taskKeywords: normalizeTaskKeywords(source.taskKeywords)
      };
      selectedDictationLesson = state.dictationLesson;
      persist();
      elements.recordDate.value = todayIso();
      closeFocusModal();
      render();
      renderTaskKeywordSuggestions();
      renderTaskKeywordSettings();
      showToast("备份已恢复");
    } catch (_) {
      showToast("备份文件无法识别，请选择本应用导出的文件");
    } finally {
      elements.importDataInput.value = "";
    }
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
        resizeTaskDraft();
        setTaskDraftError();
      }
    };
    speechRecognition.onerror = (event) => {
      const message = event.error === "not-allowed" ? "请允许浏览器使用麦克风" : "没有听清，可以再试一次";
      updateSpeechState(false, message);
      showToast(message);
    };
    speechRecognition.onend = () => updateSpeechState(false, "文字已经放进输入框，我检查一下再加入清单");
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
    task.plannedDay = plannedDay === "friday" ? "friday" : plannedDay === "sunday" ? "sunday" : "saturday";
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
    closeWeekendPlanModal();
    showToast("完成日期已保存，接下来排好三天顺序吧");
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

  elements.settingsButton.addEventListener("click", openSettingsPage);
  elements.closeSettingsButton.addEventListener("click", closeSettingsPage);
  elements.keywordSettingsSubjects.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-keyword-settings-subject]");
    if (!button) return;
    selectedKeywordSettingsSubject = button.dataset.keywordSettingsSubject;
    renderTaskKeywordSettings();
  });
  elements.keywordSettingsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-keyword-action]");
    const row = button?.closest("[data-keyword-id]");
    if (button && row) changeTaskKeyword(row.dataset.keywordId, button.dataset.keywordAction);
  });
  elements.addKeywordButton.addEventListener("click", addTaskKeyword);
  elements.keywordSettingsInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    addTaskKeyword();
  });
  elements.recordAlarmButton.addEventListener("click", toggleAlarmRecording);
  elements.previewAlarmButton.addEventListener("click", () => playAlarm(1));
  elements.resetAlarmButton.addEventListener("click", () => {
    stopAlarmPlayback();
    localStorage.removeItem(BREAK_ALARM_KEY);
    setAlarmRecordHint("已恢复默认语音：“作业时间到啦”。");
    renderAlarmSettings();
  });
  elements.exportDataButton.addEventListener("click", exportBackup);
  elements.importDataButton.addEventListener("click", () => elements.importDataInput.click());
  elements.importDataInput.addEventListener("change", () => importBackup(elements.importDataInput.files?.[0]));
  elements.recordDate.addEventListener("change", () => setRecordDate(elements.recordDate.value));
  elements.todayButton.addEventListener("click", () => setRecordDate(todayIso()));
  elements.historicalDateNotice.addEventListener("click", () => setRecordDate(todayIso()));
  elements.openHistoryButton.addEventListener("click", openHistoryPage);
  elements.closeHistoryButton.addEventListener("click", closeHistoryPage);
  elements.historyManageButton.addEventListener("click", () => {
    historyManageMode = !historyManageMode;
    document.body.classList.toggle("history-manage-mode", historyManageMode);
    elements.historyManageButton.setAttribute("aria-pressed", String(historyManageMode));
    elements.historyManageButton.textContent = historyManageMode ? "完成管理" : "管理记录";
  });
  elements.openDictationButton.addEventListener("click", openDictationPage);
  elements.closeDictationButton.addEventListener("click", closeDictationPage);
  elements.dictationLessonSelect.addEventListener("change", () => {
    selectDictationLesson(elements.dictationLessonSelect.value);
  });
  elements.previousDictationLessonButton.addEventListener("click", () => moveDictationLesson(-1));
  elements.nextDictationLessonButton.addEventListener("click", () => moveDictationLesson(1));
  elements.addDictationWordsButton.addEventListener("click", addDictationWords);
  elements.dictationWordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addDictationWords();
  });
  elements.dictationWords.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-dictation-action]");
    if (!button) return;
    const action = button.dataset.dictationAction;
    if (action === "delete-word") {
      const custom = customDictationWords();
      custom.splice(Number(button.dataset.customWordIndex), 1);
      state.dictationCustom[selectedDictationLesson] = custom;
      persist();
      delete elements.dictationStatus.dataset.result;
      renderDictation();
      showToast("已移除自定义词语");
      return;
    }
    const word = dictationWordsForLesson()[Number(button.dataset.wordIndex)];
    if (!word) return;
    if (action === "record") toggleDictationWordRecording(word);
    else if (action === "preview") toggleDictationWordPreview(word);
    else if (action === "delete-recording") deleteDictationWordRecording(word);
  });
  elements.startDictationButton.addEventListener("click", startDictation);
  elements.stopDictationButton.addEventListener("click", () => stopDictation(false));
  elements.taskEntryLauncher.addEventListener("click", openTaskEntryModal);
  elements.taskEntryCloseButton.addEventListener("click", closeTaskEntryModal);
  elements.taskEntryModal.addEventListener("click", (event) => {
    if (event.target === elements.taskEntryModal) closeTaskEntryModal();
  });
  elements.taskEditCloseButton.addEventListener("click", closeTaskEditor);
  elements.taskEditCancelButton.addEventListener("click", closeTaskEditor);
  elements.taskEditSaveButton.addEventListener("click", saveTaskEdit);
  elements.taskEditModal.addEventListener("click", (event) => {
    if (event.target === elements.taskEditModal) closeTaskEditor();
  });
  elements.stepEditorCloseButton.addEventListener("click", closeTaskStepsEditor);
  elements.stepEditorCancelButton.addEventListener("click", closeTaskStepsEditor);
  elements.stepEditorSaveButton.addEventListener("click", saveTaskSteps);
  elements.stepEditorModal.addEventListener("click", (event) => {
    if (event.target === elements.stepEditorModal) closeTaskStepsEditor();
  });
  elements.weekendPlanEntry.addEventListener("click", openWeekendPlanModal);
  elements.weekendPlanCloseButton.addEventListener("click", closeWeekendPlanModal);
  elements.weekendPlanModal.addEventListener("click", (event) => {
    if (event.target === elements.weekendPlanModal) closeWeekendPlanModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!elements.breakTimerModal.hidden) return;
    if (!elements.breakChoiceModal.hidden) closeBreakChoice();
    else if (!elements.taskEditModal.hidden) closeTaskEditor();
    else if (!elements.stepEditorModal.hidden) closeTaskStepsEditor();
    else if (!elements.taskEntryModal.hidden) closeTaskEntryModal();
    else if (!elements.weekendPlanModal.hidden) closeWeekendPlanModal();
    else if (!elements.dictationPage.hidden) closeDictationPage();
    else if (!elements.historyPage.hidden) closeHistoryPage();
    else if (!elements.settingsPage.hidden) closeSettingsPage();
  });
  elements.weekendTaskPlanList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-plan-day]");
    if (button) selectWeekendTaskDay(button.dataset.taskId, button.dataset.planDay);
  });
  elements.saveWeekendTaskPlanButton.addEventListener("click", saveWeekendTaskPlan);
  elements.weekendPenaltyButton.addEventListener("click", toggleWeekendPenalty);
  elements.dailyCheckinsToggle.addEventListener("click", () => {
    dailyCheckinsExpanded = !dailyCheckinsExpanded;
    elements.dailyCheckinsToggle.setAttribute("aria-expanded", String(dailyCheckinsExpanded));
    elements.dailyCheckinsBody.hidden = !dailyCheckinsExpanded;
  });
  elements.sportOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sport]");
    if (button) toggleSport(button.dataset.sport);
  });
  elements.ledgerButton.addEventListener("click", () => togglePrep("ledgerConfirmed", "ledgerAt", "钉钉和成长记录册核对状态已更新"));
  elements.readingButton.addEventListener("click", () => togglePrep("readingDone", "readingAt", "中文阅读状态已更新"));
  elements.mathThinkingButton.addEventListener("click", () => togglePrep("mathThinkingDone", "mathThinkingAt", "数学思维状态已更新"));
  elements.englishReadingButton.addEventListener("click", () => togglePrep("englishReadingDone", "englishReadingAt", "英文阅读状态已更新"));
  elements.voiceTaskButton.addEventListener("click", toggleVoiceInput);
  elements.subjectPickerButton.addEventListener("click", () => {
    setSubjectPickerOpen(elements.subjectTabs.hidden);
  });
  elements.subjectTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-subject]");
    if (button) {
      selectTaskSubject(button.dataset.subject);
      elements.taskDraft.focus();
    }
  });
  elements.taskKeywordSuggestions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-task-keyword-id]");
    if (button) applyTaskKeyword(button.dataset.taskKeywordId);
  });
  elements.addTasksButton.addEventListener("click", addTasksFromDraft);
  elements.taskDraft.addEventListener("input", () => {
    resizeTaskDraft();
    if (elements.taskDraft.value.trim()) setTaskDraftError();
  });
  elements.taskDraft.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    addTasksFromDraft();
  });
  document.addEventListener("click", (event) => {
    if (!elements.subjectPicker.contains(event.target)) setSubjectPickerOpen(false);
  });
  elements.taskEntryUndoDeleteButton.addEventListener("click", undoPendingTaskDelete);
  elements.taskEntryConfirmButton.addEventListener("click", toggleTaskListConfirmation);
  elements.taskEntryPendingList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-task-action]");
    if (!button) return;
    const action = button.dataset.taskAction;
    if (action === "edit") beginPendingTaskEdit(button.dataset.taskId);
    else if (action === "save-edit") savePendingTaskEdit(button.dataset.taskId);
    else if (action === "cancel-edit") {
      editingPendingTaskId = null;
      renderTasks();
    } else performTaskAction(action, button.dataset.taskId);
  });
  elements.taskEntryPendingList.addEventListener("keydown", (event) => {
    const input = event.target.closest("input[data-pending-edit-id]");
    if (!input) return;
    if (event.key === "Enter") {
      event.preventDefault();
      savePendingTaskEdit(input.dataset.pendingEditId);
    } else if (event.key === "Escape") {
      event.stopPropagation();
      editingPendingTaskId = null;
      renderTasks();
    }
  });
  elements.confirmTaskListButton.addEventListener("click", toggleTaskListConfirmation);
  elements.taskOrderButton.addEventListener("click", toggleTaskOrder);
  elements.taskList.addEventListener("click", (event) => {
    const planningButton = event.target.closest("button[data-plan-action]");
    if (planningButton) {
      if (planningButton.dataset.planAction === "steps") openTaskStepsEditor(planningButton.dataset.taskId);
      return;
    }
    const mealButton = event.target.closest("button[data-meal-after]");
    if (mealButton) {
      toggleMealAfter(mealButton.dataset.mealAfter);
      return;
    }
    const breakPointButton = event.target.closest("button[data-break-after]");
    if (breakPointButton) {
      toggleTaskBreakPoint(breakPointButton.dataset.breakAfter);
      return;
    }
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
    if (button) {
      performTaskAction(button.dataset.taskAction, button.dataset.taskId);
      return;
    }
    const card = event.target.closest("[data-edit-task-id]");
    if (card) openTaskEditor(card.dataset.editTaskId);
  });
  elements.taskList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest("button, select, input, textarea")) return;
    const card = event.target.closest("[data-edit-task-id]");
    if (!card) return;
    event.preventDefault();
    openTaskEditor(card.dataset.editTaskId);
  });
  elements.taskList.addEventListener("change", (event) => {
    const select = event.target.closest("select[data-estimate-task-id]");
    if (select) setTaskEstimate(select.dataset.estimateTaskId, select.value);
  });
  elements.taskList.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest("[data-drag-handle]");
    const card = handle?.closest("[data-sort-task-id]");
    if (!handle || !card || event.button !== 0) return;
    event.preventDefault();
    pointerTaskDrag = {
      pointerId: event.pointerId,
      handle,
      card,
      group: card.closest(".order-group"),
      moved: false
    };
    card.classList.add("dragging");
    try { handle.setPointerCapture(event.pointerId); } catch (_) { /* 浏览器可能不支持捕获，窗口监听仍可工作 */ }
  });
  window.addEventListener("pointermove", (event) => {
    if (!pointerTaskDrag || event.pointerId !== pointerTaskDrag.pointerId) return;
    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-sort-task-id]");
    if (!target || target === pointerTaskDrag.card || target.closest(".order-group") !== pointerTaskDrag.group) return;
    const rect = target.getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) target.before(pointerTaskDrag.card);
    else target.after(pointerTaskDrag.card);
    pointerTaskDrag.moved = true;
    [...pointerTaskDrag.group.querySelectorAll(".order-number")]
      .forEach((number, index) => { number.textContent = String(index + 1); });
  }, { passive: false });
  window.addEventListener("pointerup", (event) => {
    if (!pointerTaskDrag || event.pointerId !== pointerTaskDrag.pointerId) return;
    const drag = pointerTaskDrag;
    pointerTaskDrag = null;
    try { drag.handle.releasePointerCapture(event.pointerId); } catch (_) { /* 已自动释放 */ }
    drag.card.classList.remove("dragging");
    if (drag.moved) saveTaskOrderFromDom();
  });
  window.addEventListener("pointercancel", (event) => {
    if (!pointerTaskDrag || event.pointerId !== pointerTaskDrag.pointerId) return;
    pointerTaskDrag = null;
    renderTasks();
  });
  elements.focusCloseButton.addEventListener("click", closeFocusModal);
  elements.focusPauseButton.addEventListener("click", () => {
    if (focusModalTaskId) performTaskAction("pause", focusModalTaskId);
  });
  elements.focusCompleteButton.addEventListener("click", () => {
    if (focusModalTaskId) performTaskAction("complete", focusModalTaskId);
  });
  elements.breakChoiceCloseButton.addEventListener("click", closeBreakChoice);
  elements.changeBreakNextTaskButton.addEventListener("click", changeBreakNextTask);
  elements.breakChoiceModal.addEventListener("click", (event) => {
    if (event.target === elements.breakChoiceModal) closeBreakChoice();
  });
  elements.breakChoiceModal.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-break-minutes]");
    if (button) startBreak(Date.now() + Number(button.dataset.breakMinutes) * 60000, button.dataset.breakKind);
  });
  elements.startTimedBreakButton.addEventListener("click", () => {
    if (!elements.breakReturnTime.value) return showToast("先选择准备回来的时间");
    const [hours, minutes] = elements.breakReturnTime.value.split(":").map(Number);
    const end = new Date();
    end.setHours(hours, minutes, 0, 0);
    if (end.getTime() <= Date.now()) return showToast("请选择晚于现在的时间");
    startBreak(end.getTime(), "meal");
  });
  elements.startNextTaskNowButton.addEventListener("click", () => startNextTaskAfterBreak(breakChoiceTaskId, elements.recordDate.value));
  elements.startNextTaskButton.addEventListener("click", () => startNextTaskAfterBreak());
  elements.extendBreakButton.addEventListener("click", () => {
    if (!breakSession || breakSession.extended) return;
    stopAlarmPlayback();
    breakSession.endAt = Math.max(Date.now(), Number(breakSession.endAt)) + 3 * 60000;
    breakSession.extended = true;
    breakSession.alerted = false;
    const owner = taskOwnerForDate(breakSession.date, true);
    const log = Array.isArray(owner.breaks)
      ? owner.breaks.find((entry) => String(entry.id) === String(breakSession.breakId)) : null;
    if (log) {
      log.plannedEndAt = breakSession.endAt;
      log.plannedMinutes = Math.max(1, Math.ceil((breakSession.endAt - Number(log.startedAt || Date.now())) / 60000));
      log.plannedReturnAt = timeFromEpoch(breakSession.endAt);
      log.extended = true;
      persist();
    }
    saveBreakSession();
    renderBreakTimer();
    showToast("我把休息延长 3 分钟，只延长这一次");
  });
  elements.cancelBreakButton.addEventListener("click", () => cancelBreak(true));
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
      closeHistoryPage();
      setRecordDate(target);
      document.querySelector(".record-card").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (action === "delete") {
      if (!historyManageMode) return showToast("请先进入管理记录模式");
      if (!window.confirm(`确定删除 ${formatDate(date)} 的记录吗？`)) return;
      if (kind === "weekend") delete state.weekends[date];
      else delete state.records[date];
      persist();
      render();
      showToast("记录已删除");
    }
  });

  elements.recordDate.value = todayIso();
  elements.dictationLessonSelect.innerHTML = DICTATION_LESSONS
    .map((lesson) => `<option value="${lesson.id}">${lesson.label}</option>`).join("");
  selectTaskSubject(selectedTaskSubject);
  renderTaskKeywordSettings();
  resizeTaskDraft();
  renderDictation();
  renderAlarmSettings();
  loadDictationRecordingWords();
  render();
  if (breakSession) openBreakTimer();
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
