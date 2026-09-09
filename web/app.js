(() => {
  "use strict";

  const STORAGE_KEY = "homework-ledger-v1";
  const BREAK_SESSION_KEY = "homework-break-session-v1";
  const START_PLAN_SESSION_KEY = "homework-start-plan-session-v1";
  const BREAK_ALARM_KEY = "homework-break-alarm-v1";
  const BREAK_REMINDER_INTERVAL_MS = 5 * 60000;
  const RULES = {
    best: { label: "8:30 及以前", amount: 1.5 },
    good: { label: "8:30 后至 8:40", amount: 1 },
    neutral: { label: "8:40 后至 9:30", amount: 0 },
    late: { label: "9:30 以后", amount: -0.5 }
  };
  const TIME_FIELDS = ["startTime", "dinnerTime", "resumeTime", "finishTime"];
  const SPORTS = ["跳绳", "踢毽子", "坐位体前屈", "50米", "仰卧起坐"];
  const TASK_SUBJECTS = ["语文", "数学", "英语", "科学"];
  const TASK_KEYWORDS_DEFAULTS_VERSION = 2;
  const DEFAULT_TASK_KEYWORDS = {
    语文: ["背诵", "默写", "生抄本", "作文", "小练习", "预习", "小古文", "订正", "朗读"],
    数学: ["口算", "课作本", "书本", "小练习", "订正"],
    英语: ["校本", "预习课本", "复习"],
    科学: []
  };
  const ESTIMATE_OPTIONS = [5, 10, 15, 20, 30, 35, 40, 45, 50, 60];
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
    holidays: {},
    dictationCustom: {},
    dictationLesson: DICTATION_LESSONS[0].id,
    taskKeywords: defaultTaskKeywords()
  });

  function defaultTaskKeywords() {
    const defaults = Object.fromEntries(TASK_SUBJECTS.map((subject) => [subject,
      DEFAULT_TASK_KEYWORDS[subject].map((label, index) => ({
        id: `builtin-${TASK_SUBJECTS.indexOf(subject)}-${index}`,
        label,
        visible: true
      }))
    ]));
    defaults._defaultsVersion = TASK_KEYWORDS_DEFAULTS_VERSION;
    return defaults;
  }

  function normalizeTaskKeywords(value) {
    const defaults = defaultTaskKeywords();
    const source = value && typeof value === "object" ? value : null;
    const normalized = Object.fromEntries(TASK_SUBJECTS.map((subject) => {
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
    if (source && Number(source._defaultsVersion || 0) < 1
        && !normalized["数学"].some((item) => item.label === "订正")) {
      normalized["数学"].push({ id: "builtin-1-4", label: "订正", visible: true });
    }
    if (source && Number(source._defaultsVersion || 0) < 2
        && !normalized["英语"].some((item) => item.label === "复习")) {
      normalized["英语"].push({ id: "builtin-2-2", label: "复习", visible: true });
    }
    normalized._defaultsVersion = TASK_KEYWORDS_DEFAULTS_VERSION;
    return normalized;
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== "object") return defaultState();
      return {
        records: parsed.records && typeof parsed.records === "object" ? parsed.records : {},
        weekends: parsed.weekends && typeof parsed.weekends === "object" ? parsed.weekends : {},
        holidays: parsed.holidays && typeof parsed.holidays === "object" ? parsed.holidays : {},
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
    alarmSettingsPage: $("#alarmSettingsPage"), backupSettingsPage: $("#backupSettingsPage"),
    openAlarmSettingsButton: $("#openAlarmSettingsButton"), closeAlarmSettingsButton: $("#closeAlarmSettingsButton"),
    openBackupSettingsButton: $("#openBackupSettingsButton"), closeBackupSettingsButton: $("#closeBackupSettingsButton"),
    keywordSettingsPage: $("#keywordSettingsPage"),
    openKeywordSettingsButton: $("#openKeywordSettingsButton"), closeKeywordSettingsButton: $("#closeKeywordSettingsButton"),
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
    dailyCheckinsSummary: $("#dailyCheckinsSummary"),
    sportCard: $("#sportCard"), sportStatus: $("#sportStatus"), sportOptions: $("#sportOptions"),
    readingButton: $("#readingButton"), readingStatus: $("#readingStatus"),
    mathThinkingButton: $("#mathThinkingButton"), mathThinkingStatus: $("#mathThinkingStatus"),
    englishReadingButton: $("#englishReadingButton"), englishReadingStatus: $("#englishReadingStatus"),
    ledgerButton: $("#ledgerButton"), ledgerTitle: $("#ledgerTitle"), ledgerStatus: $("#ledgerStatus"),
    taskEntryLauncher: $("#taskEntryLauncher"), taskEntryLauncherStatus: $("#taskEntryLauncherStatus"),
    taskEntryPage: $("#taskEntryPage"), taskEntryLayout: $("#taskEntryLayout"), taskEntryCloseButton: $("#taskEntryCloseButton"),
    taskEntry: $("#taskEntry"), subjectPicker: $("#subjectPicker"),
    subjectPickerButton: $("#subjectPickerButton"), subjectPickerLabel: $("#subjectPickerLabel"),
    subjectTabs: $("#subjectTabs"),
    taskEntryComposer: $("#taskEntryComposer"),
    taskKeywordSuggestions: $("#taskKeywordSuggestions"),
    taskEntryEmpty: $("#taskEntryEmpty"),
    taskEntryPendingSection: $("#taskEntryPendingSection"), taskEntryPendingList: $("#taskEntryPendingList"),
    taskEntryConfirmButton: $("#taskEntryConfirmButton"),
    taskEntryUndoDeleteButton: $("#taskEntryUndoDeleteButton"), taskDraftError: $("#taskDraftError"),
    taskEditModal: $("#taskEditModal"), taskEditCloseButton: $("#taskEditCloseButton"),
    taskEditTitle: $("#taskEditTitle"), taskEditInput: $("#taskEditInput"),
    taskEditEstimate: $("#taskEditEstimate"),
    taskEditCancelButton: $("#taskEditCancelButton"), taskEditSaveButton: $("#taskEditSaveButton"),
    taskEntryEstimate: $("#taskEntryEstimate"),
    taskEntryOrderButton: $("#taskEntryOrderButton"), taskEntryDays: $("#taskEntryDays"),
    taskDraft: $("#taskDraft"), addTasksButton: $("#addTasksButton"),
    taskSummary: $("#taskSummary"),
    taskPanel: $("#taskPanel"), taskPanelHeading: $("#taskPanelHeading"), taskPanelTitle: $("#taskPanelTitle"), taskPanelHelp: $("#taskPanelHelp"),
    taskOrderButton: $("#taskOrderButton"),
    taskOrderModal: $("#taskOrderModal"), taskOrderCloseButton: $("#taskOrderCloseButton"),
    taskOrderTitle: $("#taskOrderTitle"),
    taskOrderDays: $("#taskOrderDays"), taskOrderChoices: $("#taskOrderChoices"),
    taskOrderUndoButton: $("#taskOrderUndoButton"), taskOrderResetButton: $("#taskOrderResetButton"),
    taskOrderConfirmButton: $("#taskOrderConfirmButton"),
    activeTaskBanner: $("#activeTaskBanner"), activeTaskTitle: $("#activeTaskTitle"),
    activeTaskTime: $("#activeTaskTime"), taskList: $("#taskList"),
    emptyTaskList: $("#emptyTaskList"), taskListFooter: $("#taskListFooter"), taskConfirmHint: $("#taskConfirmHint"),
    confirmTaskListButton: $("#confirmTaskListButton"), dayResult: $("#dayResult"),
    focusModal: $("#focusModal"),
    focusOverallDone: $("#focusOverallDone"), focusOverallRemaining: $("#focusOverallRemaining"),
    focusOverallTime: $("#focusOverallTime"),
    focusModalSubject: $("#focusModalSubject"), focusModalTitle: $("#focusModalTitle"),
    focusModalElapsed: $("#focusModalElapsed"), focusModalEstimate: $("#focusModalEstimate"),
    focusModalComparison: $("#focusModalComparison"), focusModalStartedAt: $("#focusModalStartedAt"),
    focusPauseButton: $("#focusPauseButton"), focusCompleteButton: $("#focusCompleteButton"),
    focusSkipButton: $("#focusSkipButton"),
    startPlanModal: $("#startPlanModal"), startPlanCloseButton: $("#startPlanCloseButton"),
    startPlanTitle: $("#startPlanTitle"),
    startPlanTask: $("#startPlanTask"), startPlanTaskLabel: $("#startPlanTaskLabel"),
    startPlanOptions: $("#startPlanOptions"),
    startPlanTime: $("#startPlanTime"), saveStartPlanButton: $("#saveStartPlanButton"),
    startPlanFiveMinutesButton: $("#startPlanFiveMinutesButton"), startPlanTenMinutesButton: $("#startPlanTenMinutesButton"),
    startPlanCountdownPanel: $("#startPlanCountdownPanel"), startPlanCountdown: $("#startPlanCountdown"),
    startPlanScheduledTime: $("#startPlanScheduledTime"), adjustStartPlanButton: $("#adjustStartPlanButton"),
    startPlannedTaskButton: $("#startPlannedTaskButton"),
    skipPausedTaskButton: $("#skipPausedTaskButton"),
    recordAlarmButton: $("#recordAlarmButton"),
    previewAlarmButton: $("#previewAlarmButton"), resetAlarmButton: $("#resetAlarmButton"),
    alarmRecordHint: $("#alarmRecordHint"), breakChoiceModal: $("#breakChoiceModal"),
    breakChoiceCloseButton: $("#breakChoiceCloseButton"),
    breakChoiceTitle: $("#breakChoiceTitle"),
    breakChoiceNextTask: $("#breakChoiceNextTask"),
    breakReturnTime: $("#breakReturnTime"), startTimedBreakButton: $("#startTimedBreakButton"),
    startNextTaskNowButton: $("#startNextTaskNowButton"), breakTimerModal: $("#breakTimerModal"),
    breakTimerTitle: $("#breakTimerTitle"), breakCountdown: $("#breakCountdown"),
    breakTimerTaskCard: $("#breakTimerTaskCard"),
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

  let selectedTaskSubject = "语文";
  let selectedKeywordSettingsSubject = "语文";
  let focusModalTaskId = null;
  let taskEditTaskId = null;
  let taskListExpanded = false;
  let completedTasksExpanded = false;
  let orderSelectionDay = "daily";
  let orderPreviewShowing = false;
  let editingPendingTaskId = null;
  let taskEntryDay = "all";
  let lastDeletedTask = null;
  let undoDeleteTimer = null;
  let sportOptionsExpanded = false;
  let sportOptionsDate = null;
  let taskEntryReturnScroll = 0;
  let holidayUI = null;
  let historyManageMode = false;
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
  let breakTimer = null;
  let breakSession = loadBreakSession();
  let startPlanTimer = null;
  let startPlanSession = loadStartPlanSession();
  let alarmRecorder = null;
  let alarmRecordingRequestId = 0;
  let alarmPermissionPending = false;
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
    if (HolidayPlans.find(state, date) || recordFor(date)?.holidayDaily) return null;
    const day = parseIsoDate(date).getDay();
    const friday = day === 6 ? addDays(date, -1) : day === 0 ? addDays(date, -2) : date;
    if ((day === 6 || day === 0) && HolidayPlans.find(state, friday)) return null;
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
  function dailyProgressTasks(tasks = tasksForDate(), date = elements.recordDate.value) {
    const key = weekendKeyFor(date);
    if (!key) return tasks;
    if (date === key) return tasks.filter((task) => plannedDayForTask(task) === "friday");
    const saturday = date === addDays(key, 1);
    return [
      ...tasks.filter((task) => (plannedDayForTask(task) === "friday"
        || (!saturday && plannedDayForTask(task) === "saturday"))
        && (task.status !== "done" || task.completedDate === date)),
      ...tasks.filter((task) => plannedDayForTask(task) === (saturday ? "saturday" : "sunday"))
    ];
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
    elements.focusModal.dataset.subject = task.subject || "其他";
    elements.focusModalElapsed.textContent = taskClockLabel(task);
    elements.focusModalEstimate.textContent = `${estimatedMinutes(task)} 分钟`;
    elements.focusModalComparison.textContent = taskEstimateComparisonLabel(task);
    elements.focusModalStartedAt.textContent = task.startedAt || "--:--";
    const todayTasks = dailyProgressTasks();
    const done = todayTasks.filter((item) => item.status === "done").length;
    elements.focusOverallDone.textContent = String(done);
    elements.focusOverallRemaining.textContent = String(todayTasks.length - done);
    elements.focusOverallTime.textContent = `${remainingEstimatedMinutes(todayTasks)} 分钟`;
    elements.focusCompleteButton.textContent = "完成这项";
    const next = nextTaskAfter(task.id);
    elements.focusSkipButton.disabled = !next;
    elements.focusSkipButton.textContent = next ? "跳过，开始下一项" : "没有其他可做项";
    elements.focusSkipButton.title = next ? `接下来：${next.subject || "其他"} · ${next.title || "作业"}` : "今天只剩当前这一项";
  }
  function openFocusModal(id) {
    focusModalTaskId = String(id);
    elements.focusModal.hidden = false;
    elements.mainPage.inert = true;
    document.body.style.overflow = "hidden";
    updateFocusModal();
    elements.focusModalTitle.focus();
  }
  function closeFocusModal() {
    focusModalTaskId = null;
    elements.focusModal.hidden = true;
    elements.mainPage.inert = false;
    document.body.style.overflow = "";
  }

  function restoreActiveFocus() {
    const active = activeTaskForDate();
    if (active) openFocusModal(active.id);
  }

  function loadStartPlanSession() {
    try {
      const value = JSON.parse(localStorage.getItem(START_PLAN_SESSION_KEY));
      return value && typeof value === "object" && value.taskId && value.date && Number(value.startAt)
        ? value : null;
    } catch (_) {
      return null;
    }
  }

  function saveStartPlanSession() {
    if (startPlanSession) localStorage.setItem(START_PLAN_SESSION_KEY, JSON.stringify(startPlanSession));
    else localStorage.removeItem(START_PLAN_SESSION_KEY);
  }

  function setScheduledTaskCard(card, task) {
    if (card) card.dataset.subject = task?.subject || "其他";
  }

  function closeStartPlanModal() {
    window.clearInterval(startPlanTimer);
    startPlanTimer = null;
    elements.startPlanModal.hidden = true;
    if (elements.breakChoiceModal.hidden && elements.breakTimerModal.hidden) document.body.classList.remove("modal-open");
  }

  function clearStartPlanSession() {
    startPlanSession = null;
    saveStartPlanSession();
    stopAlarmPlayback();
    closeStartPlanModal();
  }

  function taskCanBeScheduled(task, date = elements.recordDate.value) {
    return Boolean(task && ["pending", "paused"].includes(task.status || "pending")
      && taskListConfirmed(date) && taskOrderSaved(date) && taskCanRunToday(task, date));
  }

  function taskResumeTimeLabel(task) {
    const seconds = Math.max(0, Math.floor(Number(task.elapsedMs || 0) / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    const duration = minutes > 0 ? `${minutes} 分钟${remainder ? ` ${remainder} 秒` : ""}`
      : seconds > 0 ? `${seconds} 秒` : "0 分钟";
    return `之前已做 ${duration}`;
  }

  function renderStartPlanTask(task, isNextTask, date = elements.recordDate.value) {
    const resuming = task.status === "paused";
    elements.startPlanTask.textContent = `${task.subject || "其他"} · ${task.title}`;
    elements.startPlanTask.dataset.subject = task.subject || "其他";
    elements.startPlanTaskLabel.textContent = resuming ? taskResumeTimeLabel(task)
      : isNextTask ? "下一项作业" : "第一项作业";
    const next = resuming ? nextTaskAfter(task.id, date) : null;
    elements.skipPausedTaskButton.hidden = !resuming;
    elements.skipPausedTaskButton.disabled = !next || Boolean(activeTaskForDate(date));
    elements.skipPausedTaskButton.title = next
      ? `接下来：${next.subject || "其他"} · ${next.title || "作业"}` : "今天没有其他可做项";
    return resuming;
  }

  function openStartPlanChoice(taskId, date = elements.recordDate.value, kind = "first") {
    const task = tasksForDate(date).find((item) => String(item.id) === String(taskId));
    if (!taskCanBeScheduled(task, date)) return;
    if (startPlanSession) clearStartPlanSession();
    if (elements.recordDate.value !== date) setRecordDate(date);
    const resuming = renderStartPlanTask(task, kind === "next", date);
    elements.startPlanTitle.textContent = resuming ? "继续刚才的作业"
      : kind === "next" ? "我准备什么时候开始下一项？" : "我准备什么时候开始？";
    elements.saveStartPlanButton.textContent = resuming ? "继续这项" : "确定";
    elements.startPlanOptions.hidden = false;
    elements.startPlanCountdownPanel.hidden = true;
    elements.startPlanCloseButton.hidden = false;
    elements.startPlanModal.querySelector(".start-plan-dialog")?.classList.remove("time-up");
    elements.startPlanModal.dataset.taskId = String(task.id);
    elements.startPlanModal.dataset.date = date;
    elements.startPlanModal.dataset.kind = kind;
    const suggested = new Date();
    elements.startPlanTime.value = `${String(suggested.getHours()).padStart(2, "0")}:${String(suggested.getMinutes()).padStart(2, "0")}`;
    elements.startPlanModal.dataset.defaultStartTime = elements.startPlanTime.value;
    clearStartPlanQuickChoice();
    elements.startPlanModal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function scheduleTaskStart(taskId, date, startAt, kind = "first") {
    const task = tasksForDate(date).find((item) => String(item.id) === String(taskId));
    if (!taskCanBeScheduled(task, date) || !Number.isFinite(Number(startAt))) return;
    startPlanSession = {
      taskId: String(taskId),
      date,
      kind,
      startAt: Number(startAt),
      alerted: false
    };
    saveStartPlanSession();
    openStartPlanTimer();
  }

  function clearStartPlanQuickChoice() {
    delete elements.startPlanModal.dataset.quickStartAt;
    delete elements.startPlanModal.dataset.quickStartTime;
    elements.startPlanFiveMinutesButton.setAttribute("aria-pressed", "false");
    elements.startPlanTenMinutesButton.setAttribute("aria-pressed", "false");
  }

  function chooseStartPlanDelay(minutes) {
    if (elements.startPlanModal.hidden || elements.startPlanOptions.hidden || ![5, 10].includes(minutes)) return;
    const startAt = Date.now() + minutes * 60000;
    clearStartPlanQuickChoice();
    elements.startPlanTime.value = timeFromEpoch(startAt);
    elements.startPlanModal.dataset.defaultStartTime = "";
    elements.startPlanModal.dataset.quickStartAt = String(startAt);
    elements.startPlanModal.dataset.quickStartTime = elements.startPlanTime.value;
    const button = minutes === 5 ? elements.startPlanFiveMinutesButton : elements.startPlanTenMinutesButton;
    button.setAttribute("aria-pressed", "true");
  }

  function renderStartPlanTimer() {
    if (!startPlanSession) return closeStartPlanModal();
    const task = tasksForDate(startPlanSession.date)
      .find((item) => String(item.id) === String(startPlanSession.taskId));
    if (!taskCanBeScheduled(task, startPlanSession.date)) {
      clearStartPlanSession();
      return;
    }
    const isNextTask = startPlanSession.kind === "next";
    const resuming = renderStartPlanTask(task, isNextTask, startPlanSession.date);
    const now = Date.now();
    const remaining = Math.max(0, Number(startPlanSession.startAt) - now);
    const seconds = Math.ceil(remaining / 1000);
    elements.startPlanCountdown.textContent = remaining > 0
      ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}\u2009:\u2009${String(seconds % 60).padStart(2, "0")}`
      : "时间到";
    elements.startPlanTitle.textContent = resuming
      ? remaining > 0 ? "继续刚才的作业" : "我计划的继续时间到了"
      : remaining > 0 ? "我按计划准备开始" : "我计划的开始时间到了";
    elements.startPlanScheduledTime.textContent = `我计划 ${timeFromEpoch(startPlanSession.startAt)} ${resuming ? "继续" : "开始"}`;
    elements.startPlannedTaskButton.textContent = resuming
      ? remaining > 0 ? "提前继续这项" : "继续这项"
      : remaining > 0 ? "我准备好了，提前开始" : isNextTask ? "开始我的下一项" : "开始我的第一项";
    elements.startPlanModal.querySelector(".start-plan-dialog")?.classList.toggle("time-up", remaining <= 0);
    if (remaining <= 0 && !startPlanSession.alerted) {
      startPlanSession.alerted = true;
      startPlanSession.nextAlertAt = now + BREAK_REMINDER_INTERVAL_MS;
      saveStartPlanSession();
      playAlarm(2);
    } else if (remaining <= 0
        && now >= Number(startPlanSession.nextAlertAt || Number(startPlanSession.startAt) + BREAK_REMINDER_INTERVAL_MS)) {
      startPlanSession.nextAlertAt = now + BREAK_REMINDER_INTERVAL_MS;
      saveStartPlanSession();
      playAlarm(1);
    }
  }

  function openStartPlanTimer() {
    if (!startPlanSession) return;
    if (elements.recordDate.value !== startPlanSession.date) setRecordDate(startPlanSession.date);
    elements.startPlanModal.dataset.taskId = String(startPlanSession.taskId);
    elements.startPlanModal.dataset.date = startPlanSession.date;
    elements.startPlanModal.dataset.kind = startPlanSession.kind || "first";
    elements.startPlanOptions.hidden = true;
    elements.startPlanCountdownPanel.hidden = false;
    elements.startPlanCloseButton.hidden = true;
    elements.startPlanModal.hidden = false;
    document.body.classList.add("modal-open");
    renderStartPlanTimer();
    window.clearInterval(startPlanTimer);
    if (startPlanSession) startPlanTimer = window.setInterval(renderStartPlanTimer, 1000);
  }

  function startTaskFromPlan() {
    const taskId = startPlanSession?.taskId || elements.startPlanModal.dataset.taskId;
    const date = startPlanSession?.date || elements.startPlanModal.dataset.date;
    if (!taskId) return;
    clearStartPlanSession();
    if (date && elements.recordDate.value !== date) setRecordDate(date);
    performTaskAction("start", taskId);
  }

  function skipPausedTaskFromPlan() {
    if (elements.startPlanModal.hidden || elements.skipPausedTaskButton.hidden || elements.skipPausedTaskButton.disabled) return;
    const taskId = startPlanSession?.taskId || elements.startPlanModal.dataset.taskId;
    const date = startPlanSession?.date || elements.startPlanModal.dataset.date;
    if (!taskId || date !== elements.recordDate.value) return;
    performTaskAction("skip-paused", taskId);
  }

  function adjustStartPlan() {
    const taskId = startPlanSession?.taskId;
    const date = startPlanSession?.date;
    const kind = startPlanSession?.kind || "first";
    if (!taskId || !date) return;
    clearStartPlanSession();
    openStartPlanChoice(taskId, date, kind);
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
    alarmRecordingRequestId += 1;
    alarmPermissionPending = false;
    if (!alarmRecorder || alarmRecorder.state === "inactive") return;
    alarmRecorder.stop();
  }

  async function toggleAlarmRecording() {
    if (alarmRecorder && alarmRecorder.state !== "inactive") return finishAlarmRecording();
    if (alarmRecorder || alarmPermissionPending || elements.alarmSettingsPage.hidden) return;
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setAlarmRecordHint("当前浏览器不能录音。");
      return;
    }
    const requestId = ++alarmRecordingRequestId;
    alarmPermissionPending = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (requestId !== alarmRecordingRequestId || elements.alarmSettingsPage.hidden) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      alarmStream = stream;
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
      if (requestId !== alarmRecordingRequestId) return;
      alarmStream?.getTracks().forEach((track) => track.stop());
      alarmStream = null;
      setAlarmRecordHint("没有取得麦克风权限，可以在浏览器设置中允许后重试。");
    } finally {
      if (requestId === alarmRecordingRequestId) alarmPermissionPending = false;
    }
  }

  let settingsDetailReturnScroll = 0;

  function hideSettingsDetailPages() {
    if (!elements.alarmSettingsPage.hidden) { finishAlarmRecording(); stopAlarmPlayback(); }
    elements.alarmSettingsPage.hidden = true;
    elements.backupSettingsPage.hidden = true;
  }

  function openSettingsDetailPage(kind) {
    settingsDetailReturnScroll = window.scrollY || 0;
    hideSettingsDetailPages();
    elements.settingsPage.hidden = true;
    elements.keywordSettingsPage.hidden = true;
    const alarm = kind === "alarm";
    (alarm ? elements.alarmSettingsPage : elements.backupSettingsPage).hidden = false;
    if (alarm) renderAlarmSettings();
    window.scrollTo({ top: 0, behavior: "instant" });
    (alarm ? elements.closeAlarmSettingsButton : elements.closeBackupSettingsButton).focus({ preventScroll: true });
  }

  function closeSettingsDetailPage() {
    const alarm = !elements.alarmSettingsPage.hidden;
    hideSettingsDetailPages();
    elements.settingsPage.hidden = false;
    window.scrollTo({ top: settingsDetailReturnScroll, behavior: "instant" });
    (alarm ? elements.openAlarmSettingsButton : elements.openBackupSettingsButton).focus({ preventScroll: true });
  }

  function openSettingsPage() {
    hideSettingsDetailPages();
    holidayUI?.hide();
    stopDictation(false, false);
    closeTaskEntryPage();
    closeWeekendPlanModal();
    closeTaskEditor();
    closeFocusModal();
    elements.mainPage.hidden = true;
    elements.historyPage.hidden = true;
    elements.dictationPage.hidden = true;
    elements.settingsPage.hidden = false;
    elements.keywordSettingsPage.hidden = true;
    renderAlarmSettings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let keywordSettingsReturnScroll = 0;

  function openKeywordSettingsPage() {
    hideSettingsDetailPages();
    finishAlarmRecording();
    stopAlarmPlayback();
    keywordSettingsReturnScroll = window.scrollY;
    elements.settingsPage.hidden = true;
    elements.keywordSettingsPage.hidden = false;
    renderTaskKeywordSettings();
    window.scrollTo({ top: 0, behavior: "instant" });
    elements.closeKeywordSettingsButton.focus({ preventScroll: true });
  }

  function closeKeywordSettingsPage() {
    elements.keywordSettingsPage.hidden = true;
    elements.settingsPage.hidden = false;
    renderAlarmSettings();
    window.scrollTo({ top: keywordSettingsReturnScroll, behavior: "instant" });
    elements.openKeywordSettingsButton.focus({ preventScroll: true });
  }

  function closeSettingsPage() {
    hideSettingsDetailPages();
    finishAlarmRecording();
    stopAlarmPlayback();
    elements.settingsPage.hidden = true;
    elements.keywordSettingsPage.hidden = true;
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

  function nextTaskAfter(id, date = elements.recordDate.value) {
    const tasks = tasksForDate(date);
    const currentIndex = tasks.findIndex((task) => String(task.id) === String(id));
    if (currentIndex < 0) return null;
    // Continue in the saved order, wrapping to unfinished earlier work only at the end.
    for (let offset = 1; offset < tasks.length; offset++) {
      const task = tasks[(currentIndex + offset) % tasks.length];
      if (task.status !== "done" && task.status !== "active" && taskCanRunToday(task, date)) return task;
    }
    return null;
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
    elements.breakChoiceModal.hidden = true;
    if (elements.breakTimerModal.hidden) document.body.classList.remove("modal-open");
  }

  function updateBreakChoiceTask() {
    const task = taskById(breakChoiceTaskId);
    if (!task) return;
    elements.breakChoiceNextTask.dataset.subject = task.subject || "其他";
    elements.breakChoiceNextTask.textContent = `${task.subject || "其他"} · ${task.title}`;
  }

  function openBreakChoice(taskId, mode = "checkpoint", sourceTaskId = null) {
    const task = taskById(taskId);
    if (!task) return;
    breakChoiceTaskId = String(taskId);
    breakChoiceSourceTaskId = sourceTaskId ? String(sourceTaskId) : null;
    breakChoiceMode = mode;
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
    setScheduledTaskCard(elements.breakTimerTaskCard, task);
    elements.breakTimerNextTask.textContent = `${task.subject || "其他"} · ${task.title}`;
    const now = Date.now();
    const remaining = Math.max(0, Number(breakSession.endAt) - now);
    const seconds = Math.ceil(remaining / 1000);
    elements.breakCountdown.textContent = remaining > 0
      ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}\u2009:\u2009${String(seconds % 60).padStart(2, "0")}`
      : "时间到";
    elements.breakTimerTitle.textContent = remaining > 0 ? "我正在休息" : "我计划的休息时间到了";
    elements.breakPlannedReturn.textContent = `我计划 ${timeFromEpoch(breakSession.endAt)} 回来`;
    elements.breakTimerModal.querySelector(".break-timer-dialog").classList.toggle("time-up", remaining <= 0);
    elements.extendBreakButton.hidden = Boolean(breakSession.extended);
    elements.startNextTaskButton.textContent = remaining <= 0 ? "开始下一项" : "现在开始";
    if (remaining <= 0 && !breakSession.alerted) {
      breakSession.alerted = true;
      breakSession.nextAlertAt = now + BREAK_REMINDER_INTERVAL_MS;
      saveBreakSession();
      playAlarm(2);
    } else if (remaining <= 0 && now >= Number(breakSession.nextAlertAt || Number(breakSession.endAt) + BREAK_REMINDER_INTERVAL_MS)) {
      breakSession.nextAlertAt = now + BREAK_REMINDER_INTERVAL_MS;
      saveBreakSession();
      playAlarm(1);
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
  }

  function pendingDailyRequirements(record = currentRecord() || {}) {
    return [
      ["运动打卡", sportsForRecord(record).length > 0],
      ["中文阅读", record.readingDone],
      ["数学思维", record.mathThinkingDone],
      ["英文阅读", record.englishReadingDone]
    ].filter(([, done]) => !done).map(([title]) => title);
  }

  function renderDailyCheckins() {
    const record = currentRecord() || {};
    if (sportOptionsDate !== elements.recordDate.value) {
      sportOptionsExpanded = false;
      sportOptionsDate = elements.recordDate.value;
    }
    const sports = sportsForRecord(record);
    elements.sportCard.classList.toggle("completed", sports.length > 0);
    elements.sportCard.setAttribute("aria-expanded", String(sportOptionsExpanded));
    elements.sportCard.setAttribute("aria-label", `运动打卡，${sports.length ? `已完成：${sports.join("、")}` : "待完成"}，${sportOptionsExpanded ? "收起" : "展开"}运动项目`);
    elements.sportStatus.textContent = sports.length ? "已完成" : "待完成";
    elements.sportOptions.hidden = !sportOptionsExpanded;
    elements.sportOptions.querySelectorAll("button[data-sport]").forEach((button) => {
      button.setAttribute("aria-pressed", String(sports.includes(button.dataset.sport)));
    });
    for (const [title, field, button, status] of [
      ["中文阅读", "readingDone", elements.readingButton, elements.readingStatus],
      ["数学思维", "mathThinkingDone", elements.mathThinkingButton, elements.mathThinkingStatus],
      ["英文阅读", "englishReadingDone", elements.englishReadingButton, elements.englishReadingStatus]
    ]) {
      const done = Boolean(record[field]);
      setPrepState(button, done);
      status.textContent = done ? "已完成" : "待完成";
      button.setAttribute("aria-label", `${title}，${done ? "已完成，点击撤销打卡" : "待完成，点击打卡"}`);
    }
    elements.dailyCheckinsSummary.textContent = `已完成 ${4 - pendingDailyRequirements(record).length} / 4`;
  }

  function openWeekendPlanModal() {
    openTaskEntryPage();
  }

  function closeWeekendPlanModal() {
    if (elements.weekendPlanModal.hidden) return;
    elements.weekendPlanModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openTaskEntryPage() {
    hideSettingsDetailPages();
    const holiday = HolidayPlans.find(state, elements.recordDate.value);
    if (holiday) { holidayUI?.openPlan(holiday.id); return; }
    if (!canEditTaskPlan() && !weekendKeyFor(elements.recordDate.value)) return;
    if (!elements.taskEntryPage.hidden) return;
    if (canEditTaskPlan()) invalidateTaskPlan();
    editingPendingTaskId = null;
    taskEntryDay = "all";
    setTaskDraftError(); setSubjectPickerOpen(false);
    elements.taskEntryPage.hidden = false;
    taskEntryReturnScroll = window.scrollY || 0;
    elements.mainPage.hidden = true;
    elements.historyPage.hidden = true;
    elements.settingsPage.hidden = true;
    elements.dictationPage.hidden = true;
    elements.keywordSettingsPage.hidden = true;
    document.body.classList.add("task-entry-page-open");
    window.scrollTo?.(0, 0);
    resizeTaskEntryPage();
    render();
    if (canChooseTaskOrder() && taskOwnerForDate()?.orderDraft) openTaskOrderModal();
    else (tasksForDate().length ? elements.taskEntryCloseButton : elements.taskDraft).focus();
  }

  function closeTaskEntryPage() {
    if (elements.taskEntryPage.hidden) return;
    setSubjectPickerOpen(false);
    elements.taskOrderModal.hidden = true;
    elements.taskEntryPage.hidden = true;
    elements.mainPage.hidden = false;
    document.body.classList.remove("task-entry-page-open");
    window.scrollTo?.(0, taskEntryReturnScroll);
    (elements.taskEntryLauncher.hidden ? elements.weekendPlanEntry : elements.taskEntryLauncher).focus();
  }

  function resizeTaskEntryPage() {
    holidayUI?.resize();
    if (elements.taskEntryPage.hidden) return;
    const height = window.visualViewport?.height || window.innerHeight;
    if (height) elements.taskEntryPage.style.height = `${height}px`;
  }

  function keepTaskEntryComposerFixed(taskId) {
    window.requestAnimationFrame(() => {
      if (elements.taskEntryPage.hidden) return;
      const addedRow = taskId
        ? [...elements.taskEntryPendingList.querySelectorAll("[data-pending-task-id]")]
          .find((row) => row.dataset.pendingTaskId === String(taskId))
        : null;
      if (addedRow) addedRow.scrollIntoView({ block: "nearest" });
      else elements.taskEntryPendingSection.scrollTop = elements.taskEntryPendingSection.scrollHeight;
      elements.taskDraft.focus({ preventScroll: true });
      elements.taskDraft.setSelectionRange(elements.taskDraft.value.length, elements.taskDraft.value.length);
    });
  }

  function resizeTaskDraft() {
    elements.taskDraft.style.height = "48px";
    elements.taskDraft.style.height = `${Math.max(48, Math.min(elements.taskDraft.scrollHeight, 72))}px`;
  }

  function setSubjectPickerOpen(open) {
    elements.subjectTabs.hidden = !open;
    elements.subjectPickerButton.setAttribute("aria-expanded", String(open));
  }

  function setTaskDraftError(message = "") {
    const hasError = Boolean(message);
    elements.taskDraftError.textContent = message || "请先输入作业内容";
    elements.taskDraftError.hidden = !hasError;
    elements.taskDraft.setAttribute("aria-invalid", String(hasError));
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
    hideSettingsDetailPages();
    holidayUI?.hide();
    stopDictation(false, false);
    closeTaskEntryPage();
    closeWeekendPlanModal();
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
    elements.keywordSettingsPage.hidden = true;
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
    hideSettingsDetailPages();
    holidayUI?.hide();
    closeTaskEntryPage();
    closeWeekendPlanModal();
    closeTaskEditor();
    closeFocusModal();
    elements.historyPage.hidden = true;
    elements.settingsPage.hidden = true;
    elements.mainPage.hidden = true;
    elements.dictationPage.hidden = false;
    elements.keywordSettingsPage.hidden = true;
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
    elements.weekendPlanEntry.hidden = !weekendMode || (date === key && canEditTaskPlan());
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
    elements.weekendPlanEntry.hidden = isFriday && !executionStarted;
    const fridayTasks = tasks.filter((task) => plannedDayForTask(task) === "friday");
    const saturdayTasks = tasks.filter((task) => plannedDayForTask(task) === "saturday");
    const sundayTasks = tasks.filter((task) => plannedDayForTask(task) === "sunday");
    const completed = (items) => items.filter((task) => task.status === "done").length;
    const orderSaved = taskOrderSaved(date);

    elements.weekendPlanEntryTitle.textContent = "查看三天作业计划";
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
          ${taskSubjectBadgeHtml(subject)}
          <div class="weekend-plan-body"><div class="weekend-plan-heading"><div class="weekend-plan-copy"><strong>${escapeHtml(task.title || "未命名作业")}</strong></div>${taskEstimateHtml(task)}</div>
          <div class="plan-day-tabs" role="group" aria-label="${escapeHtml(task.title || "作业")}计划日期">
            <button type="button" data-plan-day="friday" data-task-id="${escapeHtml(String(task.id))}" aria-pressed="${day === "friday"}"${disabled}>周五</button>
            <button type="button" data-plan-day="saturday" data-task-id="${escapeHtml(String(task.id))}" aria-pressed="${day === "saturday"}"${disabled}>周六</button>
            <button type="button" data-plan-day="sunday" data-task-id="${escapeHtml(String(task.id))}" aria-pressed="${day === "sunday"}"${disabled}>周日</button>
          </div>
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
          : isFriday && !orderSaved ? "日期已安排，接下来分别选择三天的顺序。"
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
    // The stored order is the child's plan. Never regroup it by subject.
    return tasks.slice();
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
    const id = escapeAttribute(String(task.id)), editable = canEditTaskPlan();
    const weekend = Boolean(weekendKeyFor(elements.recordDate.value)), day = plannedDayForTask(task);
    const dayControl = weekend ? (editable
      ? `<select class="task-plan-day" data-entry-plan-day="${id}" aria-label="${escapeAttribute(task.title)}完成日期">${[["friday", "周五"], ["saturday", "周六"], ["sunday", "周日"]].map(([value, label]) => `<option value="${value}"${day === value ? " selected" : ""}>${label}</option>`).join("")}</select>`
      : `<small>${plannedDayLabel(task)}</small>`) : "";
    const editing = editable && String(editingPendingTaskId || "") === String(task.id);
    return `<div class="pending-task-row task-plan-row" data-subject="${escapeAttribute(task.subject || "其他")}" data-pending-task-id="${id}">
      ${taskSubjectBadgeHtml(task.subject)}
      <div class="task-plan-copy">${editing ? `<input class="pending-task-edit-input" data-pending-edit-id="${id}" maxlength="120" value="${escapeAttribute(task.title || "")}" aria-label="修改作业内容">` : `<strong class="pending-task-title">${escapeHtml(task.title || "未命名作业")}</strong>`}
        ${!editable && task.status === "done" ? "<small>已完成</small>" : ""}</div>
      <div class="task-plan-actions"><div class="task-plan-schedule">${taskEstimateHtml(task)}${dayControl}</div>${editable ? `<div class="pending-task-actions">${editing ? taskButton("保存", "save-edit", task.id) + taskButton("取消", "cancel-edit", task.id) : taskButton("修改", "edit", task.id) + taskButton("删除", "delete", task.id, "danger-task-action")}</div>` : ""}</div>
    </div>`;
  }

  function pendingTaskListHtml(tasks) {
    const weekend = Boolean(weekendKeyFor(elements.recordDate.value));
    const groups = weekend ? taskOrderGroups() : [{ day: "daily", label: "今天", tasks }];
    return groups.filter(group => taskEntryDay === "all" || taskEntryDay === group.day)
      .map(group => `<section class="pending-subject-group">${weekend ? `<h3 class="order-preview-heading">${group.label}</h3>` : ""}${group.tasks.map(task => pendingTaskRow(task)).join("")}</section>`).join("");
  }

  function renderTasks() {
    const date = elements.recordDate.value;
    const holiday = HolidayPlans.find(state, date);
    holidayUI?.renderHome();
    const key = weekendKeyFor(date);
    const weekend = key ? weekendForDate(date) || {} : null;
    const isFriday = Boolean(key && date === key);
    const canEditList = !key || isFriday;
    const ledgerReady = holiday || recordFor(date)?.holidayDaily || (key && !isFriday) ? true : Boolean(recordFor(date)?.ledgerConfirmed);
    const tasks = tasksForDate(date);
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
    elements.taskEntryLauncher.hidden = !canEnterTasks || Boolean(holiday);
    elements.taskEntry.hidden = !canEnterTasks;
    const entryStatus = tasks.length
      ? `已录入 ${tasks.length} 项，可继续补充其他科目`
      : "选择科目，输入作业";
    elements.taskEntryLauncherStatus.textContent = entryStatus;
    elements.emptyTaskList.hidden = tasks.length > 0 || canEnterTasks;
    elements.emptyTaskList.textContent = key && !isFriday
      ? "周五还没有录入作业清单，请回到周五完成录入和安排。"
      : ledgerReady ? "还没有作业，点击“录入作业”开始。" : "核对钉钉并补全成长记录册后，再录入作业。";
    elements.taskListFooter.hidden = !confirmed;
    if (holiday) elements.emptyTaskList.textContent = "这一天还没有安排作业，可以打开假期计划查看。";
    elements.confirmTaskListButton.hidden = Boolean(holiday) || !confirmed || !canEditList || !allPending;
    elements.confirmTaskListButton.textContent = "修改计划";
    elements.taskOrderButton.hidden = true;
    elements.taskOrderButton.textContent = sortingMode ? "选择作业顺序" : "重新选择顺序";
    elements.taskOrderButton.className = sortingMode
      ? "primary-button compact-button" : "text-button bordered compact-order-button";
    const currentRecordData = recordFor(date) || {};
    const taskConfirmHint = holiday || currentRecordData.holidayDaily ? "" : sortingMode
      ? ""
      : orderPendingWeekend ? "周末顺序还没有确定，请回到周五完成最后一步。"
      : key && isFriday && orderSaved ? "周末完成日期和三天顺序都安排好了。"
      : !canEditList
      ? weekend?.planSaved ? "清单来自周五，按计划日期逐项完成。" : "请先回到周五保存周末安排。"
      : !ledgerReady ? "第 1 步：核对钉钉，补全成长记录册。"
        : confirmed
      ? doneCount === tasks.length && tasks.length
        ? key ? "周末清单已全部完成并自动结算。"
          : currentRecordData.finishTime ? "最后一项完成时已自动结算。" : "清单已完成，补全成长记录册后自动结算。"
        : key && !weekend.planSaved ? "请打开修改计划，确认日期与顺序。" : ""
      : tasks.length ? "核对无误后再确认清单。" : "点击“录入作业”添加完整清单。";
    elements.taskConfirmHint.textContent = taskConfirmHint;
    elements.taskConfirmHint.hidden = !taskConfirmHint;
    const questMode = confirmed && orderSaved && (!key || weekend.planSaved);
    const questTasks = questMode ? dailyProgressTasks(tasks, date) : tasks;
    const questDone = questTasks.filter((task) => task.status === "done");
    const questRemaining = questTasks.filter((task) => task.status !== "done");
    const progressTotal = questMode ? questTasks.length : tasks.length;
    const progressDone = questMode ? questDone.length : doneCount;
    elements.taskPanelHeading.hidden = questMode;
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
    const taskCard = (task, options = {}) => {
      const status = task.status || "pending";
      const editable = questMode && status === "pending";
      let buttons = "";
      let launchButton = "";
      const canDoToday = canDoTaskToday(task);
      const allowActions = options.allowActions !== false;
      if (confirmed && canDoToday && allowActions) {
        if (status === "active") {
          buttons = taskButton("休息一下", "pause", task.id) + taskButton("完成", "complete", task.id, "primary-task-action");
        } else if (status === "paused") {
          buttons = taskButton("继续", "start", task.id, "primary-task-action") + taskButton("完成", "complete", task.id);
        } else if (status === "done") {
          buttons = taskButton("撤销完成", "undo", task.id);
        } else {
          launchButton = `<button class="task-launch-button" type="button" data-task-action="start" data-task-id="${escapeAttribute(String(task.id))}" aria-label="${escapeAttribute(`开始挑战：${task.subject || "其他"}，${task.title || "作业"}`)}"><span class="task-launch-icon" aria-hidden="true">▶</span><span>开始挑战</span></button>`;
        }
      } else if (!confirmed && canEditList) {
        buttons = taskButton("删除", "delete", task.id, "danger-task-action");
      }
      const meta = status === "done"
        ? `${task.completedDate ? `${formatDate(task.completedDate)} ` : ""}${task.completedAt || "已"} 完成 · 实际 ${taskActualMinutes(task)} 分钟`
        : status === "active" || status === "paused" ? `已用 ${taskDurationLabel(task)}`
          : key && weekend.planSaved && !canDoToday ? `计划${plannedDayLabel(task)}完成` : "";
      const planBadge = key && weekend.planSaved ? `<span class="task-plan-badge">${plannedDayLabel(task)}</span>` : "";
      const plannedToday = key && plannedDateForTask(key, task) === date;
      const editAttributes = editable
        ? ` data-edit-task-id="${escapeHtml(String(task.id))}" tabindex="0" aria-label="修改${escapeAttribute(task.title || "当前作业")}"`
        : "";
      return `<article class="task-item ${status}${plannedToday ? " planned-today" : ""}${options.current ? " quest-current-card" : ""}${options.compact ? " quest-compact-card" : ""}${editable ? " editable-task-card" : ""}${launchButton ? " has-launch-action" : ""}" data-subject="${escapeHtml(task.subject || "其他")}"${editAttributes}>
        ${taskSubjectBadgeHtml(task.subject)}
        <div class="task-main-row">
          <div class="task-copy">
            <span class="task-title-row"><strong class="task-title">${escapeHtml(task.title || "未命名作业")}</strong>${editable ? '<span class="task-edit-mark" aria-hidden="true">✎</span>' : ""}${planBadge}</span>
            ${meta ? `<small class="task-meta">${escapeHtml(meta)}</small>` : ""}
          </div>
          <div class="task-card-aside">${taskEstimateHtml(task)}${buttons ? `<div class="task-buttons">${buttons}</div>` : ""}</div>
        </div>
        ${launchButton}
      </article>`;
    };

    renderTaskEntryPlan();

    if (!confirmed) {
      elements.taskList.innerHTML = "";
      return;
    }

    if (sortingMode) {
      elements.activeTaskBanner.hidden = true;
      const totalEstimate = tasks.reduce((sum, task) => sum + estimatedMinutes(task), 0);
      elements.taskList.innerHTML = `<div class="order-intro">预计净学习 ${totalEstimate} 分钟</div>`;
      return;
    }

    if (!questMode) {
      elements.taskList.innerHTML = tasks.map((task) => taskCard(task, { allowActions: !orderPendingWeekend })).join("");
      return;
    }

    const remainingMinutes = remainingEstimatedMinutes(questRemaining);
    const overviewHtml = `<div class="task-overview" role="group" aria-label="今日作业完成情况">
      <span class="task-completed-count" aria-label="已做 ${progressDone} 项，共 ${progressTotal} 项">已做 <b>${progressDone} / ${progressTotal}</b></span>
      <span class="task-remaining-time">预计还需 <strong>${remainingMinutes} 分钟</strong></span>
    </div>`;

    if (!questRemaining.length) {
      const completedHtml = questDone.length
        ? `<button class="quest-toggle" type="button" data-list-toggle="completed">${completedTasksExpanded ? "收起已完成作业" : `看看闯过的 ${questDone.length} 关`} <span>${completedTasksExpanded ? "⌃" : "⌄"}</span></button>
          ${completedTasksExpanded ? `<div class="quest-collapsed-list">${questDone.map((task) => taskCard(task, { compact: true })).join("")}</div>` : ""}` : "";
      const pendingRequired = pendingDailyRequirements();
      const completionHtml = pendingRequired.length
        ? `<div class="day-tasks-pending" role="status"><strong>${questTasks.length ? "作业已完成" : "今天没有安排作业"}，习惯打卡还剩 ${pendingRequired.length} 项</strong><small>${pendingRequired.join("、")}</small></div>`
        : '<div class="quest-victory" role="status"><span aria-hidden="true">🎉</span><strong>今天的任务都完成啦！</strong><small>作业和习惯打卡，全部完成。</small></div>';
      elements.taskList.innerHTML = `${overviewHtml}${completionHtml}${completedHtml}`;
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
    elements.taskList.innerHTML = `${overviewHtml}${currentHtml}${upcomingHtml}${laterHtml}${doneHtml}`;
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
    const holiday = HolidayPlans.find(state, date);
    if (holiday && date !== holiday.planDate) elements.ledgerButton.hidden = true;
    renderDailyCheckins();
    elements.ledgerButton.setAttribute("aria-pressed", String(Boolean(record.ledgerConfirmed)));
    elements.ledgerTitle.textContent = record.ledgerConfirmed
      ? "我已核对钉钉，也补全了成长记录册" : "核对钉钉，补全成长记录册";
    elements.ledgerStatus.textContent = record.ledgerConfirmed
      ? `${record.ledgerAt || "已"} 完成` : "把钉钉里新增的作业补充进去";
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
    if (field === "ledgerConfirmed" && !HolidayPlans.find(state, elements.recordDate.value) && !currentRecord()?.holidayDaily && tasksForDate().length && allTasksDone()) {
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
    closeTaskOrderModal();
    closeTaskEntryPage();
    closeTaskEditor();
    closeFocusModal();
    taskListExpanded = false;
    completedTasksExpanded = false;
    elements.recordDate.value = date;
    render();
  }

  function addTasksFromDraft() {
    if (!canEditTaskPlan() || !elements.taskOrderModal.hidden) return;
    const date = elements.recordDate.value;
    const key = weekendKeyFor(date);
    if (key && date !== key) return showToast("周六、周日直接使用周五清单，不需要重新录入");
    if (!currentRecord()?.ledgerConfirmed) return showToast("请先核对钉钉，并补全成长记录册");
    const parsed = parseTaskDraft(elements.taskDraft.value.trim(), selectedTaskSubject);
    if (!parsed.length) {
      setTaskDraftError("请先输入作业内容");
      elements.taskDraft.focus();
      return;
    }
    setTaskDraftError();
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    const existing = Array.isArray(owner.tasks) ? owner.tasks : [];
    const stamp = Math.max(Date.now(), ...existing.map(task => Number(task.addedAt) + 1 || 0));
    const addedTasks = parsed.map((task, index) => ({
      id: `${stamp}-${index}`,
      addedAt: stamp,
      addedSequence: index,
      subject: task.subject,
      title: task.title,
      status: "pending",
      elapsedMs: 0,
      estimatedMinutes: estimatedMinutes({ estimatedMinutes: Number(elements.taskEntryEstimate.value) }),
      ...(key ? { plannedDay: "saturday" } : {})
    }));
    owner.tasks = pendingTaskOrder(existing.concat(addedTasks));
    delete owner.orderDraft;
    taskEntryDay = "all";
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
    elements.taskEntryEstimate.value = "15";
    resizeTaskDraft();
    editingPendingTaskId = null;
    persist();
    render();
    keepTaskEntryComposerFixed(addedTasks[addedTasks.length - 1].id);
    showToast(`我把 ${parsed.length} 项作业收进清单了`);
  }

  function toggleTaskListConfirmation() {
    openTaskEntryPage();
  }

  function canEditTaskPlan() {
    const date = elements.recordDate.value, key = weekendKeyFor(date);
    return (!key || key === date) && Boolean(recordFor(date)?.ledgerConfirmed)
      && tasksForDate().every(task => (task.status || "pending") === "pending");
  }

  function invalidateTaskPlan() {
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    if (startPlanSession?.date === elements.recordDate.value) clearStartPlanSession();
    delete owner.tasksConfirmed; delete owner.tasksConfirmedAt;
    delete owner.confirmed; delete owner.confirmedAt;
    delete owner.orderSaved; delete owner.orderSavedAt;
    delete owner.planSaved; delete owner.planSavedAt;
    persist();
  }

  function applySelectedTaskOrder() {
    const draft = taskOrderDraft();
    if (draft.selectedIds.length !== tasksForDate().length) return false;
    taskOwnerForDate().tasks = taskOrderGroups().flatMap(group => draft.selectedIds
      .map(id => group.tasks.find(task => String(task.id) === id)).filter(Boolean));
    delete taskOwnerForDate().orderDraft;
    return true;
  }

  function returnToTaskEntry() {
    if (!canEditTaskPlan()) return closeTaskOrderModal();
    applySelectedTaskOrder();
    delete taskOwnerForDate().orderDraft;
    persist(); closeTaskOrderModal(); renderTasks();
  }

  function confirmTaskPlan() {
    if (!canEditTaskPlan() || !tasksForDate().length) return;
    if (elements.taskDraft.value.trim()) return setTaskDraftError("还有未添加的作业，请先点加号或清空输入框");
    if (editingPendingTaskId) return showToast("请先保存或取消正在修改的作业");
    if (!elements.taskOrderModal.hidden && !applySelectedTaskOrder()) return showToast("请选完顺序，或返回录入保留原顺序");
    const owner = taskOwnerForDate(), key = weekendKeyFor(elements.recordDate.value);
    owner.tasks = taskOrderGroups().flatMap(group => group.tasks);
    owner.orderSaved = true; owner.orderSavedAt = currentTime();
    delete owner.orderDraft;
    if (key) {
      owner.confirmed = true; owner.confirmedAt = currentTime();
      owner.planSaved = true; owner.planSavedAt = currentTime();
      owner.tasks.forEach(task => { task.plannedDay = plannedDayForTask(task); });
      delete owner.penaltyConfirmed;
    } else {
      owner.tasksConfirmed = true; owner.tasksConfirmedAt = currentTime();
    }
    taskListExpanded = false; completedTasksExpanded = false;
    closeTaskEntryPage(); persist(); render();
    const first = nextTaskForToday();
    if (first) openStartPlanChoice(first.id);
  }

  function renderTaskEntryPlan() {
    const tasks = tasksForDate(), editable = canEditTaskPlan(), sorting = !elements.taskOrderModal.hidden;
    const weekend = Boolean(weekendKeyFor(elements.recordDate.value));
    elements.taskEntry.hidden = false;
    elements.taskEntryOrderButton.hidden = !editable || !tasks.length || sorting;
    elements.taskEntryOrderButton.textContent = taskOwnerForDate()?.orderDraft ? "继续调整" : "调整顺序";
    elements.taskEntryDays.hidden = !weekend || sorting || !tasks.length;
    elements.taskEntryDays.innerHTML = [["all", "全部"], ["friday", "周五"], ["saturday", "周六"], ["sunday", "周日"]]
      .map(([day, label]) => `<button type="button" data-entry-day="${day}" aria-pressed="${day === taskEntryDay}">${label}</button>`).join("");
    elements.taskEntryComposer.hidden = !editable || sorting;
    elements.taskEntry.classList.toggle("has-pending", tasks.length > 0 && !sorting);
    elements.taskEntryEmpty.hidden = tasks.length > 0 || !editable || sorting;
    elements.taskEntryPendingSection.hidden = tasks.length === 0 || sorting;
    elements.taskEntryPendingList.innerHTML = pendingTaskListHtml(tasks);
    elements.taskEntryUndoDeleteButton.hidden = sorting || !editable || !lastDeletedTask || lastDeletedTask.date !== elements.recordDate.value;
    elements.taskEntryConfirmButton.hidden = !editable;
    elements.taskEntryConfirmButton.textContent = "确定";
    elements.taskEntryConfirmButton.disabled = !tasks.length || (sorting && taskOrderDraft().selectedIds.length !== tasks.length);
    if (sorting) renderOrderSelection();
  }


  function canChooseTaskOrder() {
    return canEditTaskPlan() && tasksForDate().length > 0;
  }

  function orderDayForTask(task) {
    return weekendKeyFor(elements.recordDate.value) ? plannedDayForTask(task) : "daily";
  }

  function taskOrderGroups() {
    const tasks = tasksForDate();
    return (weekendKeyFor(elements.recordDate.value)
      ? [["friday", "周五"], ["saturday", "周六"], ["sunday", "周日"]] : [["daily", "今天"]])
      .map(([day, label]) => ({ day, label, tasks: tasks.filter((task) => orderDayForTask(task) === day) }))
      .filter((group) => group.tasks.length);
  }

  // Keep a separate draft: choosing a card never moves the underlying task list.
  // The task/day snapshot also invalidates stale drafts after editing or importing a list.
  function taskOrderDraft() {
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    const taskIds = tasksForDate().map((task) => String(task.id));
    const days = tasksForDate().map(orderDayForTask);
    let draft = owner.orderDraft;
    if (!draft || JSON.stringify(draft.taskIds) !== JSON.stringify(taskIds)
        || JSON.stringify(draft.days) !== JSON.stringify(days)) {
      draft = owner.orderDraft = { taskIds, days, selectedIds: [] };
    }
    draft.selectedIds = [...new Set(Array.isArray(draft.selectedIds) ? draft.selectedIds.map(String) : [])]
      .filter((id) => taskIds.includes(id));
    return draft;
  }

  function closeTaskOrderModal() {
    elements.taskOrderModal.hidden = true;
  }

  function openTaskOrderModal() {
    if (!canChooseTaskOrder()) return;
    if (elements.taskDraft.value.trim() || editingPendingTaskId) return showToast("请先添加或保存正在录入的作业");
    if (elements.taskEntryPage.hidden) { openTaskEntryPage(); if (!elements.taskOrderModal.hidden) return; }
    const draft = taskOrderDraft(), groups = taskOrderGroups();
    orderSelectionDay = (groups.find(group => group.tasks.some(task => !draft.selectedIds.includes(String(task.id)))) || groups[0]).day;
    orderPreviewShowing = false;
    elements.taskOrderModal.hidden = false; setSubjectPickerOpen(false);
    persist(); renderTaskEntryPlan(); renderOrderSelection(true);
    elements.taskOrderCloseButton.focus({ preventScroll: true });
  }

  function taskSubjectBadgeHtml(subject) {
    const characters = Array.from(subject || "其他");
    const split = Math.ceil(characters.length / 2);
    return `<span class="task-subject-label"><span>${escapeHtml(characters.slice(0, split).join(""))}</span><span>${escapeHtml(characters.slice(split).join(""))}</span></span>`;
  }

  function taskEstimateHtml(task) {
    return `<span class="task-estimate" aria-label="${escapeAttribute(task.title || "作业")}预计用时 ${estimatedMinutes(task)} 分钟">预计 ${estimatedMinutes(task)} 分钟</span>`;
  }

  function renderOrderSelection(resetScroll = false) {
    if (elements.taskOrderModal.hidden) return;
    if (!canChooseTaskOrder()) return closeTaskOrderModal();
    const draft = taskOrderDraft();
    const groups = taskOrderGroups();
    const preview = draft.selectedIds.length === draft.taskIds.length;
    const group = groups.find((item) => item.day === orderSelectionDay) || groups[0];
    orderSelectionDay = group.day;
    const selectedFor = (item) => draft.selectedIds.filter((id) => item.tasks.some((task) => String(task.id) === id));
    const selected = selectedFor(group);
    const title = preview ? "" : selected.length === group.tasks.length
      ? `${group.label}已选好` : `第 ${selected.length + 1} 项，我选……`;
    elements.taskOrderTitle.textContent = title;
    elements.taskOrderTitle.hidden = preview;
    elements.taskOrderDays.hidden = preview || groups.length === 1;
    elements.taskOrderDays.innerHTML = groups.map((item) => `<button type="button" data-order-day="${item.day}" aria-pressed="${item.day === group.day}">${item.label} ${selectedFor(item).length}/${item.tasks.length}</button>`).join("");
    const card = (task, number) => `<article class="task-item order-choice-row${number && !preview ? " is-picked" : ""}" data-subject="${escapeHtml(task.subject || "其他")}">
      ${preview ? '<div class="order-pick-card">' : `<button class="order-pick-card" type="button" data-order-pick="${escapeAttribute(String(task.id))}" aria-pressed="${number > 0}" aria-label="${escapeAttribute(`${number ? `第 ${number} 项：` : "选择："}${task.subject || "其他"}，${task.title}`)}">`}
        ${taskSubjectBadgeHtml(task.subject)}
        <span class="order-number" aria-hidden="true">${number || ""}</span>
        <span class="task-copy"><strong class="task-title">${escapeHtml(task.title || "未命名作业")}</strong></span>
      ${preview ? "</div>" : "</button>"}
      ${taskEstimateHtml(task)}
    </article>`;
    const scrollTop = resetScroll || preview !== orderPreviewShowing ? 0 : elements.taskOrderChoices.scrollTop;
    const focusedId = document.activeElement?.dataset?.orderPick;
    elements.taskOrderChoices.innerHTML = preview ? groups.map((item) => `${groups.length > 1 ? `<h3 class="order-preview-heading">${item.label}</h3>` : ""}${selectedFor(item).map((id, index) => card(item.tasks.find((task) => String(task.id) === id), index + 1)).join("")}`).join("")
      : group.tasks.map((task) => card(task, selected.indexOf(String(task.id)) + 1)).join("");
    if (focusedId && !preview) [...elements.taskOrderChoices.querySelectorAll("button[data-order-pick]")]
      .find((button) => button.dataset.orderPick === focusedId)?.focus({ preventScroll: true });
    elements.taskOrderChoices.scrollTop = scrollTop;
    orderPreviewShowing = preview;
    elements.taskOrderUndoButton.disabled = !draft.selectedIds.length;
    elements.taskOrderResetButton.disabled = !draft.selectedIds.length;
    const nextGroup = groups.find((item) => selectedFor(item).length < item.tasks.length);
    elements.taskOrderConfirmButton.hidden = preview || selected.length < group.tasks.length;
    elements.taskOrderConfirmButton.textContent = `选择${nextGroup?.label || "下一天"}`;
    elements.taskOrderCloseButton.textContent = preview ? "返回录入" : "取消调整";
    elements.taskEntryConfirmButton.disabled = !preview;
  }

  function chooseTaskOrder(id) {
    if (!canChooseTaskOrder()) return;
    const task = taskById(id);
    const draft = taskOrderDraft();
    if (!task || orderDayForTask(task) !== orderSelectionDay || draft.selectedIds.includes(String(id))) return;
    draft.selectedIds.push(String(id));
    persist();
    renderTasks();
    renderOrderSelection();
  }

  function undoTaskOrderSelection(reset = false) {
    if (!canChooseTaskOrder()) return;
    const draft = taskOrderDraft();
    const lastTask = taskById(draft.selectedIds[draft.selectedIds.length - 1]);
    if (reset) {
      draft.selectedIds = [];
      orderSelectionDay = taskOrderGroups()[0].day;
    } else {
      draft.selectedIds.pop();
      if (lastTask) orderSelectionDay = orderDayForTask(lastTask);
    }
    persist();
    renderTasks();
    renderOrderSelection(true);
  }

  function confirmTaskOrderSelection() {
    if (!canChooseTaskOrder()) return;
    const draft = taskOrderDraft();
    const next = taskOrderGroups().find(group => group.tasks.some(task => !draft.selectedIds.includes(String(task.id))));
    if (next) { orderSelectionDay = next.day; renderOrderSelection(true); }
    else confirmTaskPlan();
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
    delete task.steps;
    persist();
    closeTaskEditor();
    renderTasks();
    showToast("这项作业修改好了");
  }

  function toggleTaskOrder() {
    if (canChooseTaskOrder()) openTaskOrderModal();
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
    lastDeletedTask = { date, index: tasksForDate().findIndex(item => String(item.id) === String(task.id)), task: JSON.parse(JSON.stringify(task)) };
    undoDeleteTimer = window.setTimeout(() => {
      lastDeletedTask = null;
      elements.taskEntryUndoDeleteButton.hidden = true;
    }, 15000);
  }

  function undoPendingTaskDelete() {
    if (!lastDeletedTask || lastDeletedTask.date !== elements.recordDate.value || taskListConfirmed()) return;
    const restored = lastDeletedTask.task;
    const owner = taskOwnerForDate(elements.recordDate.value, true);
    owner.tasks = [...(Array.isArray(owner.tasks) ? owner.tasks : [])];
    owner.tasks.splice(Math.min(lastDeletedTask.index, owner.tasks.length), 0, restored);
    delete owner.orderDraft;
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
    let focusAfterRenderTaskId = null;
    let nextStartPlanTaskId = null;
    let offerBreakTaskId = null;
    let offerBreakMode = "checkpoint";
    let offerBreakSourceTaskId = null;
    if (action === "delete") {
      if (!canEditTaskPlan() || !elements.taskOrderModal.hidden) return;
      if (key && date !== key) return showToast("周末清单只能在周五修改");
      const owner = taskOwnerForDate(elements.recordDate.value, true);
      rememberDeletedTask(task, date);
      owner.tasks = tasks.filter((item) => String(item.id) !== String(id));
      delete owner.orderDraft;
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
    if (!key && record.finishTime && !record.holidayDaily && action !== "undo") return showToast("当天已经结算，如需修改可先撤销一项完成");
    const skipping = action === "skip" || action === "skip-paused";
    if (action === "start" || skipping) {
      let taskToStart = task;
      if (skipping) {
        if (task.status !== (action === "skip-paused" ? "paused" : "active")) return;
        taskToStart = nextTaskAfter(id, date);
        if (!taskToStart) return showToast("今天没有其他可做项，可以完成这项或先休息");
      }
      const active = activeTaskForDate();
      if (active && active !== task) return showToast(`请先暂停或完成“${active.title}”`);
      if (breakSession) cancelBreak(false);
      if (startPlanSession || action === "skip-paused") clearStartPlanSession();
      if (skipping) stopTaskClock(task, "paused");
      taskToStart.status = "active";
      taskToStart.activeSince = Date.now();
      if (!taskToStart.startedAt) taskToStart.startedAt = currentTime();
      if (!record.startTime) record.startTime = currentTime();
      focusAfterRenderTaskId = String(taskToStart.id);
      showToast(skipping ? `已暂停这项，开始：${taskToStart.title}` : `开始：${taskToStart.title}`);
    } else if (action === "pause") {
      stopTaskClock(task, "paused");
      closeFocusModal();
      offerBreakTaskId = String(task.id);
      offerBreakMode = "pause";
      offerBreakSourceTaskId = String(task.id);
    } else if (action === "complete") {
      stopTaskClock(task, "done");
      closeFocusModal();
      task.completedAt = currentTime();
      if (key || task.holidayId) task.completedDate = date;
      const completedAll = tasks.every((item) => item.status === "done");
      if (completedAll && record.holidayDaily) {
        record.tasksFinishedAt = task.completedAt;
        showToast("我完成今天安排的作业啦！");
      } else if (completedAll && !key) {
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
      if (nextTask) nextStartPlanTaskId = String(nextTask.id);
    } else if (action === "undo") {
      task.status = "paused";
      delete task.completedAt;
      delete task.completedDate;
      if (key) {
        delete weekend.allDoneDate;
        delete weekend.allDoneTime;
        delete weekend.penaltyConfirmed;
      } else {
        delete record.tasksFinishedAt;
        if (!task.holidayId) { delete record.finishTime; delete record.ruleId; }
      }
      showToast("已撤销完成，可以继续这项作业");
    }
    taskListExpanded = false;
    completedTasksExpanded = false;
    persist();
    render();
    if (focusAfterRenderTaskId) openFocusModal(focusAfterRenderTaskId);
    else if (nextStartPlanTaskId) openStartPlanChoice(nextStartPlanTaskId, date, "next");
    else if (offerBreakTaskId) openBreakChoice(offerBreakTaskId, offerBreakMode, offerBreakSourceTaskId);
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
    elements.taskDraft.value = current ? `${current} ${item.label}` : item.label;
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
    link.download = `作业小计划备份-${todayIso()}.json`;
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
        holidays: source.holidays && typeof source.holidays === "object" ? source.holidays : {},
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


  function selectWeekendTaskDay(id, plannedDay) {
    if (!weekendKeyFor(elements.recordDate.value) || !canEditTaskPlan() || !elements.taskOrderModal.hidden) return;
    const task = taskById(id);
    if (!task) return;
    task.plannedDay = ["friday", "saturday", "sunday"].includes(plannedDay) ? plannedDay : "saturday";
    delete taskOwnerForDate().orderDraft;
    invalidateTaskPlan(); render();
  }

  function saveWeekendTaskPlan() {
    confirmTaskPlan();
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

  holidayUI = mountHolidayUI({ getState: () => state, date: () => elements.recordDate.value, today: todayIso,
    estimates: ESTIMATE_OPTIONS, keywords: taskKeywordItems, persist, render, toast: showToast, goDate: setRecordDate,
    confirmed() { const first = nextTaskForToday(); if (first && !activeTaskForDate() && !startPlanSession && !breakSession) openStartPlanChoice(first.id); },
    open(page) {
      hideSettingsDetailPages();
      stopDictation(false, false); finishAlarmRecording(); stopAlarmPlayback(); closeTaskEntryPage();
      holidayUI?.hide(); closeTaskEditor(); closeWeekendPlanModal();
      [elements.mainPage, elements.settingsPage, elements.historyPage, elements.dictationPage, elements.keywordSettingsPage].forEach(p => { p.hidden = true; });
      page.hidden = false;
      if (page.id === "holidayPlanPage") document.body.classList.add("task-entry-page-open");
      else document.body.classList.remove("task-entry-page-open");
      window.scrollTo?.(0, 0);
    },
    back(settings) { document.body.classList.remove("task-entry-page-open"); if (settings) openSettingsPage(); else { closeSettingsPage(); render(); } }
  });
  elements.settingsButton.addEventListener("click", openSettingsPage);
  elements.openAlarmSettingsButton.addEventListener("click", () => openSettingsDetailPage("alarm"));
  elements.openBackupSettingsButton.addEventListener("click", () => openSettingsDetailPage("backup"));
  elements.closeAlarmSettingsButton.addEventListener("click", closeSettingsDetailPage);
  elements.closeBackupSettingsButton.addEventListener("click", closeSettingsDetailPage);
  elements.closeSettingsButton.addEventListener("click", closeSettingsPage);
  elements.openKeywordSettingsButton.addEventListener("click", openKeywordSettingsPage);
  elements.closeKeywordSettingsButton.addEventListener("click", closeKeywordSettingsPage);
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
  elements.taskEntryLauncher.addEventListener("click", openTaskEntryPage);
  elements.taskEntryCloseButton.addEventListener("click", closeTaskEntryPage);
  window.visualViewport?.addEventListener("resize", resizeTaskEntryPage);
  window.addEventListener("resize", resizeTaskEntryPage);
  elements.taskEditCloseButton.addEventListener("click", closeTaskEditor);
  elements.taskEditCancelButton.addEventListener("click", closeTaskEditor);
  elements.taskEditSaveButton.addEventListener("click", saveTaskEdit);
  elements.taskEditModal.addEventListener("click", (event) => {
    if (event.target === elements.taskEditModal) closeTaskEditor();
  });
  elements.weekendPlanEntry.addEventListener("click", openWeekendPlanModal);
  elements.weekendPlanCloseButton.addEventListener("click", closeWeekendPlanModal);
  elements.weekendPlanModal.addEventListener("click", (event) => {
    if (event.target === elements.weekendPlanModal) closeWeekendPlanModal();
  });
  window.addEventListener("keydown", (event) => {
    if (!elements.focusModal.hidden) {
      if (event.key === "Escape") event.preventDefault();
      if (event.key === "Tab") {
        const buttons = [elements.focusPauseButton, elements.focusCompleteButton, elements.focusSkipButton]
          .filter((button) => !button.disabled);
        const current = buttons.indexOf(document.activeElement);
        const next = current < 0 ? (event.shiftKey ? buttons.length - 1 : 0)
          : (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        event.preventDefault();
        buttons[next].focus();
      }
      return;
    }
    if (event.key !== "Escape") return;
    if (!elements.breakTimerModal.hidden || (!elements.startPlanModal.hidden && startPlanSession)) return;
    if (!elements.startPlanModal.hidden) closeStartPlanModal();
    else if (!elements.breakChoiceModal.hidden) closeBreakChoice();
    else if (!elements.taskEditModal.hidden) closeTaskEditor();
    else if (!elements.taskOrderModal.hidden) returnToTaskEntry();
    else if (!elements.subjectTabs.hidden) { setSubjectPickerOpen(false); elements.subjectPickerButton.focus(); }
    else if (!elements.taskEntryPage.hidden) closeTaskEntryPage();
    else if (!elements.weekendPlanModal.hidden) closeWeekendPlanModal();
    else if (holidayUI?.back()) { /* One level back within holiday settings or planning. */ }
    else if (!elements.dictationPage.hidden) closeDictationPage();
    else if (!elements.historyPage.hidden) closeHistoryPage();
    else if (!elements.alarmSettingsPage.hidden || !elements.backupSettingsPage.hidden) closeSettingsDetailPage();
    else if (!elements.keywordSettingsPage.hidden) closeKeywordSettingsPage();
    else if (!elements.settingsPage.hidden) closeSettingsPage();
  });
  elements.weekendTaskPlanList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-plan-day]");
    if (button) selectWeekendTaskDay(button.dataset.taskId, button.dataset.planDay);
  });
  elements.saveWeekendTaskPlanButton.addEventListener("click", saveWeekendTaskPlan);
  elements.weekendPenaltyButton.addEventListener("click", toggleWeekendPenalty);
  elements.sportCard.addEventListener("click", () => {
    sportOptionsExpanded = !sportOptionsExpanded;
    renderDailyCheckins();
  });
  elements.sportOptions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sport]");
    if (button) toggleSport(button.dataset.sport);
  });
  elements.ledgerButton.addEventListener("click", () => togglePrep("ledgerConfirmed", "ledgerAt", "钉钉和成长记录册核对状态已更新"));
  elements.readingButton.addEventListener("click", () => togglePrep("readingDone", "readingAt", "中文阅读状态已更新"));
  elements.mathThinkingButton.addEventListener("click", () => togglePrep("mathThinkingDone", "mathThinkingAt", "数学思维状态已更新"));
  elements.englishReadingButton.addEventListener("click", () => togglePrep("englishReadingDone", "englishReadingAt", "英文阅读状态已更新"));
  elements.subjectPickerButton.addEventListener("click", () => {
    setSubjectPickerOpen(elements.subjectTabs.hidden);
  });
  elements.subjectTabs.addEventListener("keydown", event => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = [...elements.subjectTabs.querySelectorAll("button")], i = buttons.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (i + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault(); buttons[next].focus();
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
  elements.addTasksButton.addEventListener("pointerdown", (event) => {
    if (event.button === 0 && document.activeElement === elements.taskDraft) event.preventDefault();
  });
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
  elements.taskEntryConfirmButton.addEventListener("click", confirmTaskPlan);
  elements.taskEntryOrderButton.addEventListener("click", openTaskOrderModal);
  elements.taskEntryDays.addEventListener("click", event => {
    const button = event.target.closest("button[data-entry-day]");
    if (button) { taskEntryDay = button.dataset.entryDay; renderTaskEntryPlan(); }
  });
  elements.taskEntryPendingList.addEventListener("change", event => {
    const select = event.target.closest("select[data-entry-plan-day]");
    if (select) selectWeekendTaskDay(select.dataset.entryPlanDay, select.value);
  });
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
  elements.taskOrderCloseButton.addEventListener("click", returnToTaskEntry);
  elements.taskOrderUndoButton.addEventListener("click", () => undoTaskOrderSelection());
  elements.taskOrderResetButton.addEventListener("click", () => undoTaskOrderSelection(true));
  elements.taskOrderConfirmButton.addEventListener("click", confirmTaskOrderSelection);
  elements.taskOrderChoices.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-order-pick]");
    if (button) chooseTaskOrder(button.dataset.orderPick);
  });
  elements.taskOrderDays.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-order-day]");
    if (button) { orderSelectionDay = button.dataset.orderDay; renderOrderSelection(true); }
  });
  elements.taskList.addEventListener("click", (event) => {
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
  elements.focusSkipButton.addEventListener("click", (event) => {
    if (focusModalTaskId && !elements.focusSkipButton.disabled && !(event.detail > 1)) {
      performTaskAction("skip", focusModalTaskId);
    }
  });
  elements.focusPauseButton.addEventListener("click", () => {
    if (focusModalTaskId) performTaskAction("pause", focusModalTaskId);
  });
  elements.focusCompleteButton.addEventListener("click", () => {
    if (focusModalTaskId) performTaskAction("complete", focusModalTaskId);
  });
  elements.startPlanCloseButton.addEventListener("click", closeStartPlanModal);
  elements.startPlanModal.addEventListener("click", (event) => {
    if (event.target === elements.startPlanModal && !startPlanSession) closeStartPlanModal();
  });
  elements.startPlanFiveMinutesButton.addEventListener("click", () => chooseStartPlanDelay(5));
  elements.startPlanTenMinutesButton.addEventListener("click", () => chooseStartPlanDelay(10));
  const onStartPlanTimeEdited = () => {
    elements.startPlanModal.dataset.defaultStartTime = "";
    clearStartPlanQuickChoice();
  };
  elements.startPlanTime.addEventListener("input", onStartPlanTimeEdited);
  elements.startPlanTime.addEventListener("change", onStartPlanTimeEdited);
  elements.saveStartPlanButton.addEventListener("click", () => {
    if (!elements.startPlanTime.value) return showToast("先选好准备开始的时间");
    const [hours, minutes] = elements.startPlanTime.value.split(":").map(Number);
    const now = new Date();
    const quickStartAt = Number(elements.startPlanModal.dataset.quickStartAt);
    if (quickStartAt && elements.startPlanTime.value === elements.startPlanModal.dataset.quickStartTime) {
      if (quickStartAt <= now.getTime()) return showToast("请选择晚于现在的时间");
      scheduleTaskStart(elements.startPlanModal.dataset.taskId, elements.startPlanModal.dataset.date,
        quickStartAt, elements.startPlanModal.dataset.kind);
      return;
    }
    const unchangedDefault = elements.startPlanTime.value === elements.startPlanModal.dataset.defaultStartTime;
    // The unchanged current-time default still means "start now" after a minute rolls over.
    if (unchangedDefault || (hours === now.getHours() && minutes === now.getMinutes())) {
      return startTaskFromPlan();
    }
    const startAt = new Date(now.getTime());
    startAt.setHours(hours, minutes, 0, 0);
    if (startAt.getTime() <= now.getTime()) return showToast("请选择晚于现在的时间");
    scheduleTaskStart(elements.startPlanModal.dataset.taskId, elements.startPlanModal.dataset.date,
      startAt.getTime(), elements.startPlanModal.dataset.kind);
  });
  elements.adjustStartPlanButton.addEventListener("click", adjustStartPlan);
  elements.startPlannedTaskButton.addEventListener("click", startTaskFromPlan);
  elements.skipPausedTaskButton.addEventListener("click", skipPausedTaskFromPlan);
  elements.breakChoiceCloseButton.addEventListener("click", closeBreakChoice);
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
    delete breakSession.nextAlertAt;
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
  elements.taskEntryEstimate.innerHTML = ESTIMATE_OPTIONS
    .map((minutes) => `<option value="${minutes}"${minutes === 15 ? " selected" : ""}>${minutes} 分钟</option>`).join("");
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
  else if (startPlanSession) openStartPlanTimer();
  else restoreActiveFocus();
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
