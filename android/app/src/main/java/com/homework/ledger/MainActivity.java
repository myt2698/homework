package com.homework.ledger;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.speech.tts.TextToSpeech;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.DragEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.Space;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MainActivity extends Activity {

    private static final String PREFS_NAME = "homework_ledger";
    private static final String KEY_RECORDS = "records";
    private static final String KEY_WEEKENDS = "weekends";
    private static final String KEY_DICTATION_CUSTOM = "dictation_custom";
    private static final String KEY_DICTATION_LESSON = "dictation_lesson";
    private static final String KEY_BREAK_SESSION = "break_session";
    private static final String KEY_START_PLAN_SESSION = "start_plan_session";
    private static final String KEY_TASK_KEYWORDS = "task_keywords";
    private static final int EXPORT_BACKUP_REQUEST = 301;
    private static final int IMPORT_BACKUP_REQUEST = 302;
    private static final String[] TIME_KEYS = {"startTime", "dinnerTime", "resumeTime", "finishTime"};
    private static final String[] SPORTS = {"跳绳", "踢毽子", "坐位体前屈", "50米", "仰卧起坐"};
    private static final String[] TASK_SUBJECTS = {"语文", "数学", "英语", "科学"};
    private static final int TASK_KEYWORDS_DEFAULTS_VERSION = 2;
    private static final String[][] DEFAULT_TASK_KEYWORDS = {
            {"背诵", "默写", "生抄本", "作文", "小练习", "预习", "小古文", "订正", "朗读"},
            {"口算", "课作本", "书本", "小练习", "订正"},
            {"校本", "预习课本", "复习"},
            {}
    };
    private static final int[] ESTIMATE_OPTIONS = {5, 10, 15, 20, 30, 35, 40, 45, 50, 60};
    private static final String DICTATION_VOICE_GUIDANCE =
            "使用逐词人工录制的语音；每个词连续播放两遍，两遍间隔1秒，四字词后停3秒，其余词语停2秒。";
    private static final String[][] DICTATION_LESSONS = {
            {"lesson-1", "第1课", "奇观 据说 人山人海 顿时 风平浪静 逐渐 齐头并进 浩浩荡荡 山崩地裂 霎时 余波 随时 河堤 拥堵 高墙"},
            {"lesson-2", "第2课", "繁星 密密麻麻 忘记 谈话 渐渐 模糊 周围 飞舞 柔和 梦幻 怀抱 沉睡 安静 熟人 躺倒"},
            {"lesson-4", "第4课", "暖洋洋 舒适 揭晓 身份 暖和 的确 曾经 打滚 水沟 注视 涨红 滚动 滑落 擦洗 探望 头昏脑涨"},
            {"lesson-5", "第5课", "蚊子 即使 问题 绳子 苍蝇 证明 相互 配合 研究 类似 能够 嘴巴 驾驶"},
            {"lesson-6", "第6课", "帽子 脑袋 舒服 假如 设法 懂事 一溜烟 各式各样 摆放 玻璃 纽扣 折扣 圆筒"},
            {"garden-2", "语文园地二", "提纲 生锈 泡沫 综合 氧气 结账 矿物 俱乐部 揍人 挨揍"},
            {"lesson-8", "第8课", "残留 铺床 墙壁 横线 侧面 山峰 庐山 缘分 投降 评论 文章 服输"},
            {"lesson-9", "第9课", "爬山虎 操场 嫩绿 新鲜 均匀 空隙 叶柄 触角 弯曲 痕迹 瞧不起 牢固 脚步 鲜嫩"},
            {"lesson-10", "第10课", "住宅 选择 住址 大厅 柔弱 平坦 光滑 修理 重要 增长 丝毫 专家 比较 后腿"},
            {"lesson-11", "第11课", "宇宙 黑乎乎 翻身 下降 精疲力竭 飘动 照耀 四肢 奔流不息 茂盛 整个 苏醒 缓慢 踏步 丈量 撑船 万丈"},
            {"lesson-12", "第12课", "填空 帝国 或曰 女娃 衔接"},
            {"lesson-13", "第13课", "喷射 气急败坏 严厉 立即 执行 敬佩 坚定 忍受 遭受 尽管 屈服 肝脏 获得 颗粒 既然"},
            {"garden-4", "语文园地四", "花卉 玫瑰 牡丹 花蕾 茉莉 海棠"},
            {"lesson-15", "第15课", "麻雀 悄悄 猛烈 无可奈何 身躯 掩护 紧张 浑身 牺牲 庞大 强大 力量 勇气 嗅觉"},
            {"lesson-16", "第16课", "石级 发颤 年纪 奋力 猴子 纪念 笑呵呵 鼓舞 陡坡 铁链 好哩 攀登 好啦"},
            {"lesson-17", "第17课", "崇山峻岭 盘旋 扩建 修筑 平整 打仗 自然 当地 耗费 大量 智慧 工程 奇迹 城砖 间隔 扶手"},
            {"lesson-18", "第18课", "柱子 栏杆 人物 神清气爽 建筑 耸立 半山腰 金碧辉煌 镜子 隐隐约约 游人 狮子 姿态 围绕 栽种 幅度"},
            {"garden-5", "语文园地六", "陵寝 景观 丝绸 拉萨 昭告 都江堰 尼龙 走廊"},
            {"lesson-20", "第20课", "虽然 拳头 故意 神气 忙乱 鞋子 助威 胳膊 纷纷 可笑 无缘无故 白鹅 骑车 竟然 胸口 拖地 拖拉 把握 摔倒"},
            {"lesson-21", "第21课", "文艺 表演 角色 排练 主意 通情达理 充分 提示 演技 撤换 等候 哄堂大笑 垂头丧气 我们俩 吹捧 推广"},
            {"lesson-23", "第23课", "戎马 诸多 诸位 竞争 竞赛 唯一"},
            {"garden-6", "语文园地七", "韭菜 芹菜 辣椒 红薯 莲藕 芋头 大蒜 生姜"},
            {"lesson-24", "第24课", "主席 举行 心情 补充 激动 状态 奉献 运动员 训练 建设 勤劳 邀请 抛弃 万亿"},
            {"lesson-25", "第25课", "崛起 严肃 干脆 默默 若有所思 清晰 离开 随便 忘怀 非凡 惩处 训斥 燃烧 响亮"},
            {"lesson-27", "第27课", "词语 葡萄 水杯 秦朝 将领 杰出 鬼怪 雄伟 项目"}
    };
    private static final int RECORD_AUDIO_PERMISSION_REQUEST = 201;
    private static final int DICTATION_RECORD_AUDIO_PERMISSION_REQUEST = 202;
    private static final int BREAK_ALARM_RECORD_AUDIO_PERMISSION_REQUEST = 203;
    private static final long VOICE_RECORDING_LIMIT_MS = 120_000L;
    private static final long DICTATION_RECORDING_MIN_MS = 400L;
    private static final long BREAK_ALARM_RECORDING_MIN_MS = 500L;
    private static final long BREAK_REMINDER_INTERVAL_MS = 5 * 60000L;
    private static final Pattern SUBJECT_PATTERN = Pattern.compile("^(语文|数学|英语|科学|道法|体育|音乐|美术|其他)[\\s：:、，,-]*(.*)$");
    private static final Pattern SUBJECT_ANYWHERE_PATTERN = Pattern.compile("(语文|数学|英语|科学|道法|体育|音乐|美术|其他)(?:作业)?");
    private static final Pattern NUMBERED_TASK_PATTERN = Pattern.compile(
            "(^|[\\s；;])(?:（\\s*(\\d{1,2})\\s*）|\\(?(\\d{1,2})\\s*[.．、)])\\s*",
            Pattern.MULTILINE);

    private static final int PAGE = Color.rgb(244, 248, 255);
    private static final int SURFACE = Color.WHITE;
    private static final int INK = Color.rgb(36, 50, 74);
    private static final int MUTED = Color.rgb(104, 119, 146);
    private static final int LINE = Color.rgb(220, 231, 245);
    private static final int GREEN = Color.rgb(75, 130, 239);
    private static final int GREEN_DARK = Color.rgb(52, 120, 229);
    private static final int GREEN_SOFT = Color.rgb(234, 242, 255);
    private static final int AMBER = Color.rgb(238, 155, 33);
    private static final int AMBER_SOFT = Color.rgb(255, 242, 207);
    private static final int RED = Color.rgb(221, 88, 104);
    private static final int RED_SOFT = Color.rgb(255, 235, 238);

    private static final class Result {
        final String label;
        final double amount;

        Result(String label, double amount) {
            this.label = label;
            this.amount = amount;
        }
    }

    private SharedPreferences preferences;
    private JSONObject records;
    private JSONObject weekends;
    private JSONObject dictationCustomWords;
    private JSONObject taskKeywords;
    private JSONObject breakSession;
    private JSONObject startPlanSession;
    private String currentDate;
    private boolean loadingNote;
    private View mainPageView;
    private View historyPageView;
    private View dictationPageView;
    private View settingsPageView;
    private TextView settingsCurrentDateView;

    private TextView breakAlarmHintView;
    private Button breakAlarmRecordButton;
    private Button breakAlarmPreviewButton;
    private Button breakAlarmResetButton;
    private MediaRecorder breakAlarmRecorder;
    private MediaPlayer breakAlarmPlayer;
    private File pendingBreakAlarmFile;
    private long breakAlarmRecordingStartedAt;
    private boolean startBreakAlarmRecordingAfterPermission;
    private int remainingBreakAlarmPlays;
    private TextToSpeech breakAlarmTts;

    private Button dictationLessonButton;
    private Button dictationPreviousLessonButton;
    private Button dictationNextLessonButton;
    private TextView dictationLessonCountView;
    private TextView dictationLessonTitleView;
    private LinearLayout dictationWordBank;
    private LinearLayout dictationWordsContainer;
    private EditText dictationWordInput;
    private LinearLayout dictationHiddenWords;
    private TextView dictationStatusView;
    private TextView dictationTimingView;
    private ProgressBar dictationProgressBar;
    private TextView dictationProgressTextView;
    private Button startDictationButton;
    private Button stopDictationButton;
    private int selectedDictationLessonIndex;
    private MediaPlayer dictationMediaPlayer;
    private MediaPlayer dictationPreviewPlayer;
    private MediaRecorder dictationRecorder;
    private File pendingDictationRecordingFile;
    private String pendingDictationRecordingWord;
    private String activeDictationRecordingWord;
    private String activeDictationPreviewWord;
    private long dictationRecordingStartedAt;
    private boolean dictationRunning;
    private List<String> activeDictationWords = new ArrayList<>();
    private int activeDictationIndex;
    private int activeDictationRepeat;

    private TextView balanceView;
    private TextView periodView;
    private TextView completedDaysView;
    private TextView rewardDaysView;
    private TextView deductionView;
    private TextView recordHeadingView;
    private LinearLayout historicalDateNotice;
    private TextView historicalDateLabel;

    private LinearLayout weekendCard;
    private Space weekendSpacer;
    private TextView weekendRangeView;
    private LinearLayout weekendConfirmedCard;
    private TextView weekendConfirmedCheck;
    private TextView weekendConfirmedStatus;
    private LinearLayout dailySeparatedCard;
    private TextView dailySeparatedCheck;
    private LinearLayout specialSeparatedCard;
    private TextView specialSeparatedCheck;
    private EditText fridayPlanInput;
    private EditText saturdayMorningInput;
    private EditText saturdayAfternoonInput;
    private Button saturdayTargetButton;
    private TextView plannedTotalView;
    private Button saveWeekendPlanButton;
    private TextView weekendStatusView;
    private TextView weekendActualView;
    private LinearLayout fridayMilestone;
    private TextView fridayMilestoneNumber;
    private TextView fridayMilestoneStatus;
    private LinearLayout saturdayMorningMilestone;
    private TextView saturdayMorningMilestoneNumber;
    private TextView saturdayMorningMilestoneStatus;
    private LinearLayout saturdayMilestone;
    private TextView saturdayMilestoneNumber;
    private TextView saturdayMilestoneStatus;
    private LinearLayout weekendActionContainer;
    private LinearLayout weekendResultPanel;
    private TextView weekendResultLabel;
    private TextView weekendResultAmount;

    private LinearLayout sportCard;
    private TextView sportCheckView;
    private TextView sportStatusView;
    private final List<Button> sportButtons = new ArrayList<>();
    private LinearLayout readingCard;
    private TextView readingCheckView;
    private TextView readingStatusView;
    private TextView readingActionView;
    private LinearLayout mathThinkingCard;
    private TextView mathThinkingCheckView;
    private TextView mathThinkingStatusView;
    private TextView mathThinkingActionView;
    private LinearLayout englishReadingCard;
    private TextView englishReadingCheckView;
    private TextView englishReadingStatusView;
    private TextView englishReadingActionView;
    private LinearLayout dailyCheckinsToggle;
    private LinearLayout dailyCheckinsBody;
    private TextView dailyCheckinsSummaryView;
    private TextView dailyCheckinsArrowView;
    private boolean dailyCheckinsExpanded;
    private LinearLayout ledgerCard;
    private TextView ledgerCheckView;
    private TextView ledgerTitleView;
    private TextView ledgerStatusView;

    private LinearLayout taskEntryPanel;
    private LinearLayout taskEntryLauncher;
    private TextView taskEntryLauncherStatus;
    private LinearLayout taskEntryComposerPanel;
    private HorizontalScrollView taskKeywordSuggestionScroll;
    private LinearLayout taskKeywordSuggestionRow;
    private LinearLayout taskEntryEmptyPanel;
    private LinearLayout taskEntryPendingPanel;
    private TextView taskEntryPendingSummary;
    private LinearLayout taskEntryPendingList;
    private Button taskEntryConfirmButton;
    private Button taskEntryAddButton;
    private Button taskEntryUndoDeleteButton;
    private EditText taskDraftInput;
    private TextView taskDraftErrorView;
    private Button voiceTaskButton;
    private TextView voiceTaskStatusView;
    private OfflineVoiceRecognizer offlineVoiceRecognizer;
    private boolean startVoiceAfterPermission;
    private boolean addTasksAfterVoiceStops;
    private boolean discardVoiceResultAfterStop;
    private String voiceDraftPrefix = "";
    private String latestVoicePartial = "";
    private LinearLayout taskPanel;
    private TextView taskSummaryView;
    private TextView taskPanelTitleView;
    private TextView taskPanelHelpView;
    private LinearLayout taskQuestProgressPanel;
    private LinearLayout taskQuestTimeRow;
    private TextView taskQuestPhaseView;
    private TextView taskQuestMessageView;
    private ProgressBar taskQuestProgressBar;
    private LinearLayout activeTaskPanel;
    private TextView activeTaskTitleView;
    private TextView activeTaskTimeView;
    private LinearLayout taskListContainer;
    private TextView emptyTaskView;
    private TextView taskConfirmHintView;
    private Button taskOrderButton;
    private Button taskConfirmButton;
    private LinearLayout taskSettlementPanel;
    private TextView taskSettlementLabel;
    private TextView taskSettlementAmount;
    private LinearLayout weekendTaskPlanEntry;
    private TextView weekendTaskPlanEntryTitle;
    private TextView weekendTaskPlanEntryStatus;
    private LinearLayout weekendTaskPlanner;
    private TextView weekendTaskPlannerKicker;
    private TextView weekendTaskPlannerTitle;
    private TextView weekendTaskPlannerHelp;
    private TextView weekendTaskPlanSummary;
    private LinearLayout weekendTaskPlanList;
    private TextView weekendTaskPlanHint;
    private Button saveWeekendTaskPlanButton;
    private LinearLayout weekendTaskResultPanel;
    private TextView weekendTaskResultLabel;
    private TextView weekendTaskResultAmount;
    private Button weekendTaskPenaltyButton;
    private Button taskSubjectPickerButton;
    private String selectedTaskSubject = "语文";
    private String selectedTaskKeywordSettingsSubject = "语文";
    private LinearLayout taskKeywordSettingsSubjects;
    private LinearLayout taskKeywordSettingsList;
    private EditText taskKeywordSettingsInput;
    private boolean taskListExpanded;
    private boolean completedTasksExpanded;
    private JSONObject lastDeletedTask;
    private String lastDeletedTaskDate;

    private TextView sessionStatusView;
    private TextView focusView;
    private TextView startDot;
    private TextView dinnerDot;
    private TextView resumeDot;
    private TextView finishDot;
    private TextView startLabelView;
    private TextView dinnerLabelView;
    private TextView resumeLabelView;
    private TextView finishLabelView;
    private TextView startTimeView;
    private TextView dinnerTimeView;
    private TextView resumeTimeView;
    private TextView finishTimeView;
    private LinearLayout actionContainer;
    private LinearLayout resultPanel;
    private TextView resultLabelView;
    private TextView resultAmountView;
    private EditText noteInput;

    private LinearLayout historyList;
    private TextView emptyHistoryView;
    private Button historyManageButton;
    private TextView weeklyReviewRangeView;
    private TextView weeklyPlanDaysView;
    private TextView weeklyEstimatedTimeView;
    private TextView weeklyActualTimeView;
    private TextView weeklyReviewInsightView;
    private boolean historyManageMode;

    private AlertDialog taskFocusDialog;
    private AlertDialog taskEntryDialog;
    private ScrollView taskEntryScrollView;
    private AlertDialog weekendTaskPlanDialog;
    private AlertDialog breakChoiceDialog;
    private AlertDialog breakTimerDialog;
    private AlertDialog startPlanDialog;
    private TextView breakCountdownView;
    private TextView breakNextTaskView;
    private TextView breakPlannedReturnView;
    private Button extendBreakButton;
    private TextView startPlanCountdownView;
    private TextView startPlanTaskView;
    private TextView startPlanScheduledTimeView;
    private int breakChoiceTaskIndex = -1;
    private int breakChoiceSourceTaskIndex = -1;
    private boolean breakChoiceFromPause;
    private TextView taskFocusElapsedView;
    private TextView taskFocusComparisonView;
    private JSONObject taskFocusTask;

    private final Handler timerHandler = new Handler(Looper.getMainLooper());
    private final Runnable clearDeletedTaskUndo = () -> {
        lastDeletedTask = null;
        lastDeletedTaskDate = null;
        if (taskEntryUndoDeleteButton != null) taskEntryUndoDeleteButton.setVisibility(View.GONE);
    };
    private final Runnable dictationNextWord = this::speakCurrentDictationWord;
    private final Runnable breakTimerTick = new Runnable() {
        @Override
        public void run() {
            renderBreakTimerDialog();
            if (breakTimerDialog != null && breakTimerDialog.isShowing()) {
                timerHandler.postDelayed(this, 1000);
            }
        }
    };
    private final Runnable startPlanTimerTick = new Runnable() {
        @Override
        public void run() {
            renderStartPlanTimerDialog();
            if (startPlanDialog != null && startPlanDialog.isShowing() && hasActiveStartPlanSession()) {
                timerHandler.postDelayed(this, 1000);
            }
        }
    };
    private final Runnable offlineVoiceTimeout = () -> {
        if (offlineVoiceRecognizer == null || !offlineVoiceRecognizer.isRecording()) return;
        stopOfflineVoiceInput();
        toast("单次离线录音最长2分钟，正在整理识别结果");
    };
    private final Runnable timerTick = new Runnable() {
        @Override
        public void run() {
            JSONObject record = currentRecord(false);
            if (record != null && hasText(record, "startTime") && !hasText(record, "finishTime")) {
                focusView.setText(focusDuration(record, currentDate.equals(todayIso())) + " 分钟");
                if (activeTask(false) != null) renderTasks();
                String weekendKey = weekendKeyFor(currentDate);
                if (weekendKey != null) weekendActualView.setText(weekendActualMinutes(weekendKey) + " 分钟");
            }
            timerHandler.postDelayed(this, 30000);
        }
    };
    private final Runnable taskFocusTick = new Runnable() {
        @Override
        public void run() {
            if (taskFocusDialog == null || !taskFocusDialog.isShowing() || taskFocusTask == null) return;
            if (!"active".equals(taskFocusTask.optString("status"))) {
                dismissTaskFocusDialog();
                return;
            }
            if (taskFocusElapsedView != null) taskFocusElapsedView.setText(taskClockLabel(taskFocusTask));
            if (taskFocusComparisonView != null) {
                taskFocusComparisonView.setText(taskEstimateComparisonLabel(taskFocusTask));
            }
            timerHandler.postDelayed(this, 1000);
        }
    };
    private final OfflineVoiceRecognizer.Listener offlineVoiceListener =
            new OfflineVoiceRecognizer.Listener() {
                @Override
                public void onModelReady() {
                    setVoiceTaskButtonIdle();
                    setVoiceTaskStatus(null);
                }

                @Override
                public void onModelError(Throwable error) {
                    if (voiceTaskButton != null) {
                        voiceTaskButton.setEnabled(true);
                        setVoiceTaskButtonIcon("重试加载离线语音", false);
                    }
                    setVoiceTaskStatus("离线语音模型加载失败，点击按钮重试");
                }

                @Override
                public void onPartialResult(String text) {
                    if (discardVoiceResultAfterStop) return;
                    latestVoicePartial = text;
                    setTaskDraftFromVoice(text);
                    if (!text.isEmpty()) setVoiceTaskStatus("正在离线识别：" + trailingText(text, 22));
                }

                @Override
                public void onFinalResult(String text) {
                    timerHandler.removeCallbacks(offlineVoiceTimeout);
                    if (discardVoiceResultAfterStop) {
                        discardVoiceResultAfterStop = false;
                        addTasksAfterVoiceStops = false;
                        voiceDraftPrefix = "";
                        latestVoicePartial = "";
                        if (taskDraftInput != null) taskDraftInput.setText("");
                        setVoiceTaskButtonIdle();
                        setVoiceTaskStatus("录音已停止，内容已清空，可以重新录入");
                        return;
                    }
                    latestVoicePartial = text;
                    setTaskDraftFromVoice(text);
                    setVoiceTaskButtonIdle();
                    boolean shouldAddTasks = addTasksAfterVoiceStops;
                    addTasksAfterVoiceStops = false;
                    if (text.isEmpty()) {
                        setVoiceTaskStatus("没有听清，请靠近麦克风后重试");
                        if (!shouldAddTasks) toast("没有识别到语音，请重试或直接输入文字");
                    } else {
                        setVoiceTaskStatus("文字已经放进输入框，我检查一下再加入清单");
                        if (!shouldAddTasks) toast("离线语音已转成文字，请核对");
                    }
                    if (shouldAddTasks) addTasksFromDraft();
                }

                @Override
                public void onRecordingError(Throwable error) {
                    timerHandler.removeCallbacks(offlineVoiceTimeout);
                    if (discardVoiceResultAfterStop) {
                        discardVoiceResultAfterStop = false;
                        addTasksAfterVoiceStops = false;
                        voiceDraftPrefix = "";
                        latestVoicePartial = "";
                        if (taskDraftInput != null) taskDraftInput.setText("");
                        setVoiceTaskButtonIdle();
                        setVoiceTaskStatus("录音已停止，内容已清空，可以重新录入");
                        return;
                    }
                    setTaskDraftFromVoice(latestVoicePartial);
                    setVoiceTaskButtonIdle();
                    boolean shouldAddTasks = addTasksAfterVoiceStops;
                    addTasksAfterVoiceStops = false;
                    setVoiceTaskStatus("录音或离线识别失败，请重试");
                    if (shouldAddTasks) {
                        addTasksFromDraft();
                    } else {
                        toast("无法完成离线语音识别，请检查麦克风权限后重试");
                    }
                }
            };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(GREEN_DARK);
        window.setNavigationBarColor(PAGE);

        preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        records = readRecords();
        weekends = readJson(KEY_WEEKENDS);
        dictationCustomWords = readJson(KEY_DICTATION_CUSTOM);
        taskKeywords = readTaskKeywords();
        breakSession = readJson(KEY_BREAK_SESSION);
        startPlanSession = readJson(KEY_START_PLAN_SESSION);
        String savedDictationLesson = preferences.getString(KEY_DICTATION_LESSON, DICTATION_LESSONS[0][0]);
        for (int index = 0; index < DICTATION_LESSONS.length; index++) {
            if (DICTATION_LESSONS[index][0].equals(savedDictationLesson)) {
                selectedDictationLessonIndex = index;
                break;
            }
        }
        currentDate = todayIso();

        breakAlarmTts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS && breakAlarmTts != null) {
                breakAlarmTts.setLanguage(Locale.CHINA);
                breakAlarmTts.setSpeechRate(0.92f);
                breakAlarmTts.setPitch(1.08f);
            }
        });

        setContentView(buildScreen());
        offlineVoiceRecognizer = new OfflineVoiceRecognizer(this);
        initializeOfflineVoiceRecognizer();
        renderAll();
        timerHandler.postDelayed(timerTick, 30000);
        if (hasActiveBreakSession()) showBreakTimerDialog();
        else if (hasActiveStartPlanSession()) showStartPlanTimerDialog();
    }

    @Override
    protected void onDestroy() {
        timerHandler.removeCallbacks(timerTick);
        timerHandler.removeCallbacks(taskFocusTick);
        timerHandler.removeCallbacks(offlineVoiceTimeout);
        timerHandler.removeCallbacks(breakTimerTick);
        timerHandler.removeCallbacks(startPlanTimerTick);
        if (taskFocusDialog != null) taskFocusDialog.dismiss();
        if (taskEntryDialog != null) taskEntryDialog.dismiss();
        if (weekendTaskPlanDialog != null) weekendTaskPlanDialog.dismiss();
        if (breakChoiceDialog != null) breakChoiceDialog.dismiss();
        if (breakTimerDialog != null) breakTimerDialog.dismiss();
        if (startPlanDialog != null) startPlanDialog.dismiss();
        stopDictation(false, false);
        stopDictationWordRecording(true, false);
        releaseDictationPreviewPlayer();
        stopBreakAlarmRecording(false, false);
        releaseBreakAlarmPlayer();
        if (breakAlarmTts != null) breakAlarmTts.shutdown();
        if (offlineVoiceRecognizer != null) offlineVoiceRecognizer.release();
        super.onDestroy();
    }

    @Override
    protected void onStop() {
        stopOfflineVoiceInput();
        stopDictationWordRecording(true, false);
        releaseDictationPreviewPlayer();
        stopBreakAlarmRecording(true, false);
        releaseBreakAlarmPlayer();
        super.onStop();
    }

    @Override
    public void onBackPressed() {
        if (breakTimerDialog != null && breakTimerDialog.isShowing()) return;
        if (hasActiveStartPlanSession() && startPlanDialog != null && startPlanDialog.isShowing()) return;
        if (settingsPageView != null && settingsPageView.getVisibility() == View.VISIBLE) {
            showMainPage();
            return;
        }
        if (dictationPageView != null && dictationPageView.getVisibility() == View.VISIBLE) {
            showMainPage();
            return;
        }
        if (historyPageView != null && historyPageView.getVisibility() == View.VISIBLE) {
            showMainPage();
            return;
        }
        super.onBackPressed();
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == DICTATION_RECORD_AUDIO_PERMISSION_REQUEST) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            String word = pendingDictationRecordingWord;
            pendingDictationRecordingWord = null;
            if (granted && word != null) {
                beginDictationWordRecording(word);
            } else if (!granted) {
                toast("需要麦克风权限才能录制词语人声");
            }
            return;
        }
        if (requestCode == BREAK_ALARM_RECORD_AUDIO_PERMISSION_REQUEST) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            boolean shouldStart = startBreakAlarmRecordingAfterPermission;
            startBreakAlarmRecordingAfterPermission = false;
            if (granted && shouldStart) beginBreakAlarmRecording();
            else if (!granted) toast("需要麦克风权限才能录制休息提示音");
            return;
        }
        if (requestCode != RECORD_AUDIO_PERMISSION_REQUEST) return;
        boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        boolean shouldStart = startVoiceAfterPermission;
        startVoiceAfterPermission = false;
        if (granted && shouldStart) {
            beginOfflineVoiceInput();
        } else if (!granted) {
            toast("需要麦克风权限才能离线识别作业；也可以继续手动输入文字");
        }
    }

    private void initializeOfflineVoiceRecognizer() {
        if (offlineVoiceRecognizer == null || offlineVoiceRecognizer.isReady()) return;
        if (voiceTaskButton != null) {
            voiceTaskButton.setEnabled(false);
            setVoiceTaskButtonIcon("正在准备离线语音", false);
        }
        setVoiceTaskStatus("正在本机加载中文识别模型，首次需要几秒钟");
        offlineVoiceRecognizer.initialize(offlineVoiceListener);
    }

    private void startVoiceTaskInput() {
        if (offlineVoiceRecognizer == null) return;
        if (offlineVoiceRecognizer.isRecording()) {
            stopOfflineVoiceInput();
            return;
        }
        if (offlineVoiceRecognizer.isBusy()) {
            toast("正在整理刚才的识别结果，请稍候");
            return;
        }
        if (!offlineVoiceRecognizer.isReady()) {
            initializeOfflineVoiceRecognizer();
            toast(offlineVoiceRecognizer.isInitializing()
                    ? "正在加载离线中文模型，请稍候再试"
                    : "离线中文模型暂时不可用，请点击重试");
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            startVoiceAfterPermission = true;
            requestPermissions(
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    RECORD_AUDIO_PERMISSION_REQUEST
            );
            return;
        }
        beginOfflineVoiceInput();
    }

    private void beginOfflineVoiceInput() {
        if (offlineVoiceRecognizer == null || !offlineVoiceRecognizer.isReady()) return;
        discardVoiceResultAfterStop = false;
        voiceDraftPrefix = taskDraftInput == null ? "" : taskDraftInput.getText().toString().trim();
        latestVoicePartial = "";
        if (!offlineVoiceRecognizer.start(offlineVoiceListener)) return;
        if (voiceTaskButton != null) {
            voiceTaskButton.setEnabled(true);
            setVoiceTaskButtonIcon("结束语音录入", true);
        }
        setVoiceTaskStatus("正在本机识别，可以连续报多项作业");
        timerHandler.removeCallbacks(offlineVoiceTimeout);
        timerHandler.postDelayed(offlineVoiceTimeout, VOICE_RECORDING_LIMIT_MS);
    }

    private void stopOfflineVoiceInput() {
        if (offlineVoiceRecognizer == null || !offlineVoiceRecognizer.isRecording()) return;
        timerHandler.removeCallbacks(offlineVoiceTimeout);
        offlineVoiceRecognizer.stop();
        if (voiceTaskButton != null) {
            voiceTaskButton.setEnabled(false);
            setVoiceTaskButtonIcon("正在整理语音识别结果", true);
        }
        setVoiceTaskStatus("录音已停止，正在完成离线识别");
    }

    private void setTaskDraftFromVoice(String spoken) {
        if (taskDraftInput == null) return;
        String clean = spoken == null ? "" : spoken.trim();
        String combined = voiceDraftPrefix.isEmpty() || clean.isEmpty()
                ? voiceDraftPrefix + clean
                : voiceDraftPrefix + "；" + clean;
        taskDraftInput.setText(combined);
        taskDraftInput.setSelection(taskDraftInput.length());
    }

    private void setVoiceTaskButtonIdle() {
        if (voiceTaskButton == null) return;
        voiceTaskButton.setEnabled(offlineVoiceRecognizer != null
                && offlineVoiceRecognizer.isReady());
        setVoiceTaskButtonIcon("开始报作业", false);
    }

    private void setVoiceTaskButtonIcon(String description, boolean listening) {
        if (voiceTaskButton == null) return;
        voiceTaskButton.setText("🎙");
        voiceTaskButton.setContentDescription(description);
        voiceTaskButton.setTextColor(listening ? RED : GREEN);
        voiceTaskButton.setBackground(rounded(listening ? RED_SOFT : GREEN_SOFT, 10,
                listening ? RED : Color.rgb(156, 188, 245), 1));
    }

    private void setVoiceTaskStatus(String message) {
        if (voiceTaskStatusView == null) return;
        boolean visible = message != null && !message.isEmpty();
        voiceTaskStatusView.setText(visible ? message : "");
        voiceTaskStatusView.setVisibility(visible ? View.VISIBLE : View.GONE);
    }

    private String trailingText(String value, int maximumCharacters) {
        if (value.length() <= maximumCharacters) return value;
        return "…" + value.substring(value.length() - maximumCharacters);
    }

    private View buildScreen() {
        FrameLayout root = new FrameLayout(this);
        ScrollView scrollView = new ScrollView(this);
        scrollView.setFillViewport(true);
        scrollView.setBackgroundColor(PAGE);

        LinearLayout content = vertical();
        content.setPadding(dp(12), dp(14), dp(12), dp(24));
        scrollView.addView(content, matchWrap());
        content.addView(buildHeader());
        content.addView(space(10));
        LinearLayout.LayoutParams noticeParams = matchWrap();
        noticeParams.bottomMargin = dp(10);
        content.addView(buildHistoricalDateNotice(), noticeParams);
        weekendCard = buildWeekendCard();
        weekendSpacer = space(0);
        content.addView(buildProcessCard());
        mainPageView = scrollView;
        historyPageView = buildHistoryPage();
        historyPageView.setVisibility(View.GONE);
        dictationPageView = buildDictationPage();
        dictationPageView.setVisibility(View.GONE);
        settingsPageView = buildSettingsPage();
        settingsPageView.setVisibility(View.GONE);
        FrameLayout.LayoutParams pageParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        root.addView(mainPageView, pageParams);
        root.addView(historyPageView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(dictationPageView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(settingsPageView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        return root;
    }

    private View buildHeader() {
        LinearLayout row = horizontal();
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout titles = vertical();
        TextView eyebrow = text("每天进步一点点", 10, GREEN, true);
        eyebrow.setLetterSpacing(0.12f);
        titles.addView(eyebrow);
        titles.addView(text("🌟 作业小账本", 24, GREEN_DARK, true));
        row.addView(titles, weightedWrap(1));
        Button history = smallButton("足迹");
        history.setOnClickListener(v -> showHistoryPage());
        row.addView(history);
        row.addView(spaceHorizontal(6));
        Button dictation = smallButton("🔊 听写");
        dictation.setOnClickListener(v -> showDictationPage());
        row.addView(dictation);
        row.addView(spaceHorizontal(6));
        Button settings = smallButton("设置");
        settings.setOnClickListener(v -> showSettingsPage());
        row.addView(settings);
        return row;
    }

    private View buildHistoricalDateNotice() {
        LinearLayout row = horizontal();
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(12), dp(9), dp(12), dp(9));
        row.setBackground(rounded(AMBER_SOFT, 13, Color.rgb(241, 207, 129), 1));
        row.addView(text("正在查看", 10, Color.rgb(118, 87, 33), false));
        row.addView(spaceHorizontal(7));
        historicalDateLabel = text("", 11, Color.rgb(118, 87, 33), true);
        row.addView(historicalDateLabel, weightedWrap(1));
        row.addView(text("回到今天", 10, GREEN, true));
        row.setOnClickListener(v -> selectDate(todayIso()));
        row.setVisibility(View.GONE);
        historicalDateNotice = row;
        return row;
    }

    private View buildSummaryCard() {
        LinearLayout card = vertical();
        card.setPadding(dp(24), dp(26), dp(24), dp(22));
        card.setBackground(rounded(GREEN_DARK, 28, GREEN_DARK, 0));
        card.addView(text("我的成长能量 ⭐", 14, Color.argb(215, 255, 255, 255), true));
        balanceView = text("¥ 0.00", 44, Color.WHITE, true);
        card.addView(balanceView);
        periodView = text("全部成长记录", 12, Color.argb(170, 255, 255, 255), false);
        card.addView(periodView);
        card.addView(space(24));

        LinearLayout stats = horizontal();
        completedDaysView = addStat(stats, "0", "认真完成");
        rewardDaysView = addStat(stats, "0", "收获奖励");
        deductionView = addStat(stats, "¥0.00", "扣减合计");
        card.addView(stats, matchWrap());

        return card;
    }

    private TextView addStat(LinearLayout parent, String value, String label) {
        LinearLayout column = vertical();
        column.setGravity(Gravity.CENTER);
        TextView valueView = text(value, 19, Color.WHITE, true);
        TextView labelView = text(label, 11, Color.argb(175, 255, 255, 255), false);
        labelView.setPadding(0, dp(4), 0, 0);
        column.addView(valueView);
        column.addView(labelView);
        parent.addView(column, weightedWrap(1));
        return valueView;
    }

    private LinearLayout buildWeekendCard() {
        LinearLayout card = card();
        card.setVisibility(View.GONE);
        TextView kicker = text("周末任务包", 10, GREEN, true);
        kicker.setLetterSpacing(0.12f);
        card.addView(kicker);
        card.addView(text("先安排，再按计划完成", 21, INK, true));
        weekendRangeView = text("", 11, MUTED, false);
        weekendRangeView.setPadding(0, dp(4), 0, dp(13));
        card.addView(weekendRangeView);

        weekendConfirmedCard = weekendCheckCard("周末作业已全部确认", "已核对钉钉并补全成长记录册", 0);
        card.addView(weekendConfirmedCard, matchFixed(dp(70)));
        card.addView(space(8));
        dailySeparatedCard = weekendCheckCard("已区分每日任务", "阅读、跳绳等不计入一次性作业", 1);
        card.addView(dailySeparatedCard, matchFixed(dp(70)));
        card.addView(space(8));
        specialSeparatedCard = weekendCheckCard("已区分特殊任务", "必须周日完成的任务单独安排", 2);
        card.addView(specialSeparatedCard, matchFixed(dp(70)));
        card.addView(space(14));

        LinearLayout plan = vertical();
        plan.setPadding(dp(15), dp(16), dp(15), dp(15));
        plan.setBackground(rounded(Color.WHITE, 16, LINE, 1));
        LinearLayout planHead = horizontal();
        LinearLayout planCopy = vertical();
        planCopy.addView(text("时间安排", 16, INK, true));
        planCopy.addView(text("结合作业清单，估算三个时段的分钟数。", 10, MUTED, false));
        planHead.addView(planCopy, weightedWrap(1));
        plannedTotalView = text("共 0 分钟", 13, GREEN, true);
        planHead.addView(plannedTotalView);
        plan.addView(planHead, matchWrap());
        plan.addView(space(12));

        fridayPlanInput = planNumberInput("周五完成", plan);
        saturdayMorningInput = planNumberInput("周六上午", plan);
        saturdayAfternoonInput = planNumberInput("周六下午", plan);
        LinearLayout targetRow = horizontal();
        targetRow.setGravity(Gravity.CENTER_VERTICAL);
        targetRow.addView(text("周六目标时间", 13, INK, true), weightedWrap(1));
        saturdayTargetButton = smallButton("18:00");
        saturdayTargetButton.setOnClickListener(v -> showWeekendTargetPicker());
        targetRow.addView(saturdayTargetButton);
        plan.addView(targetRow, matchFixed(dp(48)));

        TextWatcher totalWatcher = new TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) { }
            public void onTextChanged(CharSequence s, int start, int before, int count) { }
            public void afterTextChanged(Editable editable) { updateWeekendPlannedTotal(); }
        };
        fridayPlanInput.addTextChangedListener(totalWatcher);
        saturdayMorningInput.addTextChangedListener(totalWatcher);
        saturdayAfternoonInput.addTextChangedListener(totalWatcher);

        saveWeekendPlanButton = new Button(this);
        saveWeekendPlanButton.setText("保存周末计划");
        saveWeekendPlanButton.setTextSize(13);
        saveWeekendPlanButton.setTextColor(Color.WHITE);
        saveWeekendPlanButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        saveWeekendPlanButton.setAllCaps(false);
        saveWeekendPlanButton.setBackground(rounded(GREEN, 11, GREEN, 0));
        saveWeekendPlanButton.setOnClickListener(v -> saveWeekendPlan());
        LinearLayout.LayoutParams savePlanParams = matchFixed(dp(46));
        savePlanParams.topMargin = dp(11);
        plan.addView(saveWeekendPlanButton, savePlanParams);
        card.addView(plan, matchWrap());
        card.addView(space(14));

        LinearLayout progress = vertical();
        progress.setPadding(dp(15), dp(16), dp(15), dp(15));
        progress.setBackground(rounded(Color.WHITE, 16, LINE, 1));
        LinearLayout progressHead = horizontal();
        LinearLayout progressCopy = vertical();
        progressCopy.addView(text("执行进度", 10, GREEN, true));
        weekendStatusView = text("等待制定计划", 17, INK, true);
        progressCopy.addView(weekendStatusView);
        progressHead.addView(progressCopy, weightedWrap(1));
        LinearLayout actualCopy = vertical();
        TextView actualLabel = text("累计有效作业", 10, MUTED, false);
        actualLabel.setGravity(Gravity.END);
        actualCopy.addView(actualLabel);
        weekendActualView = text("0 分钟", 13, GREEN, true);
        weekendActualView.setGravity(Gravity.END);
        actualCopy.addView(weekendActualView);
        progressHead.addView(actualCopy);
        progress.addView(progressHead, matchWrap());
        progress.addView(space(12));

        fridayMilestone = milestoneCard("1", "完成周五安排", true);
        progress.addView(fridayMilestone, matchFixed(dp(68)));
        progress.addView(space(8));
        saturdayMorningMilestone = morningMilestoneCard();
        progress.addView(saturdayMorningMilestone, matchFixed(dp(68)));
        progress.addView(space(8));
        saturdayMilestone = milestoneCard("3", "周六完成学校作业", false);
        progress.addView(saturdayMilestone, matchFixed(dp(68)));

        weekendActionContainer = vertical();
        weekendActionContainer.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams actionParams = matchWrap();
        actionParams.topMargin = dp(12);
        progress.addView(weekendActionContainer, actionParams);

        weekendResultPanel = horizontal();
        weekendResultPanel.setGravity(Gravity.CENTER_VERTICAL);
        weekendResultPanel.setPadding(dp(13), dp(11), dp(13), dp(11));
        LinearLayout resultCopy = vertical();
        resultCopy.addView(text("周末结算", 10, MUTED, false));
        weekendResultLabel = text("", 12, INK, true);
        resultCopy.addView(weekendResultLabel);
        weekendResultPanel.addView(resultCopy, weightedWrap(1));
        weekendResultAmount = text("", 17, GREEN, true);
        weekendResultPanel.addView(weekendResultAmount);
        LinearLayout.LayoutParams weekendResultParams = matchWrap();
        weekendResultParams.topMargin = dp(12);
        progress.addView(weekendResultPanel, weekendResultParams);
        card.addView(progress, matchWrap());
        return card;
    }

    private LinearLayout weekendCheckCard(String title, String subtitle, int kind) {
        LinearLayout item = horizontal();
        item.setGravity(Gravity.CENTER_VERTICAL);
        item.setPadding(dp(13), dp(9), dp(13), dp(9));
        TextView check = text("✓", 17, Color.TRANSPARENT, true);
        check.setGravity(Gravity.CENTER);
        check.setBackground(rounded(PAGE, 18, LINE, 1));
        item.addView(check, fixed(dp(32), dp(32)));
        item.addView(spaceHorizontal(11));
        LinearLayout copy = vertical();
        copy.addView(text(title, 13, INK, true));
        TextView status = text(subtitle, 10, MUTED, false);
        status.setPadding(0, dp(3), 0, 0);
        copy.addView(status);
        item.addView(copy, weightedWrap(1));
        if (kind == 0) {
            weekendConfirmedCheck = check;
            weekendConfirmedStatus = status;
            item.setOnClickListener(v -> toggleWeekendField("confirmed", "confirmedAt", "周末作业确认状态已更新"));
        } else if (kind == 1) {
            dailySeparatedCheck = check;
            item.setOnClickListener(v -> toggleWeekendField("dailySeparated", null, "每日任务分类已更新"));
        } else {
            specialSeparatedCheck = check;
            item.setOnClickListener(v -> toggleWeekendField("specialSeparated", null, "特殊任务分类已更新"));
        }
        return item;
    }

    private EditText planNumberInput(String label, LinearLayout parent) {
        LinearLayout row = horizontal();
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(text(label, 13, INK, true), weightedWrap(1));
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_NUMBER);
        input.setTextSize(13);
        input.setTextColor(INK);
        input.setHint("分钟");
        input.setGravity(Gravity.CENTER);
        input.setPadding(dp(8), dp(6), dp(8), dp(6));
        input.setBackground(rounded(SURFACE, 9, LINE, 1));
        row.addView(input, fixed(dp(90), dp(38)));
        parent.addView(row, matchFixed(dp(48)));
        return input;
    }

    private LinearLayout milestoneCard(String number, String title, boolean friday) {
        LinearLayout item = horizontal();
        item.setGravity(Gravity.CENTER_VERTICAL);
        item.setPadding(dp(12), dp(9), dp(12), dp(9));
        TextView badge = text(number, 13, MUTED, true);
        badge.setGravity(Gravity.CENTER);
        badge.setBackground(rounded(Color.WHITE, 18, LINE, 1));
        item.addView(badge, fixed(dp(32), dp(32)));
        item.addView(spaceHorizontal(10));
        LinearLayout copy = vertical();
        copy.addView(text(title, 13, INK, true));
        TextView status = text(friday ? "完成周五部分，可得 ¥0.50" : "目标时间前完成，可得 ¥1.00", 10, MUTED, false);
        status.setPadding(0, dp(3), 0, 0);
        copy.addView(status);
        item.addView(copy, weightedWrap(1));
        if (friday) {
            fridayMilestoneNumber = badge;
            fridayMilestoneStatus = status;
        } else {
            saturdayMilestoneNumber = badge;
            saturdayMilestoneStatus = status;
        }
        return item;
    }

    private LinearLayout morningMilestoneCard() {
        LinearLayout item = horizontal();
        item.setGravity(Gravity.CENTER_VERTICAL);
        item.setPadding(dp(12), dp(9), dp(12), dp(9));
        saturdayMorningMilestoneNumber = text("2", 13, MUTED, true);
        saturdayMorningMilestoneNumber.setGravity(Gravity.CENTER);
        saturdayMorningMilestoneNumber.setBackground(rounded(Color.WHITE, 18, LINE, 1));
        item.addView(saturdayMorningMilestoneNumber, fixed(dp(32), dp(32)));
        item.addView(spaceHorizontal(10));
        LinearLayout copy = vertical();
        copy.addView(text("完成周六上午安排", 13, INK, true));
        saturdayMorningMilestoneStatus = text("按自己制定的计划执行", 10, MUTED, false);
        saturdayMorningMilestoneStatus.setPadding(0, dp(3), 0, 0);
        copy.addView(saturdayMorningMilestoneStatus);
        item.addView(copy, weightedWrap(1));
        return item;
    }

    private View buildProcessCard() {
        LinearLayout card = card();
        card.setPadding(dp(12), dp(14), dp(12), dp(14));
        recordHeadingView = text("今天进行到哪里了？", 21, INK, true);

        ledgerCard = prepCard("核对钉钉，补全成长记录册", "把钉钉里新增的作业补充进去");
        card.addView(ledgerCard, matchFixed(dp(72)));
        card.addView(space(10));

        taskPanel = buildTasksPanel();
        card.addView(taskPanel, matchWrap());

        buildWeekendTaskPlanner();
        LinearLayout.LayoutParams weekendEntryParams = matchWrap();
        weekendEntryParams.topMargin = dp(16);
        card.addView(buildWeekendTaskPlanEntry(), weekendEntryParams);

        sportCard = buildSportCard();
        readingCard = dailyHabitCard("中文阅读", "完成中文阅读后打卡", "readingDone", "readingAt");
        mathThinkingCard = dailyHabitCard(
                "数学思维", "完成数学思维练习后打卡", "mathThinkingDone", "mathThinkingAt");
        englishReadingCard = dailyHabitCard(
                "英文阅读", "完成英文阅读后打卡", "englishReadingDone", "englishReadingAt");

        dailyCheckinsToggle = horizontal();
        dailyCheckinsToggle.setGravity(Gravity.CENTER_VERTICAL);
        dailyCheckinsToggle.setPadding(dp(13), dp(11), dp(13), dp(11));
        dailyCheckinsToggle.setBackground(rounded(Color.rgb(248, 251, 255), 17, LINE, 1));
        dailyCheckinsToggle.setClickable(true);
        dailyCheckinsToggle.setFocusable(true);
        TextView dailyIcon = text("🌱", 19, INK, false);
        dailyIcon.setGravity(Gravity.CENTER);
        dailyIcon.setBackground(rounded(Color.rgb(233, 248, 239), 11,
                Color.rgb(233, 248, 239), 0));
        dailyCheckinsToggle.addView(dailyIcon, fixed(dp(36), dp(36)));
        dailyCheckinsToggle.addView(spaceHorizontal(10));
        LinearLayout dailyCopy = vertical();
        dailyCopy.addView(text("今日习惯", 14, INK, true));
        dailyCheckinsSummaryView = text("0 / 4 已完成 · 我做完作业再来打卡", 10, MUTED, false);
        dailyCheckinsSummaryView.setPadding(0, dp(3), 0, 0);
        dailyCopy.addView(dailyCheckinsSummaryView);
        dailyCheckinsToggle.addView(dailyCopy, weightedWrap(1));
        dailyCheckinsArrowView = text("⌄", 20, Color.rgb(101, 136, 201), false);
        dailyCheckinsArrowView.setGravity(Gravity.CENTER);
        dailyCheckinsToggle.addView(dailyCheckinsArrowView, fixed(dp(28), dp(36)));
        dailyCheckinsToggle.setOnClickListener(v -> {
            dailyCheckinsExpanded = !dailyCheckinsExpanded;
            dailyCheckinsBody.setVisibility(dailyCheckinsExpanded ? View.VISIBLE : View.GONE);
            dailyCheckinsArrowView.setText(dailyCheckinsExpanded ? "⌃" : "⌄");
        });
        LinearLayout.LayoutParams dailyToggleParams = matchFixed(dp(62));
        dailyToggleParams.topMargin = dp(16);
        card.addView(dailyCheckinsToggle, dailyToggleParams);

        dailyCheckinsBody = vertical();
        TextView dailyHelp = text("运动、中文阅读、数学思维和英文阅读分别完成、分别打卡。", 10, MUTED, false);
        dailyHelp.setPadding(0, dp(11), 0, 0);
        dailyCheckinsBody.addView(dailyHelp);
        LinearLayout.LayoutParams sportParams = matchWrap();
        sportParams.topMargin = dp(9);
        dailyCheckinsBody.addView(sportCard, sportParams);
        LinearLayout.LayoutParams readingParams = matchWrap();
        readingParams.topMargin = dp(9);
        dailyCheckinsBody.addView(readingCard, readingParams);
        LinearLayout.LayoutParams mathParams = matchWrap();
        mathParams.topMargin = dp(9);
        dailyCheckinsBody.addView(mathThinkingCard, mathParams);
        LinearLayout.LayoutParams englishParams = matchWrap();
        englishParams.topMargin = dp(9);
        dailyCheckinsBody.addView(englishReadingCard, englishParams);
        dailyCheckinsBody.setVisibility(View.GONE);
        card.addView(dailyCheckinsBody, matchWrap());

        LinearLayout session = vertical();
        session.setPadding(dp(16), dp(19), dp(16), dp(17));
        session.setBackground(rounded(Color.WHITE, 18, LINE, 1));
        LinearLayout sessionHead = horizontal();
        sessionHead.setGravity(Gravity.TOP);
        LinearLayout sessionTitle = vertical();
        TextView sessionKicker = text("作业时间", 10, GREEN, true);
        sessionKicker.setLetterSpacing(0.1f);
        sessionTitle.addView(sessionKicker);
        sessionStatusView = text("尚未开始", 19, INK, true);
        sessionStatusView.setPadding(0, dp(4), 0, 0);
        sessionTitle.addView(sessionStatusView);
        sessionHead.addView(sessionTitle, weightedWrap(1));
        LinearLayout focusColumn = vertical();
        focusColumn.setGravity(Gravity.END);
        TextView focusLabel = text("有效作业", 10, MUTED, false);
        focusLabel.setGravity(Gravity.END);
        focusColumn.addView(focusLabel);
        focusView = text("0 分钟", 14, GREEN, true);
        focusView.setGravity(Gravity.END);
        focusColumn.addView(focusView);
        sessionHead.addView(focusColumn);
        session.addView(sessionHead, matchWrap());
        session.addView(space(18));

        TextView[] startParts = timelineRow("开始饭前作业");
        startDot = startParts[0]; startTimeView = startParts[1];
        startLabelView = startParts[2];
        session.addView((View) startDot.getParent(), matchFixed(dp(48)));
        TextView[] dinnerParts = timelineRow("吃饭暂停");
        dinnerDot = dinnerParts[0]; dinnerTimeView = dinnerParts[1];
        dinnerLabelView = dinnerParts[2];
        session.addView((View) dinnerDot.getParent(), matchFixed(dp(48)));
        TextView[] resumeParts = timelineRow("饭后继续");
        resumeDot = resumeParts[0]; resumeTimeView = resumeParts[1];
        resumeLabelView = resumeParts[2];
        session.addView((View) resumeDot.getParent(), matchFixed(dp(48)));
        TextView[] finishParts = timelineRow("全部完成");
        finishDot = finishParts[0]; finishTimeView = finishParts[1];
        finishLabelView = finishParts[2];
        session.addView((View) finishDot.getParent(), matchFixed(dp(48)));

        actionContainer = horizontal();
        actionContainer.setGravity(Gravity.CENTER_VERTICAL);
        session.addView(actionContainer, matchWrap());

        resultPanel = horizontal();
        resultPanel.setGravity(Gravity.CENTER_VERTICAL);
        resultPanel.setPadding(dp(14), dp(12), dp(14), dp(12));
        LinearLayout resultText = vertical();
        resultText.addView(text("完成结算", 10, MUTED, false));
        resultLabelView = text("8:30 及以前", 13, INK, true);
        resultText.addView(resultLabelView);
        resultPanel.addView(resultText, weightedWrap(1));
        resultAmountView = text("+ ¥1.50", 18, GREEN, true);
        resultPanel.addView(resultAmountView);
        LinearLayout.LayoutParams resultParams = matchWrap();
        resultParams.topMargin = dp(14);
        session.addView(resultPanel, resultParams);
        // The detailed task list now owns timing and completion; keep the legacy views off-screen for old data compatibility.

        noteInput = new EditText(this);
        noteInput.setTextSize(14);
        noteInput.setTextColor(INK);
        noteInput.setHintTextColor(Color.rgb(160, 159, 150));
        noteInput.setHint("例如：今天没有提醒，自己完成");
        noteInput.setSingleLine(true);
        noteInput.setFilters(new InputFilter[]{new InputFilter.LengthFilter(60)});
        noteInput.setPadding(dp(13), dp(10), dp(13), dp(10));
        noteInput.setBackground(rounded(Color.WHITE, 11, LINE, 1));
        noteInput.addTextChangedListener(new TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) { }
            public void onTextChanged(CharSequence s, int start, int before, int count) { }
            public void afterTextChanged(Editable editable) {
                if (loadingNote) return;
                String note = editable.toString().trim();
                JSONObject record = currentRecord(!note.isEmpty());
                if (record != null) {
                    put(record, "note", note);
                    cleanupCurrentRecord();
                    saveRecords();
                    renderHistoryAndSummary();
                }
            }
        });
        return card;
    }

    private LinearLayout buildTasksPanel() {
        LinearLayout panel = vertical();
        panel.setPadding(0, dp(11), 0, 0);
        panel.setBackgroundColor(Color.TRANSPARENT);

        LinearLayout head = horizontal();
        head.setGravity(Gravity.TOP);
        LinearLayout copy = vertical();
        TextView kicker = text("作业清单", 10, GREEN, true);
        kicker.setLetterSpacing(0.1f);
        copy.addView(kicker);
        taskPanelTitleView = text("我选一项，轻松开始！", 17, INK, true);
        copy.addView(taskPanelTitleView);
        taskPanelHelpView = text("我一次专心做一项，每完成一项都在前进！", 10, MUTED, false);
        taskPanelHelpView.setPadding(0, dp(4), 0, 0);
        copy.addView(taskPanelHelpView);
        head.addView(copy, weightedWrap(1));
        taskSummaryView = text("0 项", 12, GREEN, true);
        taskSummaryView.setPadding(dp(8), dp(5), dp(8), dp(5));
        taskSummaryView.setBackground(rounded(GREEN_SOFT, 18, GREEN_SOFT, 0));
        head.addView(taskSummaryView);
        panel.addView(head, matchWrap());

        taskEntryPanel = vertical();
        taskEntryPanel.setPadding(dp(12), dp(12), dp(12), dp(12));
        taskEntryPanel.setBackground(rounded(PAGE, 14, PAGE, 0));

        taskEntryComposerPanel = vertical();
        taskSubjectPickerButton = new Button(this);
        taskSubjectPickerButton.setTextSize(12);
        taskSubjectPickerButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        taskSubjectPickerButton.setAllCaps(false);
        taskSubjectPickerButton.setMinHeight(0);
        taskSubjectPickerButton.setMinimumHeight(0);
        taskSubjectPickerButton.setPadding(dp(6), 0, dp(6), 0);
        taskSubjectPickerButton.setGravity(Gravity.CENTER);
        taskSubjectPickerButton.setOnClickListener(v -> showTaskSubjectPicker());
        selectTaskSubject(selectedTaskSubject);
        voiceTaskButton = new Button(this);
        voiceTaskButton.setText("🎙");
        voiceTaskButton.setContentDescription("正在准备离线语音");
        voiceTaskButton.setTextSize(18);
        voiceTaskButton.setTextColor(GREEN);
        voiceTaskButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        voiceTaskButton.setAllCaps(false);
        voiceTaskButton.setEnabled(false);
        voiceTaskButton.setBackground(rounded(GREEN_SOFT, 13, Color.rgb(156, 188, 245), 1));
        voiceTaskButton.setOnClickListener(v -> startVoiceTaskInput());
        voiceTaskStatusView = text("", 10, MUTED, false);
        voiceTaskStatusView.setPadding(0, dp(5), 0, 0);
        voiceTaskStatusView.setVisibility(View.GONE);

        taskDraftInput = new EditText(this);
        taskDraftInput.setTextSize(14);
        taskDraftInput.setTextColor(INK);
        taskDraftInput.setHintTextColor(Color.rgb(160, 159, 150));
        taskDraftInput.setHint("请输入一项作业…");
        taskDraftInput.setGravity(Gravity.TOP | Gravity.START);
        taskDraftInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        taskDraftInput.setHorizontallyScrolling(false);
        taskDraftInput.setMinLines(1);
        taskDraftInput.setMaxLines(2);
        taskDraftInput.setMinHeight(dp(43));
        taskDraftInput.setMaxHeight(dp(78));
        taskDraftInput.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_DONE);
        taskDraftInput.setFilters(new InputFilter[]{new InputFilter.LengthFilter(500)});
        taskDraftInput.setPadding(dp(11), dp(9), dp(11), dp(9));
        taskDraftInput.setBackground(rounded(Color.WHITE, 11, LINE, 1));
        taskDraftErrorView = text("先说出或输入作业内容", 10, RED, true);
        taskDraftErrorView.setPadding(dp(2), dp(5), 0, 0);
        taskDraftErrorView.setVisibility(View.GONE);
        taskDraftInput.addTextChangedListener(new TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) { }
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (s != null && s.toString().trim().length() > 0) setTaskDraftError(null);
            }
            public void afterTextChanged(Editable editable) { }
        });
        taskDraftInput.setOnEditorActionListener((view, actionId, event) -> {
            boolean enterPressed = event != null
                    && event.getKeyCode() == android.view.KeyEvent.KEYCODE_ENTER
                    && event.getAction() == android.view.KeyEvent.ACTION_DOWN
                    && !event.isShiftPressed();
            if (actionId != android.view.inputmethod.EditorInfo.IME_ACTION_DONE && !enterPressed) return false;
            generateTasksFromDraft();
            return true;
        });

        taskEntryAddButton = new Button(this);
        taskEntryAddButton.setText("＋");
        taskEntryAddButton.setContentDescription("加入语文作业");
        taskEntryAddButton.setTextSize(20);
        taskEntryAddButton.setTextColor(Color.WHITE);
        taskEntryAddButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        taskEntryAddButton.setAllCaps(false);
        taskEntryAddButton.setMinHeight(0);
        taskEntryAddButton.setMinimumHeight(0);
        taskEntryAddButton.setPadding(0, 0, 0, 0);
        taskEntryAddButton.setBackground(rounded(GREEN, 10, GREEN, 0));
        taskEntryAddButton.setOnClickListener(v -> generateTasksFromDraft());

        LinearLayout taskEntryInputRow = horizontal();
        taskEntryInputRow.setGravity(Gravity.BOTTOM);
        taskEntryInputRow.addView(taskSubjectPickerButton, fixed(dp(72), dp(43)));
        taskEntryInputRow.addView(spaceHorizontal(6));
        taskEntryInputRow.addView(taskDraftInput, weightedWrap(1));
        taskEntryInputRow.addView(spaceHorizontal(6));
        taskEntryInputRow.addView(taskEntryAddButton, fixed(dp(42), dp(43)));
        taskEntryInputRow.addView(spaceHorizontal(6));
        voiceTaskButton.setPadding(0, 0, 0, 0);
        voiceTaskButton.setBackground(rounded(GREEN_SOFT, 10, Color.rgb(156, 188, 245), 1));
        taskEntryInputRow.addView(voiceTaskButton, fixed(dp(42), dp(43)));

        taskKeywordSuggestionScroll = new HorizontalScrollView(this);
        taskKeywordSuggestionScroll.setHorizontalScrollBarEnabled(false);
        taskKeywordSuggestionScroll.setFillViewport(false);
        taskKeywordSuggestionRow = horizontal();
        taskKeywordSuggestionScroll.addView(taskKeywordSuggestionRow, matchWrap());
        LinearLayout.LayoutParams keywordSuggestionParams = matchFixed(dp(36));
        keywordSuggestionParams.bottomMargin = dp(7);
        taskEntryComposerPanel.addView(taskKeywordSuggestionScroll, keywordSuggestionParams);
        taskEntryComposerPanel.addView(taskEntryInputRow, matchWrap());
        taskEntryComposerPanel.addView(taskDraftErrorView);
        taskEntryComposerPanel.addView(voiceTaskStatusView);
        renderTaskKeywordSuggestions();

        taskEntryUndoDeleteButton = textButton("↶ 撤销刚才删除");
        taskEntryUndoDeleteButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        taskEntryUndoDeleteButton.setOnClickListener(v -> undoLastDeletedTask());
        taskEntryUndoDeleteButton.setVisibility(View.GONE);
        LinearLayout.LayoutParams undoParams = matchFixed(dp(36));
        undoParams.topMargin = dp(7);

        taskEntryPendingPanel = vertical();
        taskEntryPendingPanel.setPadding(dp(12), dp(12), dp(12), dp(12));
        taskEntryPendingPanel.setBackground(rounded(Color.WHITE, 13, Color.rgb(201, 218, 247), 1));
        LinearLayout pendingHead = horizontal();
        pendingHead.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout pendingCopy = vertical();
        pendingCopy.addView(text("我录好的作业", 14, INK, true));
        pendingHead.addView(pendingCopy, weightedWrap(1));
        taskEntryPendingSummary = text("0 项", 10, GREEN, true);
        taskEntryPendingSummary.setPadding(dp(8), dp(4), dp(8), dp(4));
        taskEntryPendingSummary.setBackground(rounded(GREEN_SOFT, 16, GREEN_SOFT, 0));
        pendingHead.addView(taskEntryPendingSummary);
        taskEntryPendingPanel.addView(pendingHead, matchWrap());
        taskEntryPendingList = vertical();
        LinearLayout.LayoutParams pendingListParams = matchWrap();
        pendingListParams.topMargin = dp(5);
        taskEntryPendingPanel.addView(taskEntryPendingList, pendingListParams);
        LinearLayout taskEntryScrollableContent = vertical();
        LinearLayout.LayoutParams pendingParams = matchWrap();
        taskEntryScrollableContent.addView(taskEntryPendingPanel, pendingParams);
        taskEntryScrollableContent.addView(taskEntryUndoDeleteButton, undoParams);
        taskEntryScrollView = new ScrollView(this);
        taskEntryScrollView.setFillViewport(false);
        taskEntryScrollView.setClipToPadding(false);
        taskEntryScrollView.addView(taskEntryScrollableContent, matchWrap());
        taskEntryPanel.addView(taskEntryScrollView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        taskEntryEmptyPanel = vertical();
        taskEntryEmptyPanel.setGravity(Gravity.CENTER);
        ImageView taskEntryEmptyImage = new ImageView(this);
        taskEntryEmptyImage.setImageResource(R.drawable.homework_entry_empty);
        taskEntryEmptyImage.setContentDescription("小朋友坐在书桌前写作业");
        taskEntryEmptyImage.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        taskEntryEmptyPanel.addView(taskEntryEmptyImage, fixed(dp(148), dp(148)));
        TextView taskEntryEmptyText = text("开始录入作业吧", 13, Color.rgb(76, 109, 166), true);
        taskEntryEmptyText.setGravity(Gravity.CENTER);
        taskEntryEmptyPanel.addView(taskEntryEmptyText, matchWrap());
        taskEntryEmptyPanel.setVisibility(View.GONE);
        taskEntryPanel.addView(taskEntryEmptyPanel, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        LinearLayout.LayoutParams composerParams = matchWrap();
        composerParams.topMargin = dp(12);
        taskEntryPanel.addView(taskEntryComposerPanel, composerParams);

        LinearLayout.LayoutParams entryParams = matchWrap();
        entryParams.topMargin = dp(13);
        panel.addView(buildTaskEntryLauncher(), entryParams);

        taskQuestProgressPanel = vertical();
        taskQuestProgressPanel.setPadding(dp(2), 0, dp(2), dp(3));
        taskQuestProgressPanel.setBackgroundColor(Color.TRANSPARENT);
        taskQuestProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        taskQuestProgressBar.setMax(100);
        taskQuestProgressBar.setProgressTintList(ColorStateList.valueOf(GREEN));
        taskQuestProgressBar.setProgressBackgroundTintList(ColorStateList.valueOf(Color.rgb(220, 232, 251)));
        taskQuestProgressPanel.addView(taskQuestProgressBar, matchFixed(dp(8)));
        taskQuestTimeRow = horizontal();
        taskQuestTimeRow.setGravity(Gravity.CENTER_VERTICAL);
        taskQuestPhaseView = text("今日计划", 10, MUTED, false);
        taskQuestTimeRow.addView(taskQuestPhaseView, weightedWrap(1));
        taskQuestMessageView = text("预计还需 0 分钟", 10, Color.rgb(65, 106, 168), true);
        taskQuestTimeRow.addView(taskQuestMessageView);
        LinearLayout.LayoutParams timeParams = matchWrap();
        timeParams.topMargin = dp(7);
        taskQuestProgressPanel.addView(taskQuestTimeRow, timeParams);
        LinearLayout.LayoutParams questParams = matchWrap();
        questParams.topMargin = dp(9);
        panel.addView(taskQuestProgressPanel, questParams);

        activeTaskPanel = vertical();
        activeTaskPanel.setPadding(dp(14), dp(12), dp(14), dp(12));
        activeTaskPanel.setBackground(rounded(GREEN, 14, GREEN, 0));
        activeTaskPanel.addView(text("✨ 正在专心完成", 10, Color.argb(210, 255, 255, 255), true));
        activeTaskTitleView = text("", 16, Color.WHITE, true);
        activeTaskTitleView.setPadding(0, dp(3), 0, 0);
        activeTaskPanel.addView(activeTaskTitleView);
        activeTaskTimeView = text("", 11, Color.argb(210, 255, 255, 255), false);
        activeTaskTimeView.setPadding(0, dp(4), 0, 0);
        activeTaskPanel.addView(activeTaskTimeView);
        LinearLayout.LayoutParams activeParams = matchWrap();
        activeParams.topMargin = dp(12);
        panel.addView(activeTaskPanel, activeParams);

        taskListContainer = vertical();
        LinearLayout.LayoutParams listParams = matchWrap();
        listParams.topMargin = dp(12);
        panel.addView(taskListContainer, listParams);

        emptyTaskView = text("还没有作业，点击麦克风连续报完，或直接输入文字。", 11, MUTED, false);
        emptyTaskView.setGravity(Gravity.CENTER);
        emptyTaskView.setPadding(dp(10), dp(16), dp(10), dp(16));
        emptyTaskView.setBackground(rounded(Color.rgb(251, 248, 242), 12, Color.rgb(207, 198, 183), 1));
        LinearLayout.LayoutParams emptyParams = matchWrap();
        emptyParams.topMargin = dp(12);
        panel.addView(emptyTaskView, emptyParams);

        taskConfirmHintView = text("录入后先核对，避免漏掉作业。", 10, MUTED, false);
        taskConfirmHintView.setPadding(0, dp(13), 0, dp(8));
        panel.addView(taskConfirmHintView);
        taskOrderButton = new Button(this);
        taskOrderButton.setText("确定顺序，开始闯关");
        taskOrderButton.setTextSize(12);
        taskOrderButton.setTextColor(Color.WHITE);
        taskOrderButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        taskOrderButton.setAllCaps(false);
        taskOrderButton.setBackground(rounded(GREEN, 13, GREEN, 0));
        taskOrderButton.setOnClickListener(v -> toggleTaskOrder());
        panel.addView(taskOrderButton, matchFixed(dp(43)));
        taskConfirmButton = new Button(this);
        taskConfirmButton.setText("确认作业清单");
        taskConfirmButton.setTextSize(12);
        taskConfirmButton.setTextColor(GREEN);
        taskConfirmButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        taskConfirmButton.setAllCaps(false);
        taskConfirmButton.setBackground(rounded(GREEN_SOFT, 13, Color.rgb(156, 188, 245), 1));
        taskConfirmButton.setOnClickListener(v -> toggleTaskListConfirmation());
        LinearLayout.LayoutParams confirmParams = matchFixed(dp(43));
        confirmParams.topMargin = dp(6);
        panel.addView(taskConfirmButton, confirmParams);

        taskSettlementPanel = horizontal();
        taskSettlementPanel.setGravity(Gravity.CENTER_VERTICAL);
        taskSettlementPanel.setPadding(dp(14), dp(12), dp(14), dp(12));
        LinearLayout settlementCopy = vertical();
        settlementCopy.addView(text("完成结算", 10, MUTED, false));
        taskSettlementLabel = text("", 13, INK, true);
        settlementCopy.addView(taskSettlementLabel);
        taskSettlementPanel.addView(settlementCopy, weightedWrap(1));
        taskSettlementAmount = text("", 18, GREEN, true);
        taskSettlementPanel.addView(taskSettlementAmount);
        LinearLayout.LayoutParams settlementParams = matchWrap();
        settlementParams.topMargin = dp(12);
        panel.addView(taskSettlementPanel, settlementParams);
        return panel;
    }

    private LinearLayout buildTaskEntryLauncher() {
        LinearLayout entry = horizontal();
        entry.setGravity(Gravity.CENTER_VERTICAL);
        entry.setPadding(dp(13), dp(11), dp(13), dp(11));
        entry.setBackground(rounded(GREEN_SOFT, 16, Color.rgb(188, 209, 248), 1));
        entry.setClickable(true);
        entry.setFocusable(true);
        entry.setOnClickListener(v -> showTaskEntryDialog());

        TextView icon = text("✍", 20, GREEN, true);
        icon.setGravity(Gravity.CENTER);
        icon.setBackground(rounded(Color.WHITE, 12, Color.WHITE, 0));
        entry.addView(icon, fixed(dp(38), dp(38)));
        entry.addView(spaceHorizontal(11));

        LinearLayout copy = vertical();
        copy.addView(text("录入作业", 14, INK, true));
        taskEntryLauncherStatus = text("选择科目，语音或文字录入", 10, MUTED, false);
        taskEntryLauncherStatus.setPadding(0, dp(3), 0, 0);
        copy.addView(taskEntryLauncherStatus);
        entry.addView(copy, weightedWrap(1));

        TextView arrow = text("›", 27, Color.rgb(101, 136, 201), false);
        arrow.setGravity(Gravity.CENTER);
        entry.addView(arrow, fixed(dp(24), dp(38)));
        taskEntryLauncher = entry;
        return entry;
    }

    private void showTaskEntryDialog() {
        if (taskEntryLauncher == null || taskEntryLauncher.getVisibility() != View.VISIBLE
                || taskEntryPanel == null) return;
        if (taskEntryDialog != null && taskEntryDialog.isShowing()) return;
        if (taskEntryPanel.getParent() instanceof ViewGroup) {
            ((ViewGroup) taskEntryPanel.getParent()).removeView(taskEntryPanel);
        }
        taskEntryPanel.setVisibility(View.VISIBLE);
        setTaskDraftError(null);

        LinearLayout content = vertical();
        content.setPadding(dp(18), dp(8), dp(18), dp(8));
        int availableHeight = getResources().getDisplayMetrics().heightPixels;
        int entryHeight = Math.min(dp(620), Math.round(availableHeight * 0.72f));
        content.addView(taskEntryPanel, matchFixed(entryHeight));
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(content)
                .setPositiveButton("都录好了，去排顺序", null)
                .setNegativeButton("关闭", null)
                .create();
        taskEntryDialog = dialog;
        dialog.setOnDismissListener(ignored -> {
            addTasksAfterVoiceStops = false;
            stopOfflineVoiceInput();
            if (taskEntryPanel.getParent() instanceof ViewGroup) {
                ((ViewGroup) taskEntryPanel.getParent()).removeView(taskEntryPanel);
            }
            if (taskEntryDialog == dialog) taskEntryDialog = null;
            taskEntryConfirmButton = null;
        });
        dialog.show();
        dialog.setCanceledOnTouchOutside(false);
        taskEntryConfirmButton = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
        taskEntryConfirmButton.setOnClickListener(v -> toggleTaskListConfirmation());
        taskEntryConfirmButton.setTextColor(GREEN);
        taskEntryConfirmButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        renderTasks();
    }

    private void dismissTaskEntryDialog() {
        if (taskEntryDialog != null && taskEntryDialog.isShowing()) taskEntryDialog.dismiss();
        taskEntryDialog = null;
    }

    private LinearLayout buildWeekendTaskPlanEntry() {
        LinearLayout entry = horizontal();
        entry.setGravity(Gravity.CENTER_VERTICAL);
        entry.setPadding(dp(13), dp(11), dp(13), dp(11));
        entry.setBackground(rounded(GREEN_SOFT, 16, Color.rgb(188, 209, 248), 1));
        entry.setClickable(true);
        entry.setFocusable(true);
        entry.setOnClickListener(v -> showWeekendTaskPlanDialog());

        TextView icon = text("🗓", 20, GREEN, true);
        icon.setGravity(Gravity.CENTER);
        icon.setBackground(rounded(Color.WHITE, 12, Color.WHITE, 0));
        entry.addView(icon, fixed(dp(38), dp(38)));
        entry.addView(spaceHorizontal(11));

        LinearLayout copy = vertical();
        weekendTaskPlanEntryTitle = text("周五安排与闯关", 14, INK, true);
        copy.addView(weekendTaskPlanEntryTitle);
        weekendTaskPlanEntryStatus = text("给作业选择周五、周六或周日", 10, MUTED, false);
        weekendTaskPlanEntryStatus.setPadding(0, dp(3), 0, 0);
        copy.addView(weekendTaskPlanEntryStatus);
        entry.addView(copy, weightedWrap(1));

        TextView arrow = text("›", 27, Color.rgb(101, 136, 201), false);
        arrow.setGravity(Gravity.CENTER);
        entry.addView(arrow, fixed(dp(24), dp(38)));
        weekendTaskPlanEntry = entry;
        return entry;
    }

    private void showWeekendTaskPlanDialog() {
        if (weekendKeyFor(currentDate) == null || weekendTaskPlanner == null) return;
        if (weekendTaskPlanDialog != null && weekendTaskPlanDialog.isShowing()) return;
        if (weekendTaskPlanner.getParent() instanceof ViewGroup) {
            ((ViewGroup) weekendTaskPlanner.getParent()).removeView(weekendTaskPlanner);
        }
        weekendTaskPlanner.setVisibility(View.VISIBLE);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        LinearLayout wrapper = vertical();
        wrapper.setPadding(dp(4), dp(4), dp(4), dp(4));
        wrapper.addView(weekendTaskPlanner, matchWrap());
        scroll.addView(wrapper, matchWrap());

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(scroll)
                .setNegativeButton("关闭", null)
                .create();
        weekendTaskPlanDialog = dialog;
        dialog.setOnDismissListener(ignored -> {
            if (weekendTaskPlanner.getParent() instanceof ViewGroup) {
                ((ViewGroup) weekendTaskPlanner.getParent()).removeView(weekendTaskPlanner);
            }
            if (weekendTaskPlanDialog == dialog) weekendTaskPlanDialog = null;
        });
        dialog.show();
    }

    private LinearLayout buildWeekendTaskPlanner() {
        LinearLayout panel = vertical();
        panel.setPadding(dp(15), dp(17), dp(15), dp(15));
        panel.setBackground(rounded(Color.rgb(255, 250, 240), 18, Color.rgb(216, 204, 177), 1));
        panel.setVisibility(View.GONE);

        LinearLayout head = horizontal();
        head.setGravity(Gravity.TOP);
        LinearLayout copy = vertical();
        weekendTaskPlannerKicker = text("周五安排", 10, GREEN, true);
        weekendTaskPlannerKicker.setLetterSpacing(0.1f);
        copy.addView(weekendTaskPlannerKicker);
        weekendTaskPlannerTitle = text("给每项作业安排完成日期", 17, INK, true);
        copy.addView(weekendTaskPlannerTitle);
        weekendTaskPlannerHelp = text("默认安排在周六；挑一部分放到今天完成，其余再分到周末。", 10, MUTED, false);
        weekendTaskPlannerHelp.setPadding(0, dp(4), 0, 0);
        copy.addView(weekendTaskPlannerHelp);
        head.addView(copy, weightedWrap(1));
        weekendTaskPlanSummary = text("尚未保存", 11, GREEN, true);
        weekendTaskPlanSummary.setPadding(dp(8), dp(5), dp(8), dp(5));
        weekendTaskPlanSummary.setBackground(rounded(GREEN_SOFT, 18, GREEN_SOFT, 0));
        head.addView(weekendTaskPlanSummary);
        panel.addView(head, matchWrap());

        weekendTaskPlanList = vertical();
        LinearLayout.LayoutParams listParams = matchWrap();
        listParams.topMargin = dp(12);
        panel.addView(weekendTaskPlanList, listParams);

        weekendTaskPlanHint = text("确认作业清单后再安排。", 10, MUTED, false);
        weekendTaskPlanHint.setPadding(0, dp(12), 0, dp(8));
        panel.addView(weekendTaskPlanHint);
        saveWeekendTaskPlanButton = new Button(this);
        saveWeekendTaskPlanButton.setText("保存周末安排");
        saveWeekendTaskPlanButton.setTextSize(12);
        saveWeekendTaskPlanButton.setTextColor(Color.WHITE);
        saveWeekendTaskPlanButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        saveWeekendTaskPlanButton.setAllCaps(false);
        saveWeekendTaskPlanButton.setBackground(rounded(GREEN, 11, GREEN, 0));
        saveWeekendTaskPlanButton.setOnClickListener(v -> saveWeekendTaskPlan());
        panel.addView(saveWeekendTaskPlanButton, matchFixed(dp(44)));

        weekendTaskResultPanel = horizontal();
        weekendTaskResultPanel.setGravity(Gravity.CENTER_VERTICAL);
        weekendTaskResultPanel.setPadding(dp(13), dp(11), dp(13), dp(11));
        LinearLayout resultCopy = vertical();
        resultCopy.addView(text("周末结算", 10, MUTED, false));
        weekendTaskResultLabel = text("", 12, INK, true);
        resultCopy.addView(weekendTaskResultLabel);
        weekendTaskResultPanel.addView(resultCopy, weightedWrap(1));
        weekendTaskResultAmount = text("", 17, GREEN, true);
        weekendTaskResultPanel.addView(weekendTaskResultAmount);
        LinearLayout.LayoutParams resultParams = matchWrap();
        resultParams.topMargin = dp(12);
        panel.addView(weekendTaskResultPanel, resultParams);

        weekendTaskPenaltyButton = textButton("周日结束仍未完成");
        weekendTaskPenaltyButton.setTextColor(RED);
        weekendTaskPenaltyButton.setOnClickListener(v -> toggleWeekendTaskPenalty());
        LinearLayout.LayoutParams penaltyParams = matchFixed(dp(42));
        penaltyParams.topMargin = dp(8);
        panel.addView(weekendTaskPenaltyButton, penaltyParams);
        weekendTaskPlanner = panel;
        return panel;
    }

    private JSONObject defaultTaskKeywords() {
        JSONObject defaults = new JSONObject();
        for (int subjectIndex = 0; subjectIndex < TASK_SUBJECTS.length; subjectIndex++) {
            JSONArray entries = new JSONArray();
            for (int keywordIndex = 0; keywordIndex < DEFAULT_TASK_KEYWORDS[subjectIndex].length; keywordIndex++) {
                JSONObject entry = new JSONObject();
                put(entry, "id", "builtin-" + subjectIndex + "-" + keywordIndex);
                put(entry, "label", DEFAULT_TASK_KEYWORDS[subjectIndex][keywordIndex]);
                put(entry, "visible", true);
                entries.put(entry);
            }
            put(defaults, TASK_SUBJECTS[subjectIndex], entries);
        }
        put(defaults, "_defaultsVersion", TASK_KEYWORDS_DEFAULTS_VERSION);
        return defaults;
    }

    private JSONObject normalizeTaskKeywords(JSONObject source) {
        JSONObject normalized = new JSONObject();
        JSONObject defaults = defaultTaskKeywords();
        for (int subjectIndex = 0; subjectIndex < TASK_SUBJECTS.length; subjectIndex++) {
            String subject = TASK_SUBJECTS[subjectIndex];
            JSONArray raw = source == null ? null : source.optJSONArray(subject);
            if (raw == null) raw = defaults.optJSONArray(subject);
            JSONArray entries = new JSONArray();
            List<String> labels = new ArrayList<>();
            for (int index = 0; raw != null && index < raw.length(); index++) {
                Object value = raw.opt(index);
                JSONObject candidate = value instanceof JSONObject ? (JSONObject) value : null;
                String label = candidate == null ? String.valueOf(value).trim()
                        : candidate.optString("label", "").trim();
                if (label.isEmpty() || "null".equals(label) || labels.contains(label)) continue;
                labels.add(label);
                JSONObject entry = new JSONObject();
                put(entry, "id", candidate != null && !candidate.optString("id", "").isEmpty()
                        ? candidate.optString("id") : "keyword-" + subjectIndex + "-" + index + "-" + label);
                put(entry, "label", label);
                put(entry, "visible", candidate == null || candidate.optBoolean("visible", true));
                entries.put(entry);
            }
            put(normalized, subject, entries);
        }
        if (source != null && source.optInt("_defaultsVersion", 0) < 1) {
            JSONArray mathKeywords = normalized.optJSONArray("数学");
            boolean hasCorrection = false;
            for (int index = 0; mathKeywords != null && index < mathKeywords.length(); index++) {
                JSONObject item = mathKeywords.optJSONObject(index);
                if (item != null && "订正".equals(item.optString("label"))) {
                    hasCorrection = true;
                    break;
                }
            }
            if (!hasCorrection && mathKeywords != null) {
                JSONObject correction = new JSONObject();
                put(correction, "id", "builtin-1-4");
                put(correction, "label", "订正");
                put(correction, "visible", true);
                mathKeywords.put(correction);
            }
        }
        if (source != null && source.optInt("_defaultsVersion", 0) < 2) {
            JSONArray englishKeywords = normalized.optJSONArray("英语");
            boolean hasReview = false;
            for (int index = 0; englishKeywords != null && index < englishKeywords.length(); index++) {
                JSONObject item = englishKeywords.optJSONObject(index);
                if (item != null && "复习".equals(item.optString("label"))) {
                    hasReview = true;
                    break;
                }
            }
            if (!hasReview && englishKeywords != null) {
                JSONObject review = new JSONObject();
                put(review, "id", "builtin-2-2");
                put(review, "label", "复习");
                put(review, "visible", true);
                englishKeywords.put(review);
            }
        }
        put(normalized, "_defaultsVersion", TASK_KEYWORDS_DEFAULTS_VERSION);
        return normalized;
    }

    private JSONObject readTaskKeywords() {
        String saved = preferences.getString(KEY_TASK_KEYWORDS, null);
        if (saved == null) return defaultTaskKeywords();
        try {
            return normalizeTaskKeywords(new JSONObject(saved));
        } catch (JSONException exception) {
            return defaultTaskKeywords();
        }
    }

    private JSONArray taskKeywordArray(String subject) {
        if (taskKeywords == null) taskKeywords = defaultTaskKeywords();
        JSONArray keywords = taskKeywords.optJSONArray(subject);
        if (keywords == null) {
            keywords = new JSONArray();
            put(taskKeywords, subject, keywords);
        }
        return keywords;
    }

    private void saveTaskKeywords() {
        preferences.edit().putString(KEY_TASK_KEYWORDS, taskKeywords.toString()).apply();
        renderTaskKeywordSuggestions();
        renderTaskKeywordSettings();
    }

    private void renderTaskKeywordSuggestions() {
        if (taskKeywordSuggestionRow == null || taskKeywordSuggestionScroll == null) return;
        taskKeywordSuggestionRow.removeAllViews();
        JSONArray keywords = taskKeywordArray(selectedTaskSubject);
        for (int index = 0; index < keywords.length(); index++) {
            JSONObject entry = keywords.optJSONObject(index);
            if (entry == null || !entry.optBoolean("visible", true)) continue;
            String label = entry.optString("label", "").trim();
            if (label.isEmpty()) continue;
            Button chip = new Button(this);
            chip.setText(label);
            chip.setTextSize(11);
            chip.setTextColor(taskSubjectColor(selectedTaskSubject));
            chip.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
            chip.setAllCaps(false);
            chip.setMinHeight(0);
            chip.setMinimumHeight(0);
            chip.setMinWidth(0);
            chip.setMinimumWidth(0);
            chip.setPadding(dp(10), 0, dp(10), 0);
            chip.setBackground(rounded(taskSubjectSoftColor(selectedTaskSubject), 16,
                    taskSubjectColor(selectedTaskSubject), 1));
            chip.setOnClickListener(v -> applyTaskKeyword(label));
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, dp(32));
            params.rightMargin = dp(6);
            taskKeywordSuggestionRow.addView(chip, params);
        }
        taskKeywordSuggestionScroll.setVisibility(
                taskKeywordSuggestionRow.getChildCount() == 0 ? View.GONE : View.VISIBLE);
    }

    private void applyTaskKeyword(String keyword) {
        if (taskDraftInput == null) return;
        String current = taskDraftInput.getText().toString().trim();
        String next = current.isEmpty() ? keyword : current + " " + keyword;
        taskDraftInput.setText(next);
        taskDraftInput.requestFocus();
        taskDraftInput.setSelection(taskDraftInput.length());
        setTaskDraftError(null);
    }

    private void selectTaskSubject(String subject) {
        selectedTaskSubject = subject;
        if (taskSubjectPickerButton != null) {
            int subjectColor = taskSubjectColor(subject);
            taskSubjectPickerButton.setText(subject + "  ▾");
            taskSubjectPickerButton.setTextColor(Color.WHITE);
            taskSubjectPickerButton.setBackground(rounded(subjectColor, 10, subjectColor, 1));
        }
        if (taskDraftInput != null) taskDraftInput.setHint("请输入一项作业…");
        if (taskEntryAddButton != null) taskEntryAddButton.setContentDescription("加入" + subject + "作业");
        renderTaskKeywordSuggestions();
    }

    private void showTaskSubjectPicker() {
        LinearLayout options = vertical();
        options.setPadding(dp(12), dp(4), dp(12), dp(8));
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("选择科目")
                .setView(options)
                .setNegativeButton("取消", null)
                .create();
        LinearLayout[] rows = {horizontal(), horizontal()};
        for (int index = 0; index < TASK_SUBJECTS.length; index++) {
            String subject = TASK_SUBJECTS[index];
            Button option = new Button(this);
            option.setText(subject);
            option.setTextSize(13);
            option.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
            option.setAllCaps(false);
            option.setTextColor(subject.equals(selectedTaskSubject) ? Color.WHITE : taskSubjectColor(subject));
            option.setBackground(rounded(subject.equals(selectedTaskSubject)
                    ? taskSubjectColor(subject) : taskSubjectSoftColor(subject),
                    10, taskSubjectColor(subject), 1));
            option.setOnClickListener(v -> {
                selectTaskSubject(subject);
                dialog.dismiss();
                if (taskDraftInput != null) {
                    taskDraftInput.requestFocus();
                    taskDraftInput.setSelection(taskDraftInput.length());
                }
            });
            LinearLayout.LayoutParams optionParams = weightedFixed(1, dp(44));
            if (index % 2 == 1) optionParams.leftMargin = dp(7);
            rows[index / 2].addView(option, optionParams);
        }
        options.addView(rows[0], matchFixed(dp(44)));
        LinearLayout.LayoutParams secondRowParams = matchFixed(dp(44));
        secondRowParams.topMargin = dp(7);
        options.addView(rows[1], secondRowParams);
        dialog.show();
    }

    private void scrollTaskEntryToBottom() {
        if (taskEntryScrollView == null) return;
        taskEntryScrollView.post(() -> {
            taskEntryScrollView.fullScroll(View.FOCUS_DOWN);
            if (taskDraftInput != null) {
                taskDraftInput.requestFocus();
                taskDraftInput.setSelection(taskDraftInput.length());
            }
        });
    }

    private void setTaskDraftError(String message) {
        if (taskDraftErrorView == null || taskDraftInput == null) return;
        boolean hasError = message != null && !message.isEmpty();
        taskDraftErrorView.setText(hasError ? message : "先说出或输入作业内容");
        taskDraftErrorView.setVisibility(hasError ? View.VISIBLE : View.GONE);
        taskDraftInput.setBackground(rounded(Color.WHITE, 11,
                hasError ? Color.rgb(223, 126, 126) : LINE, 1));
    }

    private List<String> numberedTaskParts(String value) {
        List<Integer> starts = new ArrayList<>();
        List<Integer> ends = new ArrayList<>();
        List<Integer> numbers = new ArrayList<>();
        Matcher matcher = NUMBERED_TASK_PATTERN.matcher(value);
        while (matcher.find()) {
            starts.add(matcher.start());
            ends.add(matcher.end());
            numbers.add(Integer.parseInt(matcher.group(2) != null ? matcher.group(2) : matcher.group(3)));
        }
        int first = -1;
        for (int index = 0; index < numbers.size(); index++) {
            if (numbers.get(index) == 1) {
                first = index;
                break;
            }
        }
        if (first < 0) return null;
        int count = 1;
        while (first + count < numbers.size() && numbers.get(first + count) == count + 1) count++;
        List<String> parts = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            int markerIndex = first + index;
            int end = index + 1 < count ? starts.get(markerIndex + 1) : value.length();
            String part = value.substring(ends.get(markerIndex), end).trim();
            if (!part.isEmpty()) parts.add(part);
        }
        return parts;
    }

    private List<JSONObject> parseTaskDraft(String value) {
        List<JSONObject> parsed = new ArrayList<>();
        List<String> numbered = numberedTaskParts(value);
        String normalized = numbered == null
                ? SUBJECT_ANYWHERE_PATTERN.matcher(value).replaceAll("\n$1：") : null;
        String[] taskParts = numbered == null ? normalized.split("[\\n；;]+") : numbered.toArray(new String[0]);
        String currentSubject = selectedTaskSubject;
        for (String rawPart : taskParts) {
            String part = rawPart.trim().replaceAll("[，,\\s]+$", "");
            if (part.isEmpty()) continue;
            Matcher matcher = SUBJECT_PATTERN.matcher(part);
            String title = part;
            if (matcher.matches()) {
                currentSubject = matcher.group(1);
                title = matcher.group(2).trim();
            }
            if (title.isEmpty()) continue;
            JSONObject task = new JSONObject();
            put(task, "subject", currentSubject);
            put(task, "title", title);
            parsed.add(task);
        }
        return parsed;
    }

    private void generateTasksFromDraft() {
        if (offlineVoiceRecognizer != null
                && (offlineVoiceRecognizer.isRecording() || offlineVoiceRecognizer.isBusy())) {
            addTasksAfterVoiceStops = true;
            stopOfflineVoiceInput();
            setVoiceTaskStatus("录音已停止，识别完成后会自动加入清单");
            return;
        }
        addTasksFromDraft();
    }

    private void clearTaskDraftAndStopVoice() {
        addTasksAfterVoiceStops = false;
        voiceDraftPrefix = "";
        latestVoicePartial = "";
        boolean voiceActive = offlineVoiceRecognizer != null
                && (offlineVoiceRecognizer.isRecording() || offlineVoiceRecognizer.isBusy());
        discardVoiceResultAfterStop = voiceActive;
        if (voiceActive) stopOfflineVoiceInput();
        if (taskDraftInput != null) taskDraftInput.setText("");
        setTaskDraftError(null);
        setVoiceTaskStatus(voiceActive
                ? "录音已停止，正在清空识别结果"
                : "内容已清空，可以重新录入");
    }

    private void addTasksFromDraft() {
        String weekendKey = weekendKeyFor(currentDate);
        if (weekendKey != null && !currentDate.equals(weekendKey)) {
            toast("周六、周日直接使用周五清单，不需要重新录入");
            return;
        }
        JSONObject dailyRecord = currentRecord(false);
        if (dailyRecord == null || !dailyRecord.optBoolean("ledgerConfirmed")) {
            toast("请先核对钉钉，并补全成长记录册");
            return;
        }
        String draft = taskDraftInput.getText().toString().trim();
        List<JSONObject> parsed = parseTaskDraft(draft);
        if (parsed.isEmpty()) {
            setTaskDraftError("先说出或输入作业内容");
            taskDraftInput.requestFocus();
            if (taskEntryDialog != null && taskEntryDialog.getWindow() != null) {
                taskEntryDialog.getWindow().setSoftInputMode(
                        android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
            }
            return;
        }
        setTaskDraftError(null);
        JSONObject owner = taskOwner(true);
        JSONArray tasks = owner.optJSONArray("tasks");
        if (tasks == null) tasks = new JSONArray();
        long stamp = System.currentTimeMillis();
        for (int index = 0; index < parsed.size(); index++) {
            JSONObject task = parsed.get(index);
            put(task, "id", stamp + "-" + index);
            put(task, "addedAt", stamp);
            put(task, "addedSequence", index);
            put(task, "status", "pending");
            put(task, "elapsedMs", 0L);
            put(task, "estimatedMinutes", 15);
            if (weekendKey != null) put(task, "plannedDay", "saturday");
            tasks.put(task);
        }
        put(owner, "tasks", sortedPendingTasks(tasks));
        if (weekendKey != null) {
            put(owner, "confirmed", false);
            owner.remove("confirmedAt");
            owner.remove("planSaved");
            owner.remove("planSavedAt");
        } else {
            put(owner, "tasksConfirmed", false);
            owner.remove("tasksConfirmedAt");
            owner.remove("finishTime");
            owner.remove("tasksFinishedAt");
            owner.remove("ruleId");
        }
        owner.remove("orderSaved");
        owner.remove("orderSavedAt");
        taskDraftInput.setText("");
        saveTaskData();
        renderAll();
        scrollTaskEntryToBottom();
        toast("我把 " + parsed.size() + " 项作业收进清单了");
    }

    private JSONObject taskOwner(boolean create) {
        return weekendKeyFor(currentDate) != null ? weekendForDate(currentDate, create) : currentRecord(create);
    }

    private JSONArray taskArray(boolean create) {
        JSONObject owner = taskOwner(create);
        if (owner == null) return new JSONArray();
        JSONArray tasks = owner.optJSONArray("tasks");
        if (tasks == null && create) {
            tasks = new JSONArray();
            put(owner, "tasks", tasks);
        }
        return tasks == null ? new JSONArray() : tasks;
    }

    private boolean taskListConfirmed() {
        JSONObject owner = taskOwner(false);
        if (owner == null) return false;
        return weekendKeyFor(currentDate) != null
                ? owner.optBoolean("confirmed", false) : owner.optBoolean("tasksConfirmed", false);
    }

    private boolean taskOrderSaved() {
        JSONObject owner = taskOwner(false);
        if (owner != null && owner.optBoolean("orderSaved")) return true;
        JSONArray tasks = taskArray(false);
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && !"pending".equals(task.optString("status", "pending"))) return true;
        }
        return false;
    }

    private JSONObject activeTask(boolean createOwner) {
        JSONArray tasks = taskArray(createOwner);
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && "active".equals(task.optString("status"))) return task;
        }
        return null;
    }

    private boolean allTasksDone() {
        JSONArray tasks = taskArray(false);
        if (tasks.length() == 0) return false;
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task == null || !"done".equals(task.optString("status"))) return false;
        }
        return true;
    }

    private String plannedDayForTask(JSONObject task) {
        if (task != null && "friday".equals(task.optString("plannedDay"))) return "friday";
        return task != null && "sunday".equals(task.optString("plannedDay")) ? "sunday" : "saturday";
    }

    private String plannedDayLabel(JSONObject task) {
        String day = plannedDayForTask(task);
        return "friday".equals(day) ? "周五" : "sunday".equals(day) ? "周日" : "周六";
    }

    private String plannedDateForTask(String weekendKey, JSONObject task) {
        String day = plannedDayForTask(task);
        return addDays(weekendKey, "friday".equals(day) ? 0 : "sunday".equals(day) ? 2 : 1);
    }

    private int taskSubjectColor(String subject) {
        if ("语文".equals(subject)) return Color.rgb(197, 107, 69);
        if ("数学".equals(subject)) return Color.rgb(64, 117, 174);
        if ("英语".equals(subject)) return Color.rgb(118, 92, 167);
        if ("科学".equals(subject)) return Color.rgb(55, 126, 104);
        return Color.rgb(117, 111, 101);
    }

    private int taskSubjectRank(String subject) {
        for (int index = 0; index < TASK_SUBJECTS.length; index++) {
            if (TASK_SUBJECTS[index].equals(subject)) return index;
        }
        return TASK_SUBJECTS.length;
    }

    private long taskAddedAt(JSONObject task) {
        long addedAt = task.optLong("addedAt", 0L);
        if (addedAt > 0) return addedAt;
        String id = task.optString("id", "");
        int separator = id.indexOf('-');
        String timestamp = separator >= 0 ? id.substring(0, separator) : id;
        try {
            return Long.parseLong(timestamp);
        } catch (NumberFormatException ignored) {
            return Long.MAX_VALUE;
        }
    }

    private int taskAddedSequence(JSONObject task) {
        if (task.has("addedSequence")) return task.optInt("addedSequence", 0);
        String id = task.optString("id", "");
        int separator = id.indexOf('-');
        if (separator < 0 || separator == id.length() - 1) return 0;
        try {
            return Integer.parseInt(id.substring(separator + 1));
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private JSONArray sortedPendingTasks(JSONArray tasks) {
        List<JSONObject> ordered = new ArrayList<>();
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null) ordered.add(task);
        }
        Collections.sort(ordered, (left, right) -> {
            int subjectCompare = Integer.compare(
                    taskSubjectRank(left.optString("subject", "其他")),
                    taskSubjectRank(right.optString("subject", "其他")));
            if (subjectCompare != 0) return subjectCompare;
            int timeCompare = Long.compare(taskAddedAt(left), taskAddedAt(right));
            if (timeCompare != 0) return timeCompare;
            return Integer.compare(taskAddedSequence(left), taskAddedSequence(right));
        });
        JSONArray result = new JSONArray();
        for (JSONObject task : ordered) result.put(task);
        return result;
    }

    private int taskSubjectSoftColor(String subject) {
        if ("语文".equals(subject)) return Color.rgb(251, 233, 223);
        if ("数学".equals(subject)) return Color.rgb(231, 240, 250);
        if ("英语".equals(subject)) return Color.rgb(238, 233, 248);
        if ("科学".equals(subject)) return Color.rgb(228, 243, 237);
        return Color.rgb(242, 239, 233);
    }

    private long taskElapsedMillis(JSONObject task) {
        long elapsed = task.optLong("elapsedMs", 0L);
        if ("active".equals(task.optString("status"))) {
            long started = task.optLong("activeSince", 0L);
            if (started > 0) elapsed += Math.max(0L, System.currentTimeMillis() - started);
        }
        return elapsed;
    }

    private String taskDurationLabel(JSONObject task) {
        long seconds = taskElapsedMillis(task) / 1000L;
        if (seconds < 60) return seconds + " 秒";
        return (seconds / 60) + " 分 " + String.format(Locale.CHINA, "%02d", seconds % 60) + " 秒";
    }

    private int estimatedMinutes(JSONObject task) {
        int value = task == null ? 15 : task.optInt("estimatedMinutes", 15);
        for (int option : ESTIMATE_OPTIONS) if (option == value) return value;
        return 15;
    }

    private int taskActualMinutes(JSONObject task) {
        long elapsed = taskElapsedMillis(task);
        return elapsed > 0 ? Math.max(1, Math.round(elapsed / 60000f)) : 0;
    }

    private int remainingEstimatedMinutes(JSONArray tasks, List<Integer> indexes) {
        int total = 0;
        for (int index : indexes) {
            JSONObject task = tasks.optJSONObject(index);
            if (task == null || "done".equals(task.optString("status"))) continue;
            int spent = "active".equals(task.optString("status"))
                    ? (int) (taskElapsedMillis(task) / 60000L) : 0;
            total += Math.max(0, estimatedMinutes(task) - spent);
        }
        return total;
    }

    private String taskClockLabel(JSONObject task) {
        long seconds = taskElapsedMillis(task) / 1000L;
        long hours = seconds / 3600L;
        long minutes = (seconds % 3600L) / 60L;
        long remainder = seconds % 60L;
        return hours > 0
                ? String.format(Locale.CHINA, "%02d : %02d : %02d", hours, minutes, remainder)
                : String.format(Locale.CHINA, "%02d : %02d", minutes, remainder);
    }

    private String taskEstimateComparisonLabel(JSONObject task) {
        long difference = estimatedMinutes(task) * 60000L - taskElapsedMillis(task);
        if (difference > 0L) {
            long minutes = Math.max(1L, (difference + 59999L) / 60000L);
            return "距估时约 " + minutes + " 分钟";
        }
        if (difference > -60000L) return "刚到预计时间";
        long minutes = Math.max(1L, Math.abs(difference) / 60000L);
        return "已超过约 " + minutes + " 分钟";
    }

    private void showTaskFocusDialog(JSONObject task, int taskIndex) {
        dismissTaskFocusDialog();
        taskFocusTask = task;
        LinearLayout content = vertical();
        content.setPadding(dp(24), dp(22), dp(24), dp(8));
        TextView kicker = text("专注计时中", 11, GREEN, true);
        kicker.setGravity(Gravity.CENTER);
        content.addView(kicker);
        TextView subject = text(task.optString("subject", "其他"), 12, GREEN, true);
        subject.setGravity(Gravity.CENTER);
        subject.setPadding(0, dp(12), 0, 0);
        content.addView(subject);
        TextView title = text(task.optString("title", "当前作业"), 19, INK, true);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(8), 0, 0);
        content.addView(title);
        TextView elapsedLabel = text("已用时间", 10, MUTED, true);
        elapsedLabel.setGravity(Gravity.CENTER);
        elapsedLabel.setPadding(0, dp(15), 0, 0);
        content.addView(elapsedLabel);
        taskFocusElapsedView = text(taskClockLabel(task), 48, GREEN, true);
        taskFocusElapsedView.setGravity(Gravity.CENTER);
        taskFocusElapsedView.setPadding(0, dp(2), 0, dp(8));
        content.addView(taskFocusElapsedView);
        LinearLayout estimateCard = horizontal();
        estimateCard.setGravity(Gravity.CENTER_VERTICAL);
        estimateCard.setPadding(dp(12), dp(10), dp(12), dp(10));
        estimateCard.setBackground(rounded(GREEN_SOFT, 13, GREEN_SOFT, 0));
        TextView estimate = text("预计用时  " + estimatedMinutes(task) + " 分钟", 11, MUTED, true);
        estimateCard.addView(estimate, weightedWrap(1));
        taskFocusComparisonView = text(taskEstimateComparisonLabel(task), 11, Color.rgb(69, 107, 168), true);
        taskFocusComparisonView.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);
        estimateCard.addView(taskFocusComparisonView, weightedWrap(1));
        content.addView(estimateCard, matchWrap());
        TextView started = text("开始时间  " + task.optString("startedAt", "--:--"), 12, MUTED, false);
        started.setGravity(Gravity.CENTER);
        started.setPadding(0, dp(12), 0, 0);
        content.addView(started);
        TextView reminder = text("我先做好这一项，完成后再去下一关！", 11, MUTED, false);
        reminder.setGravity(Gravity.CENTER);
        reminder.setPadding(0, dp(16), 0, dp(4));
        content.addView(reminder);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(content)
                .setNegativeButton("暂时收起", null)
                .setNeutralButton("休息一下", null)
                .setPositiveButton("完成这项", null)
                .create();
        taskFocusDialog = dialog;
        dialog.setCanceledOnTouchOutside(false);
        dialog.setOnDismissListener(ignored -> {
            timerHandler.removeCallbacks(taskFocusTick);
            if (taskFocusDialog == dialog) {
                taskFocusDialog = null;
                taskFocusTask = null;
                taskFocusElapsedView = null;
                taskFocusComparisonView = null;
            }
        });
        dialog.setOnShowListener(ignored -> {
            dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setTextColor(GREEN);
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(GREEN);
            dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v -> {
                dialog.dismiss();
                performTaskAction("pause", taskIndex);
            });
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                dialog.dismiss();
                performTaskAction("complete", taskIndex);
            });
            timerHandler.removeCallbacks(taskFocusTick);
            timerHandler.post(taskFocusTick);
        });
        dialog.show();
    }

    private void dismissTaskFocusDialog() {
        timerHandler.removeCallbacks(taskFocusTick);
        if (taskFocusDialog != null && taskFocusDialog.isShowing()) taskFocusDialog.dismiss();
        taskFocusDialog = null;
        taskFocusTask = null;
        taskFocusElapsedView = null;
        taskFocusComparisonView = null;
    }

    private boolean taskCanRunToday(JSONObject task) {
        String weekendKey = weekendKeyFor(currentDate);
        if (weekendKey == null) return true;
        JSONObject weekend = weekendForDate(currentDate, false);
        if (weekend == null || !weekend.optBoolean("planSaved")) return false;
        if (currentDate.equals(weekendKey)) return "friday".equals(plannedDayForTask(task));
        if (currentDate.equals(addDays(weekendKey, 1))) return !"sunday".equals(plannedDayForTask(task));
        return true;
    }

    private int nextTaskIndexForToday() {
        JSONArray tasks = taskArray(false);
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && !"done".equals(task.optString("status")) && taskCanRunToday(task)) return index;
        }
        return -1;
    }

    private int taskIndexById(String id) {
        JSONArray tasks = taskArray(false);
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && id.equals(task.optString("id"))) return index;
        }
        return -1;
    }

    private boolean hasActiveStartPlanSession() {
        return startPlanSession != null
                && hasText(startPlanSession, "taskId")
                && hasText(startPlanSession, "date")
                && startPlanSession.optLong("startAt", 0L) > 0L;
    }

    private void saveStartPlanSession() {
        preferences.edit().putString(KEY_START_PLAN_SESSION,
                startPlanSession == null ? "{}" : startPlanSession.toString()).apply();
    }

    private void clearStartPlanSession() {
        startPlanSession = new JSONObject();
        saveStartPlanSession();
        timerHandler.removeCallbacks(startPlanTimerTick);
        releaseBreakAlarmPlayer();
        if (startPlanDialog != null && startPlanDialog.isShowing()) startPlanDialog.dismiss();
        startPlanDialog = null;
        startPlanCountdownView = null;
        startPlanTaskView = null;
        startPlanScheduledTimeView = null;
    }

    private void stylePlanTimeButton(Button button) {
        button.setTextColor(Color.rgb(138, 99, 27));
        button.setBackground(rounded(Color.rgb(255, 248, 230), 12,
                Color.rgb(230, 189, 103), 1));
    }

    private boolean taskCanBeScheduled(JSONObject task) {
        if (task == null) return false;
        String status = task.optString("status", "pending");
        return ("pending".equals(status) || "paused".equals(status))
                && taskListConfirmed() && taskOrderSaved() && taskCanRunToday(task);
    }

    private void showTaskStartChoice(int taskIndex, boolean nextTask) {
        JSONObject task = taskArray(false).optJSONObject(taskIndex);
        if (!taskCanBeScheduled(task)) return;
        clearStartPlanSession();
        final String taskId = task.optString("id");
        final String planDate = currentDate;

        LinearLayout content = vertical();
        content.setPadding(dp(22), dp(6), dp(22), 0);
        TextView taskCard = text((nextTask ? "下一项作业\n" : "第一项作业\n") + task.optString("subject", "其他")
                + " · " + task.optString("title", "作业"), 12, INK, true);
        int subjectColor = taskSubjectColor(task.optString("subject", "其他"));
        taskCard.setPadding(dp(13), dp(11), dp(13), dp(11));
        taskCard.setLineSpacing(dp(3), 1f);
        taskCard.setBackground(rounded(taskSubjectSoftColor(task.optString("subject", "其他")),
                13, subjectColor, 1));
        content.addView(taskCard, matchWrap());

        Button nowButton = smallButton("现在开始");
        nowButton.setTextColor(Color.WHITE);
        nowButton.setBackground(rounded(GREEN, 12, GREEN, 1));
        Button fiveButton = smallButton("5分钟后");
        Button tenButton = smallButton("10分钟后");
        Button fifteenButton = smallButton("15分钟后");
        stylePlanTimeButton(fiveButton);
        stylePlanTimeButton(tenButton);
        stylePlanTimeButton(fifteenButton);

        LinearLayout firstRow = horizontal();
        firstRow.addView(nowButton, weightedFixed(1, dp(44)));
        firstRow.addView(spaceHorizontal(7));
        firstRow.addView(fiveButton, weightedFixed(1, dp(44)));
        LinearLayout.LayoutParams firstRowParams = matchFixed(dp(44));
        firstRowParams.topMargin = dp(12);
        content.addView(firstRow, firstRowParams);

        LinearLayout secondRow = horizontal();
        secondRow.addView(tenButton, weightedFixed(1, dp(44)));
        secondRow.addView(spaceHorizontal(7));
        secondRow.addView(fifteenButton, weightedFixed(1, dp(44)));
        LinearLayout.LayoutParams secondRowParams = matchFixed(dp(44));
        secondRowParams.topMargin = dp(7);
        content.addView(secondRow, secondRowParams);

        Button exactTimeButton = smallButton("选择具体时间");
        stylePlanTimeButton(exactTimeButton);
        LinearLayout.LayoutParams exactParams = matchFixed(dp(44));
        exactParams.topMargin = dp(7);
        content.addView(exactTimeButton, exactParams);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle(nextTask ? "我准备什么时候开始下一项？" : "我准备什么时候开始？")
                .setView(content)
                .setNegativeButton("暂时不安排", null)
                .create();
        startPlanDialog = dialog;
        nowButton.setOnClickListener(v -> startTaskFromStartPlan(taskId, planDate));
        fiveButton.setOnClickListener(v -> scheduleTaskStart(
                taskId, planDate, System.currentTimeMillis() + 5 * 60000L, nextTask));
        tenButton.setOnClickListener(v -> scheduleTaskStart(
                taskId, planDate, System.currentTimeMillis() + 10 * 60000L, nextTask));
        fifteenButton.setOnClickListener(v -> scheduleTaskStart(
                taskId, planDate, System.currentTimeMillis() + 15 * 60000L, nextTask));
        exactTimeButton.setOnClickListener(v -> {
            Calendar suggested = Calendar.getInstance();
            suggested.add(Calendar.MINUTE, 30);
            new TimePickerDialog(this, (view, hour, minute) -> {
                Calendar start = Calendar.getInstance();
                start.set(Calendar.HOUR_OF_DAY, hour);
                start.set(Calendar.MINUTE, minute);
                start.set(Calendar.SECOND, 0);
                start.set(Calendar.MILLISECOND, 0);
                if (start.getTimeInMillis() <= System.currentTimeMillis()) {
                    toast("请选择晚于现在的时间");
                    return;
                }
                scheduleTaskStart(taskId, planDate, start.getTimeInMillis(), nextTask);
            }, suggested.get(Calendar.HOUR_OF_DAY), suggested.get(Calendar.MINUTE), true).show();
        });
        dialog.setOnDismissListener(ignored -> {
            if (startPlanDialog == dialog) startPlanDialog = null;
        });
        dialog.show();
    }

    private void scheduleTaskStart(String taskId, String date, long startAt, boolean nextTask) {
        if (taskId == null || taskId.isEmpty() || startAt <= 0L) return;
        if (!date.equals(currentDate) || !taskCanBeScheduled(taskArray(false).optJSONObject(taskIndexById(taskId)))) return;
        startPlanSession = new JSONObject();
        put(startPlanSession, "taskId", taskId);
        put(startPlanSession, "date", date);
        put(startPlanSession, "kind", nextTask ? "next" : "first");
        put(startPlanSession, "startAt", startAt);
        put(startPlanSession, "alerted", false);
        saveStartPlanSession();
        if (startPlanDialog != null && startPlanDialog.isShowing()) startPlanDialog.dismiss();
        showStartPlanTimerDialog();
    }

    private void showStartPlanTimerDialog() {
        if (!hasActiveStartPlanSession()) return;
        String sessionDate = startPlanSession.optString("date", currentDate);
        if (!sessionDate.equals(currentDate)) {
            currentDate = sessionDate;
            renderAll();
        }
        int taskIndex = taskIndexById(startPlanSession.optString("taskId"));
        JSONObject task = taskArray(false).optJSONObject(taskIndex);
        if (!taskCanBeScheduled(task)) {
            clearStartPlanSession();
            return;
        }
        if (startPlanDialog != null && startPlanDialog.isShowing()) return;
        LinearLayout content = vertical();
        content.setPadding(dp(24), dp(8), dp(24), dp(4));
        TextView label = text("距离开始还有", 10, Color.rgb(138, 99, 27), true);
        label.setGravity(Gravity.CENTER);
        content.addView(label);
        startPlanCountdownView = text("05 : 00", 48, Color.rgb(183, 119, 18), true);
        startPlanCountdownView.setGravity(Gravity.CENTER);
        startPlanCountdownView.setPadding(0, dp(3), 0, dp(6));
        content.addView(startPlanCountdownView);
        startPlanScheduledTimeView = text("", 10, MUTED, true);
        startPlanScheduledTimeView.setGravity(Gravity.CENTER);
        startPlanScheduledTimeView.setPadding(0, 0, 0, dp(10));
        content.addView(startPlanScheduledTimeView);
        startPlanTaskView = text("", 12, INK, true);
        startPlanTaskView.setPadding(dp(12), dp(10), dp(12), dp(10));
        content.addView(startPlanTaskView, matchWrap());

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("我的开始计划")
                .setView(content)
                .setNegativeButton("重新选时间", null)
                .setPositiveButton("我准备好了，提前开始", null)
                .create();
        startPlanDialog = dialog;
        dialog.setCanceledOnTouchOutside(false);
        dialog.setCancelable(false);
        dialog.setOnShowListener(ignored -> {
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(Color.rgb(138, 99, 27));
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setOnClickListener(v -> adjustStartPlan());
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(GREEN);
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> startTaskFromStartPlan(
                    startPlanSession.optString("taskId"), startPlanSession.optString("date", currentDate)));
            timerHandler.removeCallbacks(startPlanTimerTick);
            timerHandler.post(startPlanTimerTick);
        });
        dialog.setOnDismissListener(ignored -> {
            if (startPlanDialog == dialog) {
                timerHandler.removeCallbacks(startPlanTimerTick);
                startPlanDialog = null;
            }
        });
        dialog.show();
    }

    private void renderStartPlanTimerDialog() {
        if (!hasActiveStartPlanSession() || startPlanDialog == null || !startPlanDialog.isShowing()) return;
        int taskIndex = taskIndexById(startPlanSession.optString("taskId"));
        JSONObject task = taskArray(false).optJSONObject(taskIndex);
        if (!taskCanBeScheduled(task)) {
            clearStartPlanSession();
            return;
        }
        long now = System.currentTimeMillis();
        boolean nextTask = "next".equals(startPlanSession.optString("kind"));
        long remaining = Math.max(0L, startPlanSession.optLong("startAt") - now);
        long seconds = (remaining + 999L) / 1000L;
        if (startPlanCountdownView != null) {
            startPlanCountdownView.setText(remaining > 0
                    ? String.format(Locale.CHINA, "%02d : %02d", seconds / 60L, seconds % 60L) : "时间到");
            startPlanCountdownView.setTextColor(remaining > 0 ? Color.rgb(183, 119, 18) : AMBER);
        }
        if (startPlanScheduledTimeView != null) startPlanScheduledTimeView.setText(
                "我计划 " + timeFromEpoch(startPlanSession.optLong("startAt")) + " 开始");
        if (startPlanTaskView != null) {
            String subject = task.optString("subject", "其他");
            startPlanTaskView.setText((nextTask ? "下一项作业\n" : "第一项作业\n") + subject + " · "
                    + task.optString("title", "作业"));
            startPlanTaskView.setTextColor(INK);
            startPlanTaskView.setBackground(rounded(taskSubjectSoftColor(subject), 13,
                    taskSubjectColor(subject), 1));
        }
        startPlanDialog.setTitle(remaining > 0 ? "我按计划准备开始" : "我计划的开始时间到了");
        Button start = startPlanDialog.getButton(AlertDialog.BUTTON_POSITIVE);
        if (start != null) start.setText(remaining > 0 ? "我准备好了，提前开始"
                : nextTask ? "开始我的下一项" : "开始我的第一项");
        if (remaining == 0L && !startPlanSession.optBoolean("alerted")) {
            put(startPlanSession, "alerted", true);
            put(startPlanSession, "nextAlertAt", now + BREAK_REMINDER_INTERVAL_MS);
            saveStartPlanSession();
            vibrateBreakAlarm();
            playBreakAlarm(2);
        } else if (remaining == 0L && now >= startPlanSession.optLong(
                "nextAlertAt", startPlanSession.optLong("startAt") + BREAK_REMINDER_INTERVAL_MS)) {
            put(startPlanSession, "nextAlertAt", now + BREAK_REMINDER_INTERVAL_MS);
            saveStartPlanSession();
            vibrateBreakAlarm();
            playBreakAlarm(1);
        }
    }

    private void startTaskFromStartPlan(String taskId, String date) {
        clearStartPlanSession();
        if (date != null && !date.isEmpty() && !date.equals(currentDate)) {
            currentDate = date;
            renderAll();
        }
        int taskIndex = taskIndexById(taskId);
        if (taskIndex >= 0) performTaskAction("start", taskIndex);
    }

    private void adjustStartPlan() {
        if (!hasActiveStartPlanSession()) return;
        String taskId = startPlanSession.optString("taskId");
        String date = startPlanSession.optString("date", currentDate);
        boolean nextTask = "next".equals(startPlanSession.optString("kind"));
        clearStartPlanSession();
        if (!date.equals(currentDate)) {
            currentDate = date;
            renderAll();
        }
        int taskIndex = taskIndexById(taskId);
        if (taskIndex >= 0) showTaskStartChoice(taskIndex, nextTask);
    }

    private String breakKindLabel(String kind) {
        if ("toilet".equals(kind)) return "上厕所";
        if ("short".equals(kind)) return "短休息";
        if ("long".equals(kind)) return "多休息一会";
        return "meal".equals(kind) ? "吃饭" : "休息";
    }

    private String timeFromEpoch(long value) {
        return new SimpleDateFormat("HH:mm", Locale.CHINA).format(value);
    }

    private JSONArray breakLogArray(boolean create) {
        JSONObject owner = taskOwner(create);
        if (owner == null) return new JSONArray();
        JSONArray breaks = owner.optJSONArray("breaks");
        if (breaks == null && create) {
            breaks = new JSONArray();
            put(owner, "breaks", breaks);
        }
        return breaks == null ? new JSONArray() : breaks;
    }

    private JSONObject createBreakLog(String kind, long endAt) {
        long startedAt = System.currentTimeMillis();
        JSONObject task = taskArray(false).optJSONObject(breakChoiceTaskIndex);
        JSONObject sourceTask = taskArray(false).optJSONObject(breakChoiceSourceTaskIndex);
        JSONObject entry = new JSONObject();
        put(entry, "id", "break-" + startedAt);
        put(entry, "kind", kind);
        put(entry, "kindLabel", breakKindLabel(kind));
        put(entry, "trigger", breakChoiceFromPause ? "pause" : "checkpoint");
        if (sourceTask != null) put(entry, "sourceTaskId", sourceTask.optString("id"));
        if (task != null) put(entry, "nextTaskId", task.optString("id"));
        put(entry, "startedAt", startedAt);
        put(entry, "plannedEndAt", endAt);
        put(entry, "plannedMinutes", Math.max(1L, (endAt - startedAt + 59999L) / 60000L));
        put(entry, "plannedReturnAt", timeFromEpoch(endAt));
        put(entry, "status", "resting");
        breakLogArray(true).put(entry);
        saveTaskData();
        return entry;
    }

    private JSONObject breakLogById(String id) {
        if (id == null || id.isEmpty()) return null;
        JSONArray breaks = breakLogArray(false);
        for (int index = 0; index < breaks.length(); index++) {
            JSONObject entry = breaks.optJSONObject(index);
            if (entry != null && id.equals(entry.optString("id"))) return entry;
        }
        return null;
    }

    private JSONObject finishBreakLog(String status) {
        if (!hasActiveBreakSession() || !hasText(breakSession, "breakId")) return null;
        JSONObject entry = breakLogById(breakSession.optString("breakId"));
        if (entry == null) return null;
        long returnedAt = System.currentTimeMillis();
        long startedAt = entry.optLong("startedAt", returnedAt);
        long actualMinutes = Math.max(1L, (returnedAt - startedAt + 59999L) / 60000L);
        put(entry, "status", status);
        put(entry, "actualEndAt", returnedAt);
        put(entry, "actualReturnAt", timeFromEpoch(returnedAt));
        put(entry, "actualMinutes", actualMinutes);
        put(entry, "overtimeMinutes", Math.max(0L, actualMinutes - entry.optLong("plannedMinutes", 0L)));
        put(entry, "extended", breakSession.optBoolean("extended"));
        saveTaskData();
        return entry;
    }

    private boolean hasActiveBreakSession() {
        return breakSession != null
                && hasText(breakSession, "taskId")
                && breakSession.optLong("endAt", 0L) > 0L;
    }

    private void saveBreakSession() {
        preferences.edit().putString(KEY_BREAK_SESSION,
                breakSession == null ? "{}" : breakSession.toString()).apply();
    }

    private void clearBreakSession() {
        breakSession = new JSONObject();
        saveBreakSession();
        timerHandler.removeCallbacks(breakTimerTick);
        releaseBreakAlarmPlayer();
        if (breakTimerDialog != null && breakTimerDialog.isShowing()) breakTimerDialog.dismiss();
        breakTimerDialog = null;
        breakCountdownView = null;
        breakNextTaskView = null;
        breakPlannedReturnView = null;
        extendBreakButton = null;
    }

    private void updateBreakChoiceTask(TextView nextTaskView) {
        JSONObject task = taskArray(false).optJSONObject(breakChoiceTaskIndex);
        if (task == null) return;
        String subject = task.optString("subject", "其他");
        nextTaskView.setText((breakChoiceFromPause ? "休息回来，我要做" : "回来后做")
                + "\n" + subject + " · " + task.optString("title", "下一项作业"));
        nextTaskView.setTextColor(INK);
        nextTaskView.setBackground(rounded(taskSubjectSoftColor(subject), 13,
                taskSubjectColor(subject), 1));
    }

    private void showBreakChoiceDialog(int taskIndex, boolean fromPause, int sourceTaskIndex) {
        JSONArray tasks = taskArray(false);
        JSONObject task = tasks.optJSONObject(taskIndex);
        if (task == null) return;
        if (breakChoiceDialog != null && breakChoiceDialog.isShowing()) breakChoiceDialog.dismiss();
        breakChoiceTaskIndex = taskIndex;
        breakChoiceSourceTaskIndex = sourceTaskIndex;
        breakChoiceFromPause = fromPause;
        LinearLayout content = vertical();
        content.setPadding(dp(22), dp(6), dp(22), 0);
        TextView next = text("", 12, Color.rgb(69, 107, 168), true);
        next.setPadding(dp(13), dp(11), dp(13), dp(11));
        next.setBackground(rounded(GREEN_SOFT, 13, GREEN_SOFT, 0));
        content.addView(next, matchWrap());
        LinearLayout breakTimes = horizontal();
        Button fiveMinutes = smallButton("5分钟");
        breakTimes.addView(fiveMinutes, weightedFixed(1, dp(44)));
        breakTimes.addView(spaceHorizontal(6));
        Button tenMinutes = smallButton("10分钟");
        breakTimes.addView(tenMinutes, weightedFixed(1, dp(44)));
        breakTimes.addView(spaceHorizontal(6));
        Button fifteenMinutes = smallButton("15分钟");
        stylePlanTimeButton(fiveMinutes);
        stylePlanTimeButton(tenMinutes);
        stylePlanTimeButton(fifteenMinutes);
        breakTimes.addView(fifteenMinutes, weightedFixed(1, dp(44)));
        LinearLayout.LayoutParams breakTimesParams = matchFixed(dp(44));
        breakTimesParams.topMargin = dp(10);
        content.addView(breakTimes, breakTimesParams);
        Button meal = smallButton("🍚 去吃饭 · 选择回来时间");
        stylePlanTimeButton(meal);
        LinearLayout.LayoutParams mealParams = matchFixed(dp(46));
        mealParams.topMargin = dp(6);
        content.addView(meal, mealParams);
        updateBreakChoiceTask(next);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("休息多久？")
                .setView(content)
                .setNegativeButton("先关闭", null)
                .setPositiveButton(fromPause ? "不休息，继续这项" : "不休息，开始下一项", null)
                .create();
        breakChoiceDialog = dialog;
        fiveMinutes.setOnClickListener(v -> startBreakSession(
                breakChoiceTaskIndex, System.currentTimeMillis() + 5 * 60000L, "break"));
        tenMinutes.setOnClickListener(v -> startBreakSession(
                breakChoiceTaskIndex, System.currentTimeMillis() + 10 * 60000L, "break"));
        fifteenMinutes.setOnClickListener(v -> startBreakSession(
                breakChoiceTaskIndex, System.currentTimeMillis() + 15 * 60000L, "break"));
        meal.setOnClickListener(v -> {
            Calendar suggested = Calendar.getInstance();
            suggested.add(Calendar.MINUTE, 30);
            new TimePickerDialog(this, (view, hour, minute) -> {
                Calendar end = Calendar.getInstance();
                end.set(Calendar.HOUR_OF_DAY, hour);
                end.set(Calendar.MINUTE, minute);
                end.set(Calendar.SECOND, 0);
                end.set(Calendar.MILLISECOND, 0);
                if (end.getTimeInMillis() <= System.currentTimeMillis()) {
                    toast("请选择晚于现在的时间");
                    return;
                }
                startBreakSession(breakChoiceTaskIndex, end.getTimeInMillis(), "meal");
            }, suggested.get(Calendar.HOUR_OF_DAY), suggested.get(Calendar.MINUTE), true).show();
        });
        dialog.setOnShowListener(ignored -> {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(GREEN);
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                JSONObject selectedTask = taskArray(false).optJSONObject(breakChoiceTaskIndex);
                if (selectedTask != null) startTaskAfterBreak(selectedTask.optString("id"), currentDate);
            });
        });
        dialog.setOnDismissListener(ignored -> {
            if (breakChoiceDialog == dialog) {
                breakChoiceDialog = null;
                breakChoiceTaskIndex = -1;
                breakChoiceSourceTaskIndex = -1;
                breakChoiceFromPause = false;
            }
        });
        dialog.show();
    }

    private void startBreakSession(int taskIndex, long endAt, String kind) {
        JSONObject task = taskArray(false).optJSONObject(taskIndex);
        if (task == null) return;
        JSONObject log = createBreakLog(kind, endAt);
        breakSession = new JSONObject();
        put(breakSession, "taskId", task.optString("id"));
        put(breakSession, "date", currentDate);
        put(breakSession, "startedAt", System.currentTimeMillis());
        put(breakSession, "endAt", endAt);
        put(breakSession, "kind", kind);
        put(breakSession, "breakId", log.optString("id"));
        put(breakSession, "extended", false);
        put(breakSession, "alerted", false);
        saveBreakSession();
        if (breakChoiceDialog != null) breakChoiceDialog.dismiss();
        showBreakTimerDialog();
    }

    private void showBreakTimerDialog() {
        if (!hasActiveBreakSession()) return;
        String sessionDate = breakSession.optString("date", currentDate);
        if (!sessionDate.equals(currentDate)) {
            currentDate = sessionDate;
            renderAll();
        }
        int taskIndex = taskIndexById(breakSession.optString("taskId"));
        JSONObject task = taskArray(false).optJSONObject(taskIndex);
        if (task == null || "done".equals(task.optString("status"))) {
            finishBreakLog("cancelled");
            clearBreakSession();
            return;
        }
        if (breakTimerDialog != null && breakTimerDialog.isShowing()) return;
        LinearLayout content = vertical();
        content.setPadding(dp(24), dp(8), dp(24), dp(4));
        TextView label = text("距离回来还有", 10, Color.rgb(138, 99, 27), true);
        label.setGravity(Gravity.CENTER);
        content.addView(label);
        breakCountdownView = text("05 : 00", 48, Color.rgb(183, 119, 18), true);
        breakCountdownView.setGravity(Gravity.CENTER);
        breakCountdownView.setPadding(0, dp(3), 0, dp(10));
        content.addView(breakCountdownView);
        breakPlannedReturnView = text("", 10, MUTED, true);
        breakPlannedReturnView.setGravity(Gravity.CENTER);
        breakPlannedReturnView.setPadding(0, 0, 0, dp(10));
        content.addView(breakPlannedReturnView);
        breakNextTaskView = text("", 12, INK, true);
        breakNextTaskView.setPadding(dp(12), dp(10), dp(12), dp(10));
        content.addView(breakNextTaskView, matchWrap());

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("我的休息计划")
                .setView(content)
                .setNegativeButton("取消提醒", null)
                .setNeutralButton("再休息 3 分钟", null)
                .setPositiveButton("我回来了，开始下一项", null)
                .create();
        breakTimerDialog = dialog;
        dialog.setCanceledOnTouchOutside(false);
        dialog.setCancelable(false);
        dialog.setOnShowListener(ignored -> {
            extendBreakButton = dialog.getButton(AlertDialog.BUTTON_NEUTRAL);
            extendBreakButton.setTextColor(GREEN);
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(GREEN);
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setOnClickListener(v -> {
                finishBreakLog("cancelled");
                clearBreakSession();
                toast("这次休息提醒已取消");
            });
            extendBreakButton.setOnClickListener(v -> extendBreakSession());
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> startTaskAfterBreak(
                    breakSession.optString("taskId"), breakSession.optString("date", currentDate)));
            timerHandler.removeCallbacks(breakTimerTick);
            timerHandler.post(breakTimerTick);
        });
        dialog.setOnDismissListener(ignored -> {
            timerHandler.removeCallbacks(breakTimerTick);
            if (breakTimerDialog == dialog) breakTimerDialog = null;
        });
        dialog.show();
    }

    private void renderBreakTimerDialog() {
        if (!hasActiveBreakSession() || breakTimerDialog == null || !breakTimerDialog.isShowing()) return;
        int taskIndex = taskIndexById(breakSession.optString("taskId"));
        JSONObject task = taskArray(false).optJSONObject(taskIndex);
        if (task == null || "done".equals(task.optString("status"))) {
            finishBreakLog("cancelled");
            clearBreakSession();
            return;
        }
        long now = System.currentTimeMillis();
        long remaining = Math.max(0L, breakSession.optLong("endAt") - now);
        long seconds = (remaining + 999L) / 1000L;
        if (breakCountdownView != null) {
            breakCountdownView.setText(remaining > 0
                    ? String.format(Locale.CHINA, "%02d : %02d", seconds / 60L, seconds % 60L) : "时间到");
            breakCountdownView.setTextColor(remaining > 0 ? Color.rgb(183, 119, 18) : AMBER);
        }
        if (breakNextTaskView != null) {
            String subject = task.optString("subject", "其他");
            breakNextTaskView.setText("回来后做\n" + subject + " · "
                    + task.optString("title", "下一项作业"));
            breakNextTaskView.setTextColor(INK);
            breakNextTaskView.setBackground(rounded(taskSubjectSoftColor(subject), 13,
                    taskSubjectColor(subject), 1));
        }
        if (breakPlannedReturnView != null) breakPlannedReturnView.setText(
                "我计划 " + timeFromEpoch(breakSession.optLong("endAt")) + " 回来");
        if (extendBreakButton != null) {
            extendBreakButton.setEnabled(!breakSession.optBoolean("extended"));
            extendBreakButton.setVisibility(!breakSession.optBoolean("extended") ? View.VISIBLE : View.GONE);
        }
        breakTimerDialog.setTitle(remaining > 0 ? "我正在休息" : "我计划的休息时间到了");
        Button start = breakTimerDialog.getButton(AlertDialog.BUTTON_POSITIVE);
        if (start != null) start.setText(remaining > 0 ? "我提前回来了，开始下一项" : "开始下一项");
        if (remaining == 0L && !breakSession.optBoolean("alerted")) {
            put(breakSession, "alerted", true);
            put(breakSession, "nextAlertAt", now + BREAK_REMINDER_INTERVAL_MS);
            saveBreakSession();
            vibrateBreakAlarm();
            playBreakAlarm(2);
        } else if (remaining == 0L && now >= breakSession.optLong(
                "nextAlertAt", breakSession.optLong("endAt") + BREAK_REMINDER_INTERVAL_MS)) {
            put(breakSession, "nextAlertAt", now + BREAK_REMINDER_INTERVAL_MS);
            saveBreakSession();
            vibrateBreakAlarm();
            playBreakAlarm(1);
        }
    }

    private void vibrateBreakAlarm() {
        Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = {0L, 350L, 180L, 350L};
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
        } else {
            vibrator.vibrate(pattern, -1);
        }
    }

    private void extendBreakSession() {
        if (!hasActiveBreakSession() || breakSession.optBoolean("extended")) return;
        releaseBreakAlarmPlayer();
        long endAt = Math.max(System.currentTimeMillis(), breakSession.optLong("endAt")) + 3 * 60000L;
        put(breakSession, "endAt", endAt);
        put(breakSession, "extended", true);
        put(breakSession, "alerted", false);
        breakSession.remove("nextAlertAt");
        JSONObject entry = breakLogById(breakSession.optString("breakId"));
        if (entry != null) {
            put(entry, "plannedEndAt", endAt);
            put(entry, "plannedMinutes", Math.max(1L,
                    (endAt - entry.optLong("startedAt", System.currentTimeMillis()) + 59999L) / 60000L));
            put(entry, "plannedReturnAt", timeFromEpoch(endAt));
            put(entry, "extended", true);
            saveTaskData();
        }
        saveBreakSession();
        renderBreakTimerDialog();
        toast("我把休息延长 3 分钟，只延长这一次");
    }

    private void startTaskAfterBreak(String taskId, String date) {
        if (date != null && !date.isEmpty() && !date.equals(currentDate)) currentDate = date;
        int taskIndex = taskIndexById(taskId);
        JSONObject log = finishBreakLog("returned");
        clearBreakSession();
        if (breakChoiceDialog != null) breakChoiceDialog.dismiss();
        renderAll();
        if (taskIndex >= 0) performTaskAction("start", taskIndex);
        if (log != null) timerHandler.postDelayed(() -> toast("计划休息 "
                + log.optLong("plannedMinutes") + " 分钟，实际 "
                + log.optLong("actualMinutes") + " 分钟"), 80L);
    }

    private void stopTaskClock(JSONObject task, String nextStatus) {
        if ("active".equals(task.optString("status")) && task.optLong("activeSince", 0L) > 0) {
            put(task, "elapsedMs", taskElapsedMillis(task));
        }
        task.remove("activeSince");
        put(task, "status", nextStatus);
    }

    private void toggleTaskListConfirmation() {
        String weekendKey = weekendKeyFor(currentDate);
        if (weekendKey != null && !currentDate.equals(weekendKey)) {
            toast("周六、周日使用周五已经确认的清单");
            return;
        }
        JSONArray tasks = taskArray(false);
        if (tasks.length() == 0) {
            toast("请先录入作业");
            return;
        }
        boolean confirmed = taskListConfirmed();
        JSONObject dailyRecord = currentRecord(false);
        if (!confirmed && (dailyRecord == null || !dailyRecord.optBoolean("ledgerConfirmed"))) {
            toast("请先核对钉钉，并补全成长记录册");
            return;
        }
        if (confirmed && activeTask(false) != null) {
            toast("请先暂停当前作业再修改清单");
            return;
        }
        if (confirmed) {
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null && !"pending".equals(task.optString("status", "pending"))) {
                    toast("已经开始闯关，不能再修改清单");
                    return;
                }
            }
        }
        JSONObject owner = taskOwner(true);
        tasks = sortedPendingTasks(tasks);
        put(owner, "tasks", tasks);
        String field = weekendKey != null ? "confirmed" : "tasksConfirmed";
        String timeField = weekendKey != null ? "confirmedAt" : "tasksConfirmedAt";
        put(owner, field, !confirmed);
        if (!confirmed) put(owner, timeField, currentTime()); else owner.remove(timeField);
        if (weekendKey == null) {
            if (confirmed) {
                owner.remove("finishTime");
                owner.remove("tasksFinishedAt");
                owner.remove("ruleId");
            } else if (allTasksDone()) {
                String latest = "";
                for (int index = 0; index < tasks.length(); index++) {
                    String completedAt = tasks.optJSONObject(index).optString("completedAt", "");
                    if (completedAt.compareTo(latest) > 0) latest = completedAt;
                }
                put(owner, "tasksFinishedAt", latest.isEmpty() ? currentTime() : latest);
                if (owner.optBoolean("ledgerConfirmed")) put(owner, "finishTime", owner.optString("tasksFinishedAt"));
            }
        } else {
            owner.remove("planSaved");
            owner.remove("planSavedAt");
        }
        if (!confirmed) {
            put(owner, "orderSaved", false);
            owner.remove("orderSavedAt");
        } else {
            owner.remove("orderSaved");
            owner.remove("orderSavedAt");
        }
        taskListExpanded = false;
        completedTasksExpanded = false;
        saveTaskData();
        renderAll();
        if (confirmed) showTaskEntryDialog();
        toast(confirmed ? "我可以继续修改清单了"
                : "清单收好了，接下来安排 " + tasks.length() + " 项作业的顺序");
    }

    private void toggleTaskOrder() {
        String weekendKey = weekendKeyFor(currentDate);
        JSONArray tasks = taskArray(false);
        JSONObject owner = taskOwner(true);
        if (!taskListConfirmed() || tasks.length() == 0) {
            toast("请先确认完整的作业清单");
            return;
        }
        if (weekendKey != null && !currentDate.equals(weekendKey)) {
            toast("周末顺序请回到周五安排");
            return;
        }
        if (weekendKey != null && !owner.optBoolean("planSaved")) {
            toast("请先安排每项作业在周五、周六还是周日完成");
            return;
        }
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && !"pending".equals(task.optString("status", "pending"))) {
                toast("已经开始闯关，顺序不能再调整");
                return;
            }
        }
        if (taskBreakPointCount(tasks) > 2) {
            toast("休息点最多两个，请先取消多余的休息点");
            return;
        }
        if (taskOrderSaved()) {
            clearStartPlanSession();
            put(owner, "orderSaved", false);
            owner.remove("orderSavedAt");
            taskListExpanded = false;
            completedTasksExpanded = false;
            saveTaskData();
            renderAll();
            toast("可以重新安排顺序了");
            return;
        }
        put(owner, "orderSaved", true);
        put(owner, "orderSavedAt", currentTime());
        taskListExpanded = false;
        completedTasksExpanded = false;
        saveTaskData();
        renderAll();
        toast(weekendKey == null ? "顺序已确定，我要开始第一关啦！" : "周末闯关顺序已确定！");
        int firstTaskIndex = nextTaskIndexForToday();
        if (firstTaskIndex >= 0) timerHandler.postDelayed(
                () -> showTaskStartChoice(firstTaskIndex, false), 80L);
    }

    private void reorderTask(int fromIndex, int targetIndex) {
        JSONArray tasks = taskArray(false);
        if (fromIndex < 0 || targetIndex < 0 || fromIndex >= tasks.length()
                || targetIndex >= tasks.length() || fromIndex == targetIndex) return;
        JSONObject moving = tasks.optJSONObject(fromIndex);
        JSONObject target = tasks.optJSONObject(targetIndex);
        String weekendKey = weekendKeyFor(currentDate);
        if (moving == null || target == null) return;
        if (weekendKey != null && !plannedDayForTask(moving).equals(plannedDayForTask(target))) {
            toast("三天的作业请分别排序");
            return;
        }
        List<JSONObject> ordered = new ArrayList<>();
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null) ordered.add(task);
        }
        JSONObject moved = ordered.remove(fromIndex);
        ordered.add(targetIndex, moved);
        JSONArray reordered = new JSONArray();
        for (JSONObject task : ordered) reordered.put(task);
        JSONObject owner = taskOwner(true);
        put(owner, "tasks", reordered);
        put(owner, "orderSaved", false);
        owner.remove("orderSavedAt");
        saveTaskData();
        renderAll();
    }

    private void moveTaskOneStep(int taskIndex, int direction) {
        JSONArray tasks = taskArray(false);
        JSONObject task = tasks.optJSONObject(taskIndex);
        if (task == null) return;
        String day = weekendKeyFor(currentDate) == null ? null : plannedDayForTask(task);
        List<Integer> group = new ArrayList<>();
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject candidate = tasks.optJSONObject(index);
            if (candidate != null && (day == null || day.equals(plannedDayForTask(candidate)))) group.add(index);
        }
        int position = group.indexOf(taskIndex);
        int nextPosition = position + direction;
        if (position < 0 || nextPosition < 0 || nextPosition >= group.size()) return;
        reorderTask(taskIndex, group.get(nextPosition));
    }

    private void renderTasks() {
        if (taskListContainer == null) return;
        String weekendKey = weekendKeyFor(currentDate);
        boolean weekendMode = weekendKey != null;
        boolean isFriday = weekendMode && currentDate.equals(weekendKey);
        boolean canEditList = !weekendMode || isFriday;
        JSONObject weekend = weekendMode ? weekendForDate(currentDate, false) : null;
        boolean planSaved = weekend != null && weekend.optBoolean("planSaved");
        JSONObject dailyRecord = currentRecord(false);
        boolean ledgerReady = weekendMode && !isFriday
                || dailyRecord != null && dailyRecord.optBoolean("ledgerConfirmed");
        JSONArray tasks = taskArray(false);
        boolean confirmed = taskListConfirmed();
        taskPanel.setVisibility(!ledgerReady && !confirmed && tasks.length() == 0 ? View.GONE : View.VISIBLE);
        if (!confirmed && canEditList && tasks.length() > 1) {
            tasks = sortedPendingTasks(tasks);
            put(taskOwner(true), "tasks", tasks);
        }
        int allDoneCount = 0;
        boolean allPending = true;
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && "done".equals(task.optString("status"))) allDoneCount++;
            if (task != null && !"pending".equals(task.optString("status", "pending"))) allPending = false;
        }

        boolean orderSaved = taskOrderSaved();
        boolean canArrangeOrder = confirmed && canEditList && allPending && (!weekendMode || planSaved);
        boolean sortingMode = canArrangeOrder && !orderSaved;
        boolean orderPendingWeekend = confirmed && weekendMode && !isFriday && planSaved && !orderSaved;
        boolean questMode = confirmed && orderSaved && (!weekendMode || planSaved);
        List<Integer> questIndexes = new ArrayList<>();
        if (!questMode || !weekendMode) {
            for (int index = 0; index < tasks.length(); index++) questIndexes.add(index);
        } else if (isFriday) {
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null && "friday".equals(plannedDayForTask(task))) questIndexes.add(index);
            }
        } else if (currentDate.equals(addDays(weekendKey, 1))) {
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null && "friday".equals(plannedDayForTask(task))
                        && (!"done".equals(task.optString("status"))
                        || currentDate.equals(task.optString("completedDate")))) questIndexes.add(index);
            }
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null && "saturday".equals(plannedDayForTask(task))) questIndexes.add(index);
            }
        } else {
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null && ("friday".equals(plannedDayForTask(task))
                        || "saturday".equals(plannedDayForTask(task)))
                        && (!"done".equals(task.optString("status"))
                        || currentDate.equals(task.optString("completedDate")))) questIndexes.add(index);
            }
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null && "sunday".equals(plannedDayForTask(task))) questIndexes.add(index);
            }
        }
        int questDoneCount = 0;
        for (int index : questIndexes) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && "done".equals(task.optString("status"))) questDoneCount++;
        }
        int progressTotal = questMode ? questIndexes.size() : tasks.length();
        int progressDone = questMode ? questDoneCount : allDoneCount;
        taskSummaryView.setText(!confirmed && tasks.length() > 0
                ? "已录 " + tasks.length() + " 项"
                : progressTotal == 0 ? "0 项"
                : questMode ? progressDone + " / " + progressTotal
                : progressDone + " / " + progressTotal + " 项完成");
        taskPanelTitleView.setText(!confirmed
                ? ledgerReady ? "" : "先核对今天的作业"
                : sortingMode ? ""
                : orderPendingWeekend ? "还差一步：确定顺序"
                : "作业清单");
        taskPanelHelpView.setText(!confirmed
                ? ledgerReady ? "" : "核对钉钉，并把新增作业补到成长记录册。"
                : sortingMode ? ""
                : orderPendingWeekend ? "请回到周五排好顺序，再开始周末作业。"
                : "");
        taskPanelTitleView.setVisibility(questMode || sortingMode || (!confirmed && ledgerReady) ? View.GONE : View.VISIBLE);
        taskPanelHelpView.setVisibility(questMode || taskPanelHelpView.getText().length() == 0 ? View.GONE : View.VISIBLE);
        boolean canEnterTasks = !confirmed && canEditList && ledgerReady;
        taskEntryLauncher.setVisibility(canEnterTasks ? View.VISIBLE : View.GONE);
        taskEntryPanel.setVisibility(canEnterTasks ? View.VISIBLE : View.GONE);
        String entryStatus = tasks.length() > 0
                ? "已录入 " + tasks.length() + " 项，可继续补充其他科目"
                : "选择科目，语音或文字录入";
        taskEntryLauncherStatus.setText(entryStatus);
        if (!canEnterTasks) dismissTaskEntryDialog();
        taskEntryComposerPanel.setVisibility(canEnterTasks ? View.VISIBLE : View.GONE);
        ViewGroup.LayoutParams composerLayout = taskEntryComposerPanel.getLayoutParams();
        if (composerLayout instanceof LinearLayout.LayoutParams) {
            ((LinearLayout.LayoutParams) composerLayout).topMargin = tasks.length() > 0 ? dp(12) : 0;
            taskEntryComposerPanel.setLayoutParams(composerLayout);
        }
        boolean canUndoDelete = lastDeletedTask != null && currentDate.equals(lastDeletedTaskDate)
                && !confirmed && canEditList;
        taskEntryUndoDeleteButton.setVisibility(canUndoDelete ? View.VISIBLE : View.GONE);
        boolean showTaskEntryEmpty = canEnterTasks && tasks.length() == 0;
        taskEntryScrollView.setVisibility(showTaskEntryEmpty ? View.GONE : View.VISIBLE);
        taskEntryEmptyPanel.setVisibility(showTaskEntryEmpty ? View.VISIBLE : View.GONE);
        taskEntryPendingPanel.setVisibility(canEnterTasks && tasks.length() > 0 ? View.VISIBLE : View.GONE);
        taskEntryPendingSummary.setText(tasks.length() + " 项");
        taskEntryPendingList.removeAllViews();
        if (!confirmed) renderPendingTaskGroups(tasks);
        if (taskEntryConfirmButton != null) {
            taskEntryConfirmButton.setVisibility(canEnterTasks && tasks.length() > 0 ? View.VISIBLE : View.GONE);
            taskEntryConfirmButton.setText("都录好了，去排顺序");
        }
        emptyTaskView.setVisibility(tasks.length() == 0 && !canEnterTasks ? View.VISIBLE : View.GONE);
        emptyTaskView.setText(weekendMode && !isFriday
                ? "周五还没有录入作业清单，请回到周五完成录入和安排。"
                : ledgerReady ? "还没有作业，点击“录入作业”开始。"
                : "核对钉钉并补全成长记录册后，再录入作业。");
        taskConfirmButton.setVisibility(confirmed && canEditList && allPending ? View.VISIBLE : View.GONE);
        taskConfirmButton.setText("修改作业清单");
        taskOrderButton.setVisibility(canArrangeOrder ? View.VISIBLE : View.GONE);
        taskOrderButton.setText(sortingMode ? "确定顺序，开始闯关" : "调整闯关顺序");
        taskOrderButton.setTextColor(sortingMode ? Color.WHITE : GREEN);
        taskOrderButton.setBackground(rounded(sortingMode ? GREEN : GREEN_SOFT, 13,
                sortingMode ? GREEN : Color.rgb(156, 188, 245), sortingMode ? 0 : 1));
        String taskConfirmHint = sortingMode
                ? weekendMode ? "分别排好周五、周六、周日的顺序，确定后就按计划闯关。"
                    : "长按拖动作业，或使用箭头排好顺序，再确定开始。"
                : orderPendingWeekend ? "周末顺序还没有确定，请回到周五完成最后一步。"
                : weekendMode && isFriday && orderSaved ? "周末完成日期和三天顺序都安排好了。"
                : !canEditList
                ? planSaved ? "清单来自周五，按计划日期逐项完成。" : "请先回到周五保存周末安排。"
                : !ledgerReady ? "第 1 步：核对钉钉，补全成长记录册。"
                : confirmed
                ? allDoneCount == tasks.length() && tasks.length() > 0
                    ? weekendMode ? "周末清单已全部完成并自动结算。"
                    : dailyRecord != null && hasText(dailyRecord, "finishTime")
                        ? "最后一项完成时已自动结算。" : "清单已完成，补全成长记录册后自动结算。"
                    : weekendMode ? "清单已确认；点击下方“周五安排与闯关”，给每项作业选择完成日。" : ""
                : tasks.length() > 0 ? "核对无误后再确认清单。" : "点击“录入作业”添加完整清单。";
        taskConfirmHintView.setText(taskConfirmHint);
        taskConfirmHintView.setVisibility(confirmed && !taskConfirmHint.isEmpty() ? View.VISIBLE : View.GONE);

        Result settlement = weekendMode ? null : resultFor(dailyRecord);
        taskSettlementPanel.setVisibility(settlement == null ? View.GONE : View.VISIBLE);
        if (settlement != null) {
            taskSettlementLabel.setText(settlement.label);
            taskSettlementAmount.setText(amountText(settlement.amount));
            taskSettlementAmount.setTextColor(amountColor(settlement.amount));
            int settlementFill = settlement.amount < 0 ? RED_SOFT : settlement.amount == 0 ? AMBER_SOFT : GREEN_SOFT;
            taskSettlementPanel.setBackground(rounded(settlementFill, 12, settlementFill, 0));
        }

        JSONObject active = activeTask(false);
        activeTaskPanel.setVisibility(active == null || questMode ? View.GONE : View.VISIBLE);
        if (active != null) {
            activeTaskTitleView.setText(active.optString("subject", "其他") + " · " + active.optString("title", ""));
            activeTaskTimeView.setText("已专注 " + taskDurationLabel(active));
        }

        taskQuestProgressPanel.setVisibility(questMode ? View.VISIBLE : View.GONE);
        if (questMode) {
            int progress = progressTotal == 0 ? 100 : Math.round(progressDone * 100f / progressTotal);
            taskQuestProgressBar.setProgress(progress);
            JSONObject owner = taskOwner(false);
            int currentTaskIndex = -1;
            for (int taskIndex : questIndexes) {
                JSONObject candidate = tasks.optJSONObject(taskIndex);
                if (candidate != null && !"done".equals(candidate.optString("status"))) {
                    currentTaskIndex = taskIndex;
                    if ("active".equals(candidate.optString("status"))) break;
                }
            }
            int mealBoundaryIndex = -1;
            String mealAfterId = owner == null ? "" : owner.optString("mealAfterTaskId");
            for (int taskIndex = 0; taskIndex < tasks.length(); taskIndex++) {
                JSONObject candidate = tasks.optJSONObject(taskIndex);
                if (candidate != null && candidate.optString("id").equals(mealAfterId)) {
                    mealBoundaryIndex = taskIndex;
                    break;
                }
            }
            String phase = mealBoundaryIndex >= 0 && currentTaskIndex >= 0
                    ? currentTaskIndex <= mealBoundaryIndex ? "饭前计划" : "饭后计划"
                    : "今日计划";
            taskQuestTimeRow.setVisibility(progress == 100 ? View.GONE : View.VISIBLE);
            taskQuestPhaseView.setText(phase);
            taskQuestMessageView.setText("预计还需 "
                    + remainingEstimatedMinutes(tasks, questIndexes) + " 分钟");
        }

        taskListContainer.removeAllViews();
        if (!confirmed) return;
        if (sortingMode) {
            taskSummaryView.setText(tasks.length() + " 关待安排");
            addOrderIntro(tasks, weekendMode);
            if (weekendMode) {
                addSortableTaskGroup(tasks, "friday", "周五闯关顺序", "放学后先完成这一部分");
                addSortableTaskGroup(tasks, "saturday", "周六闯关顺序", "完成周六计划");
                addSortableTaskGroup(tasks, "sunday", "周日闯关顺序", "周日按这个顺序完成");
            } else {
                addSortableTaskGroup(tasks, null, null, null);
            }
            return;
        }
        if (!questMode) {
            int suggestedTaskIndex = -1;
            if (confirmed && active == null) {
                for (int index = 0; index < tasks.length(); index++) {
                    JSONObject candidate = tasks.optJSONObject(index);
                    if (candidate == null || !"pending".equals(candidate.optString("status", "pending"))) continue;
                    String candidateDay = plannedDayForTask(candidate);
                    boolean canStart = !weekendMode || planSaved
                            && (isFriday ? "friday".equals(candidateDay)
                            : currentDate.equals(addDays(weekendKey, 1)) ? !"sunday".equals(candidateDay) : true);
                    if (canStart) { suggestedTaskIndex = index; break; }
                }
            }
            for (int index = 0; index < tasks.length(); index++) {
                addTaskCard(tasks, index, confirmed, canEditList, weekendMode, isFriday,
                        planSaved, weekendKey, index == suggestedTaskIndex, false, false, !orderPendingWeekend);
            }
            return;
        }

        List<Integer> remainingIndexes = new ArrayList<>();
        List<Integer> doneIndexes = new ArrayList<>();
        int currentIndex = -1;
        for (int index : questIndexes) {
            JSONObject task = tasks.optJSONObject(index);
            if (task == null) continue;
            if ("done".equals(task.optString("status"))) doneIndexes.add(index);
            else {
                remainingIndexes.add(index);
                if ("active".equals(task.optString("status"))) currentIndex = index;
            }
        }
        if (currentIndex < 0) {
            for (int index : remainingIndexes) {
                if ("paused".equals(tasks.optJSONObject(index).optString("status"))) { currentIndex = index; break; }
            }
        }
        if (currentIndex < 0 && !remainingIndexes.isEmpty()) currentIndex = remainingIndexes.get(0);

        if (remainingIndexes.isEmpty()) {
            addQuestVictory();
        } else {
            addTaskCard(tasks, currentIndex, true, canEditList, weekendMode, isFriday,
                    planSaved, weekendKey, true, true, false, true);
            List<Integer> upcoming = new ArrayList<>();
            List<Integer> later = new ArrayList<>();
            for (int index : remainingIndexes) {
                if (index == currentIndex) continue;
                if (upcoming.size() < 2) upcoming.add(index); else later.add(index);
            }
            if (!upcoming.isEmpty()) {
                for (int index : upcoming) addTaskCard(tasks, index, true, canEditList, weekendMode,
                        isFriday, planSaved, weekendKey, false, false, true, false);
            }
            if (!later.isEmpty()) {
                addQuestToggle(taskListExpanded ? "收起后面的作业  ⌃" : "稍后还有 " + later.size() + " 项  ⌄", false);
                if (taskListExpanded) {
                    for (int index : later) addTaskCard(tasks, index, true, canEditList, weekendMode,
                            isFriday, planSaved, weekendKey, false, false, true, false);
                }
            }
        }
        if (!doneIndexes.isEmpty()) {
            addQuestToggle(completedTasksExpanded ? "收起已完成作业  ⌃" : "✅ 已闯过 " + doneIndexes.size() + " 关  ⌄", true);
            if (completedTasksExpanded) {
                for (int index : doneIndexes) addTaskCard(tasks, index, true, canEditList, weekendMode,
                        isFriday, planSaved, weekendKey, false, false, true, true);
            }
        }
    }

    private void addOrderIntro(JSONArray tasks, boolean weekendMode) {
        int totalEstimate = 0;
        for (int index = 0; index < tasks.length(); index++) {
            totalEstimate += estimatedMinutes(tasks.optJSONObject(index));
        }
        int breakPoints = taskBreakPointCount(tasks);
        String detail = "预计净学习 " + totalEstimate + " 分钟。排好顺序，设置预计用时和最多两个休息点"
                + (weekendMode ? "。" : "，也可以选择饭前完成到哪一项。")
                + "  已设 " + breakPoints + " / 2 个休息点";
        TextView intro = text(detail, 10,
                Color.rgb(83, 115, 166), true);
        intro.setPadding(dp(12), dp(10), dp(12), dp(10));
        intro.setBackground(rounded(Color.rgb(243, 247, 255), 13, Color.rgb(156, 188, 245), 1));
        taskListContainer.addView(intro, matchWrap());
    }

    private void addSortableTaskGroup(JSONArray tasks, String plannedDay, String label, String help) {
        List<Integer> indexes = new ArrayList<>();
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && (plannedDay == null || plannedDay.equals(plannedDayForTask(task)))) indexes.add(index);
        }
        if (indexes.isEmpty()) return;
        if (label != null) {
            LinearLayout heading = vertical();
            heading.addView(text(label, 11, Color.rgb(52, 95, 186), true));
            TextView hint = text(help, 9, MUTED, false);
            hint.setPadding(0, dp(2), 0, 0);
            heading.addView(hint);
            LinearLayout.LayoutParams headingParams = matchWrap();
            headingParams.topMargin = dp(10);
            taskListContainer.addView(heading, headingParams);
        }
        for (int position = 0; position < indexes.size(); position++) {
            addSortableTaskCard(tasks, indexes.get(position), position + 1,
                    position > 0, position < indexes.size() - 1);
        }
    }

    private void addSortableTaskCard(JSONArray tasks, int taskIndex, int orderNumber,
                                     boolean canMoveUp, boolean canMoveDown) {
        JSONObject task = tasks.optJSONObject(taskIndex);
        if (task == null) return;
        String subjectName = task.optString("subject", "其他");
        int subjectColor = taskSubjectColor(subjectName);
        LinearLayout wrapper = vertical();
        LinearLayout item = horizontal();
        item.setGravity(Gravity.CENTER_VERTICAL);
        item.setPadding(dp(10), dp(10), dp(10), dp(10));
        item.setBackground(rounded(taskSubjectSoftColor(subjectName), 13, subjectColor, 1));

        TextView handle = text("⠿", 20, Color.rgb(120, 144, 185), true);
        handle.setGravity(Gravity.CENTER);
        item.addView(handle, fixed(dp(25), dp(34)));
        TextView number = text(String.valueOf(orderNumber), 10, Color.WHITE, true);
        number.setGravity(Gravity.CENTER);
        number.setBackground(rounded(subjectColor, 20, subjectColor, 0));
        item.addView(number, fixed(dp(27), dp(27)));
        item.addView(spaceHorizontal(9));

        LinearLayout copy = vertical();
        String planLabel = weekendKeyFor(currentDate) == null ? "" : "  [" + plannedDayLabel(task) + "]";
        copy.addView(text(subjectName + " · " + task.optString("title", "未命名作业") + planLabel,
                12, INK, true));
        TextView meta = text("预计 " + estimatedMinutes(task) + " 分钟", 9, MUTED, false);
        meta.setPadding(0, dp(3), 0, 0);
        copy.addView(meta);
        item.addView(copy, weightedWrap(1));

        LinearLayout arrows = horizontal();
        arrows.addView(orderArrowButton("↑", canMoveUp, () -> moveTaskOneStep(taskIndex, -1)), fixed(dp(38), dp(34)));
        arrows.addView(spaceHorizontal(4));
        arrows.addView(orderArrowButton("↓", canMoveDown, () -> moveTaskOneStep(taskIndex, 1)), fixed(dp(38), dp(34)));
        item.addView(spaceHorizontal(6));
        item.addView(arrows, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        item.setOnLongClickListener(v -> {
            ClipData data = ClipData.newPlainText("homework-task-index", String.valueOf(taskIndex));
            View.DragShadowBuilder shadow = new View.DragShadowBuilder(v);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) v.startDragAndDrop(data, shadow, null, 0);
            else v.startDrag(data, shadow, null, 0);
            return true;
        });
        item.setOnDragListener((v, event) -> {
            if (event.getAction() == DragEvent.ACTION_DRAG_STARTED) return true;
            if (event.getAction() == DragEvent.ACTION_DRAG_ENTERED) {
                v.setAlpha(0.62f);
                return true;
            }
            if (event.getAction() == DragEvent.ACTION_DRAG_EXITED) {
                v.setAlpha(1f);
                return true;
            }
            if (event.getAction() == DragEvent.ACTION_DROP) {
                v.setAlpha(1f);
                try {
                    int fromIndex = Integer.parseInt(event.getClipData().getItemAt(0).getText().toString());
                    reorderTask(fromIndex, taskIndex);
                } catch (Exception ignored) { }
                return true;
            }
            if (event.getAction() == DragEvent.ACTION_DRAG_ENDED) {
                v.setAlpha(1f);
                return true;
            }
            return true;
        });
        wrapper.addView(item, matchWrap());

        LinearLayout tools = horizontal();
        Button estimate = smallButton("预计 " + estimatedMinutes(task) + " 分钟");
        estimate.setTextSize(10);
        estimate.setOnClickListener(v -> showEstimatePicker(task));
        tools.addView(estimate, weightedFixed(1, dp(38)));
        if (weekendKeyFor(currentDate) == null) {
            tools.addView(spaceHorizontal(6));
            JSONObject owner = taskOwner(false);
            boolean selected = owner != null && task.optString("id")
                    .equals(owner.optString("mealAfterTaskId"));
            Button meal = smallButton(selected ? "✓ 饭前到这里" : "饭前到这里");
            meal.setTextSize(10);
            meal.setTextColor(selected ? Color.rgb(139, 100, 27) : GREEN);
            meal.setBackground(rounded(selected ? Color.rgb(255, 245, 216) : SURFACE,
                    11, selected ? Color.rgb(223, 175, 76) : LINE, 1));
            meal.setOnClickListener(v -> toggleMealAfterTask(task));
            tools.addView(meal, weightedFixed(1, dp(38)));
        }
        LinearLayout.LayoutParams toolsParams = matchWrap();
        toolsParams.topMargin = dp(7);
        wrapper.addView(tools, toolsParams);

        boolean breakSelected = task.optBoolean("breakAfter");
        Button breakPoint = smallButton(breakSelected ? "✓ 完成这项后休息" : "☕ 设为休息点（最多2个）");
        breakPoint.setTextSize(10);
        breakPoint.setTextColor(breakSelected ? Color.rgb(69, 107, 168) : GREEN);
        breakPoint.setBackground(rounded(breakSelected ? Color.rgb(238, 245, 255) : SURFACE,
                11, breakSelected ? Color.rgb(116, 159, 235) : LINE, 1));
        breakPoint.setOnClickListener(v -> toggleTaskBreakPoint(task));
        LinearLayout.LayoutParams breakPointParams = matchFixed(dp(38));
        breakPointParams.topMargin = dp(6);
        wrapper.addView(breakPoint, breakPointParams);

        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(8);
        taskListContainer.addView(wrapper, params);
        if (breakSelected) {
            TextView breakDivider = text("☕  我的休息点    完成上面这项后安排休息", 10,
                    Color.rgb(69, 107, 168), true);
            breakDivider.setPadding(dp(11), dp(8), dp(11), dp(8));
            breakDivider.setBackground(rounded(Color.rgb(244, 248, 255), 10,
                    Color.rgb(156, 188, 245), 1));
            LinearLayout.LayoutParams breakDividerParams = matchWrap();
            breakDividerParams.topMargin = dp(5);
            taskListContainer.addView(breakDivider, breakDividerParams);
        }
        JSONObject owner = taskOwner(false);
        if (weekendKeyFor(currentDate) == null && owner != null
                && task.optString("id").equals(owner.optString("mealAfterTaskId"))) {
            TextView divider = text("🍚  吃饭    饭后从下一项继续", 10, Color.rgb(133, 99, 38), true);
            divider.setPadding(dp(11), dp(8), dp(11), dp(8));
            divider.setBackground(rounded(Color.rgb(255, 250, 240), 10,
                    Color.rgb(224, 189, 112), 1));
            LinearLayout.LayoutParams dividerParams = matchWrap();
            dividerParams.topMargin = dp(5);
            taskListContainer.addView(divider, dividerParams);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        if (requestCode == EXPORT_BACKUP_REQUEST) {
            writeBackup(uri);
        } else if (requestCode == IMPORT_BACKUP_REQUEST) {
            readBackup(uri);
        }
    }

    private void showEstimatePicker(JSONObject task) {
        String[] labels = new String[ESTIMATE_OPTIONS.length];
        for (int index = 0; index < ESTIMATE_OPTIONS.length; index++) {
            labels[index] = ESTIMATE_OPTIONS[index] + " 分钟";
        }
        new AlertDialog.Builder(this)
                .setTitle("这项作业预计多久？")
                .setItems(labels, (dialog, which) -> {
                    put(task, "estimatedMinutes", ESTIMATE_OPTIONS[which]);
                    JSONObject owner = taskOwner(true);
                    owner.remove("orderSaved");
                    owner.remove("orderSavedAt");
                    saveTaskData();
                    renderTasks();
                })
                .setNegativeButton("取消", null)
                .show();
    }

    private void toggleMealAfterTask(JSONObject task) {
        if (weekendKeyFor(currentDate) != null) return;
        JSONObject owner = taskOwner(true);
        String taskId = task.optString("id");
        if (taskId.equals(owner.optString("mealAfterTaskId"))) owner.remove("mealAfterTaskId");
        else put(owner, "mealAfterTaskId", taskId);
        owner.remove("orderSaved");
        owner.remove("orderSavedAt");
        saveTaskData();
        renderTasks();
    }

    private int taskBreakPointCount(JSONArray tasks) {
        int count = 0;
        if (tasks == null) return count;
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && task.optBoolean("breakAfter")) count++;
        }
        return count;
    }

    private void toggleTaskBreakPoint(JSONObject task) {
        JSONArray tasks = taskArray(false);
        boolean selected = task.optBoolean("breakAfter");
        if (!selected && taskBreakPointCount(tasks) >= 2) {
            toast("最多设置两个休息点");
            return;
        }
        put(task, "breakAfter", !selected);
        JSONObject owner = taskOwner(true);
        owner.remove("orderSaved");
        owner.remove("orderSavedAt");
        saveTaskData();
        renderTasks();
        toast(selected ? "已取消这个休息点" : "这里已设为休息点");
    }

    private void showTaskEditDialog(JSONObject task) {
        if (task == null || !"pending".equals(task.optString("status", "pending")) || !taskOrderSaved()) {
            toast("排好顺序后，才能从卡片修改作业");
            return;
        }
        String taskId = task.optString("id");
        EditText titleInput = new EditText(this);
        titleInput.setText(task.optString("title"));
        titleInput.setTextSize(14);
        titleInput.setTextColor(INK);
        titleInput.setGravity(Gravity.TOP | Gravity.START);
        titleInput.setMinLines(2);
        titleInput.setMaxLines(3);
        titleInput.setFilters(new InputFilter[]{new InputFilter.LengthFilter(120)});
        titleInput.setPadding(dp(12), dp(9), dp(12), dp(9));
        titleInput.setBackground(rounded(Color.WHITE, 11, LINE, 1));

        int[] selectedEstimate = {estimatedMinutes(task)};
        LinearLayout estimateOptions = vertical();
        LinearLayout estimateRow = null;
        Button[] estimateButtons = new Button[ESTIMATE_OPTIONS.length];
        for (int index = 0; index < ESTIMATE_OPTIONS.length; index++) {
            if (index % 5 == 0) {
                estimateRow = horizontal();
                LinearLayout.LayoutParams rowParams = matchFixed(dp(44));
                if (index > 0) rowParams.topMargin = dp(6);
                estimateOptions.addView(estimateRow, rowParams);
            }
            final int optionIndex = index;
            Button option = smallButton(ESTIMATE_OPTIONS[index] + " 分");
            option.setTextSize(10);
            option.setMinWidth(0);
            option.setMinimumWidth(0);
            option.setPadding(dp(2), 0, dp(2), 0);
            option.setOnClickListener(v -> {
                selectedEstimate[0] = ESTIMATE_OPTIONS[optionIndex];
                for (int buttonIndex = 0; buttonIndex < estimateButtons.length; buttonIndex++) {
                    Button candidate = estimateButtons[buttonIndex];
                    if (candidate == null) continue;
                    boolean selected = ESTIMATE_OPTIONS[buttonIndex] == selectedEstimate[0];
                    candidate.setTextColor(selected ? Color.WHITE : GREEN);
                    candidate.setBackground(rounded(selected ? GREEN : SURFACE, 10,
                            selected ? GREEN : LINE, selected ? 0 : 1));
                }
            });
            boolean selected = ESTIMATE_OPTIONS[index] == selectedEstimate[0];
            option.setTextColor(selected ? Color.WHITE : GREEN);
            option.setBackground(rounded(selected ? GREEN : SURFACE, 10,
                    selected ? GREEN : LINE, selected ? 0 : 1));
            estimateButtons[index] = option;
            if (index % 5 > 0) estimateRow.addView(spaceHorizontal(5));
            estimateRow.addView(option, weightedFixed(1, dp(44)));
        }

        LinearLayout content = vertical();
        content.setPadding(dp(20), dp(4), dp(20), dp(4));
        content.addView(text("作业内容", 10, INK, true));
        LinearLayout.LayoutParams titleParams = matchWrap();
        titleParams.topMargin = dp(6);
        content.addView(titleInput, titleParams);
        TextView estimateLabel = text("预计用时", 10, INK, true);
        estimateLabel.setPadding(0, dp(14), 0, dp(6));
        content.addView(estimateLabel);
        content.addView(estimateOptions, matchWrap());
        ScrollView scroll = new ScrollView(this);
        scroll.addView(content, matchWrap());

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("修改" + task.optString("subject", "") + "作业")
                .setView(scroll)
                .setNegativeButton("取消", null)
                .setPositiveButton("保存修改", null)
                .create();
        dialog.setOnShowListener(ignored -> {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                String title = titleInput.getText().toString().trim();
                if (title.isEmpty()) {
                    titleInput.setError("作业内容不能留空");
                    titleInput.requestFocus();
                    return;
                }
                int currentIndex = taskIndexById(taskId);
                JSONObject currentTask = taskArray(false).optJSONObject(currentIndex);
                if (currentTask == null || !"pending".equals(currentTask.optString("status", "pending"))) {
                    dialog.dismiss();
                    toast("这项作业已经不能修改");
                    return;
                }
                put(currentTask, "title", title);
                put(currentTask, "estimatedMinutes", selectedEstimate[0]);
                currentTask.remove("steps");
                saveTaskData();
                renderAll();
                dialog.dismiss();
                toast("这项作业修改好了");
            });
            titleInput.requestFocus();
        });
        dialog.show();
    }

    private Button orderArrowButton(String label, boolean enabled, Runnable action) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(13);
        button.setTextColor(Color.rgb(83, 115, 166));
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setAllCaps(false);
        button.setMinWidth(0);
        button.setMinimumWidth(0);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setPadding(0, 0, 0, 0);
        button.setEnabled(enabled);
        button.setAlpha(enabled ? 1f : 0.28f);
        button.setBackground(rounded(Color.WHITE, 16, LINE, 1));
        button.setOnClickListener(v -> action.run());
        return button;
    }

    private void addQuestSection(String titleValue, String hintValue) {
        LinearLayout section = vertical();
        TextView title = text(titleValue, 11, Color.rgb(52, 95, 186), true);
        section.addView(title);
        TextView hint = text(hintValue, 9, MUTED, false);
        hint.setPadding(0, dp(2), 0, 0);
        section.addView(hint);
        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(11);
        taskListContainer.addView(section, params);
    }

    private void addQuestToggle(String label, boolean completedToggle) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(11);
        button.setTextColor(completedToggle ? Color.rgb(56, 123, 104) : Color.rgb(99, 120, 156));
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setAllCaps(false);
        int fill = completedToggle ? Color.rgb(240, 251, 247) : Color.rgb(247, 250, 255);
        int stroke = completedToggle ? Color.rgb(183, 223, 208) : Color.rgb(185, 203, 237);
        button.setBackground(rounded(fill, 12, stroke, 1));
        button.setOnClickListener(v -> {
            if (completedToggle) completedTasksExpanded = !completedTasksExpanded;
            else taskListExpanded = !taskListExpanded;
            renderTasks();
        });
        LinearLayout.LayoutParams params = matchFixed(dp(42));
        params.topMargin = dp(8);
        taskListContainer.addView(button, params);
    }

    private void addQuestVictory() {
        LinearLayout victory = vertical();
        victory.setGravity(Gravity.CENTER);
        victory.setPadding(dp(14), dp(19), dp(14), dp(19));
        victory.setBackground(rounded(Color.rgb(255, 248, 217), 18, Color.rgb(240, 212, 124), 1));
        TextView icon = text("🎉", 32, INK, false);
        icon.setGravity(Gravity.CENTER);
        victory.addView(icon);
        TextView title = text("我全部通关啦！", 16, Color.rgb(114, 83, 28), true);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(5), 0, 0);
        victory.addView(title);
        TextView detail = text("看起来很多的作业，也被我一项一项完成啦。", 10, MUTED, false);
        detail.setGravity(Gravity.CENTER);
        detail.setPadding(0, dp(5), 0, 0);
        victory.addView(detail);
        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(8);
        taskListContainer.addView(victory, params);
    }

    private void renderPendingTaskGroups(JSONArray tasks) {
        String currentSubject = null;
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task == null) continue;
            String subject = task.optString("subject", "其他");
            if (!subject.equals(currentSubject)) {
                currentSubject = subject;
                int count = 0;
                for (int scan = index; scan < tasks.length(); scan++) {
                    JSONObject candidate = tasks.optJSONObject(scan);
                    if (candidate != null && subject.equals(candidate.optString("subject", "其他"))) count++;
                }
                TextView heading = text(subject + "  " + count + " 项", 11, taskSubjectColor(subject), true);
                heading.setPadding(dp(2), dp(index == 0 ? 5 : 11), dp(2), dp(2));
                taskEntryPendingList.addView(heading, matchWrap());
            }
            addPendingTaskRow(tasks, index);
        }
    }

    private void addPendingTaskRow(JSONArray tasks, int index) {
        JSONObject task = tasks.optJSONObject(index);
        if (task == null) return;
        String subject = task.optString("subject", "其他");
        LinearLayout row = horizontal();
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(11), dp(6), dp(7), dp(6));
        row.setBackground(rounded(taskSubjectSoftColor(subject), 10, taskSubjectColor(subject), 1));
        TextView title = text(task.optString("title", "未命名作业"), 12, INK, true);
        row.addView(title, weightedWrap(1));
        row.addView(spaceHorizontal(6));
        LinearLayout actions = horizontal();
        final int taskIndex = index;
        addTaskActionButton(actions, "修改", false, false, () -> showPendingTaskEditDialog(taskIndex));
        addTaskActionButton(actions, "删除", false, true, () -> performTaskAction("delete", taskIndex));
        row.addView(actions, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(5);
        taskEntryPendingList.addView(row, params);
    }

    private void showPendingTaskEditDialog(int index) {
        JSONArray tasks = taskArray(false);
        JSONObject task = tasks.optJSONObject(index);
        if (task == null || taskListConfirmed()) return;
        String taskId = task.optString("id");
        EditText input = new EditText(this);
        input.setSingleLine(false);
        input.setMaxLines(3);
        input.setText(task.optString("title"));
        input.setTextSize(14);
        input.setTextColor(INK);
        input.setSelectAllOnFocus(true);
        input.setPadding(dp(12), dp(9), dp(12), dp(9));
        input.setBackground(rounded(Color.WHITE, 11, LINE, 1));
        LinearLayout content = vertical();
        content.setPadding(dp(20), dp(4), dp(20), 0);
        content.addView(input, matchWrap());
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("修改" + task.optString("subject", "") + "作业")
                .setView(content)
                .setNegativeButton("取消", null)
                .setPositiveButton("保存", null)
                .create();
        dialog.setOnShowListener(ignored -> {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                String title = input.getText().toString().trim();
                if (title.isEmpty()) {
                    input.setError("作业内容不能留空");
                    input.requestFocus();
                    return;
                }
                int currentIndex = taskIndexById(taskId);
                JSONObject currentTask = taskArray(false).optJSONObject(currentIndex);
                if (currentTask == null) {
                    dialog.dismiss();
                    return;
                }
                put(currentTask, "title", title);
                saveTaskData();
                renderAll();
                dialog.dismiss();
                toast("这项作业已经改好了");
            });
            input.requestFocus();
            if (dialog.getWindow() != null) dialog.getWindow().setSoftInputMode(
                    android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
        });
        dialog.show();
    }

    private void undoLastDeletedTask() {
        if (lastDeletedTask == null || !currentDate.equals(lastDeletedTaskDate) || taskListConfirmed()) return;
        JSONObject owner = taskOwner(true);
        JSONArray tasks = owner.optJSONArray("tasks");
        if (tasks == null) tasks = new JSONArray();
        tasks.put(lastDeletedTask);
        put(owner, "tasks", sortedPendingTasks(tasks));
        timerHandler.removeCallbacks(clearDeletedTaskUndo);
        lastDeletedTask = null;
        lastDeletedTaskDate = null;
        saveTaskData();
        renderAll();
        toast("刚才删除的作业回来了");
    }

    private void addTaskCard(JSONArray tasks, int index, boolean confirmed, boolean canEditList,
                             boolean weekendMode, boolean isFriday, boolean planSaved, String weekendKey,
                             boolean suggested, boolean current, boolean compact, boolean allowActions) {
        addTaskCard(taskListContainer, tasks, index, confirmed, canEditList, weekendMode, isFriday,
                planSaved, weekendKey, suggested, current, compact, allowActions);
    }

    private void addTaskCard(LinearLayout target, JSONArray tasks, int index, boolean confirmed, boolean canEditList,
                             boolean weekendMode, boolean isFriday, boolean planSaved, String weekendKey,
                             boolean suggested, boolean current, boolean compact, boolean allowActions) {
        JSONObject task = tasks.optJSONObject(index);
        if (task == null) return;
        final int taskIndex = index;
        String status = task.optString("status", "pending");
        boolean editable = "pending".equals(status) && taskOrderSaved();
        String taskDay = plannedDayForTask(task);
        boolean canDoToday = !weekendMode || planSaved
                && (isFriday ? "friday".equals(taskDay)
                : currentDate.equals(addDays(weekendKey, 1)) ? !"sunday".equals(taskDay) : true);
        boolean plannedToday = weekendMode && currentDate.equals(plannedDateForTask(weekendKey, task));
        LinearLayout item = vertical();
        item.setPadding(dp(compact ? 10 : current ? 14 : 12), dp(compact ? 9 : current ? 13 : 11),
                dp(compact ? 10 : current ? 14 : 12), dp(compact ? 9 : current ? 13 : 11));
        String subjectName = task.optString("subject", "其他");
        int subjectColor = taskSubjectColor(subjectName);
        int fill = taskSubjectSoftColor(subjectName);
        int stroke = current || "active".equals(status) ? GREEN : plannedToday ? AMBER : subjectColor;
        item.setBackground(rounded(fill, current ? 15 : 13, stroke, current ? 2 : 1));
        String planLabel = weekendMode && planSaved ? "  [" + plannedDayLabel(task) + "]" : "";
        LinearLayout mainRow = horizontal();
        mainRow.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout taskCopy = vertical();
        LinearLayout titleRow = horizontal();
        titleRow.setGravity(Gravity.CENTER_VERTICAL);
        TextView subjectBadge = text(subjectName, compact ? 9 : 10, Color.WHITE, true);
        subjectBadge.setPadding(dp(8), dp(3), dp(8), dp(3));
        subjectBadge.setBackground(rounded(subjectColor, 16, subjectColor, 0));
        titleRow.addView(subjectBadge);
        titleRow.addView(spaceHorizontal(7));
        TextView title = text(task.optString("title", "未命名作业") + planLabel, compact ? 12 : current ? 14 : 13, INK, true);
        if ("done".equals(status)) title.setAlpha(0.6f);
        titleRow.addView(title, weightedWrap(1));
        if (editable) titleRow.addView(text("✎", 11, Color.rgb(111, 143, 200), true));
        taskCopy.addView(titleRow, matchWrap());
        String estimateLabel = "预计 " + estimatedMinutes(task) + " 分钟";
        String meta = estimateLabel;
        if ("active".equals(status)) meta = estimateLabel + " · 已用 " + taskDurationLabel(task);
        else if ("paused".equals(status)) meta = estimateLabel + " · 已用 " + taskDurationLabel(task);
        else if ("done".equals(status)) meta = (hasText(task, "completedDate") ? formatShortDate(task.optString("completedDate")) + " " : "")
                + task.optString("completedAt", "已") + " 完成 · " + estimateLabel
                + " · 实际 " + taskActualMinutes(task) + " 分钟";
        else if (weekendMode && planSaved && !canDoToday) meta = "计划" + plannedDayLabel(task) + "完成 · " + estimateLabel;
        if (task.optBoolean("breakAfter") && !"done".equals(status)) meta += " · ☕ 完成后休息";
        TextView metaView = text(meta, compact ? 9 : 10, MUTED, false);
        metaView.setPadding(0, dp(compact ? 3 : 4), 0, 0);
        taskCopy.addView(metaView);
        mainRow.addView(taskCopy, weightedWrap(1));
        LinearLayout actions = horizontal();
        if (!confirmed && canEditList) {
            String deleteLabel = target == taskEntryPendingList ? "删除作业" : "删除";
            addTaskActionButton(actions, deleteLabel, false, true,
                    () -> performTaskAction("delete", taskIndex));
        } else if (confirmed && canDoToday && allowActions && "active".equals(status)) {
            addTaskActionButton(actions, "休息一下", false, false, () -> performTaskAction("pause", taskIndex));
            addTaskActionButton(actions, "完成", true, false, () -> performTaskAction("complete", taskIndex));
        } else if (confirmed && canDoToday && allowActions && "paused".equals(status)) {
            addTaskActionButton(actions, "继续", true, false, () -> performTaskAction("start", taskIndex));
            addTaskActionButton(actions, "完成", false, false, () -> performTaskAction("complete", taskIndex));
        } else if (confirmed && canDoToday && allowActions && "done".equals(status)) {
            addTaskActionButton(actions, "撤销完成", false, false, () -> performTaskAction("undo", taskIndex));
        } else if (confirmed && canDoToday && allowActions) {
            addTaskActionButton(actions, suggested ? "▶ 开始" : "开始", suggested, false,
                    () -> performTaskAction("start", taskIndex));
        }
        if (actions.getChildCount() > 0) {
            mainRow.addView(spaceHorizontal(8));
            mainRow.addView(actions, new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));
        }
        item.addView(mainRow, matchWrap());
        if (editable) {
            item.setClickable(true);
            item.setFocusable(true);
            item.setContentDescription("修改" + task.optString("title", "当前作业"));
            item.setOnClickListener(v -> showTaskEditDialog(task));
        }
        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(current ? 7 : 8);
        target.addView(item, params);
    }

    private void renderWeekendTaskPlanner() {
        String key = weekendKeyFor(currentDate);
        boolean weekendMode = key != null;
        weekendTaskPlanEntry.setVisibility(weekendMode ? View.VISIBLE : View.GONE);
        weekendTaskPlanner.setVisibility(weekendMode ? View.VISIBLE : View.GONE);
        if (!weekendMode) {
            if (weekendTaskPlanDialog != null && weekendTaskPlanDialog.isShowing()) weekendTaskPlanDialog.dismiss();
            return;
        }

        JSONObject weekend = weekendForDate(currentDate, false);
        if (weekend == null) weekend = new JSONObject();
        JSONArray tasks = taskArray(false);
        boolean confirmed = weekend.optBoolean("confirmed");
        boolean planSaved = weekend.optBoolean("planSaved");
        boolean orderSaved = taskOrderSaved();
        boolean isFriday = currentDate.equals(key);
        String saturday = addDays(key, 1);
        String sunday = addDays(key, 2);
        boolean executionStarted = false;
        int fridayCount = 0;
        int saturdayCount = 0;
        int sundayCount = 0;
        int fridayDone = 0;
        int saturdayDone = 0;
        int sundayDone = 0;
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task == null) continue;
            if (!"pending".equals(task.optString("status", "pending"))) executionStarted = true;
            if ("friday".equals(plannedDayForTask(task))) {
                fridayCount++;
                if ("done".equals(task.optString("status"))) fridayDone++;
            } else if ("sunday".equals(plannedDayForTask(task))) {
                sundayCount++;
                if ("done".equals(task.optString("status"))) sundayDone++;
            } else {
                saturdayCount++;
                if ("done".equals(task.optString("status"))) saturdayDone++;
            }
        }

        weekendTaskPlanEntryTitle.setText(isFriday ? "周五安排与闯关" : "查看三天作业计划");
        weekendTaskPlanEntryStatus.setText(!confirmed
                ? "确认作业清单后，再从这里开始安排"
                : !planSaved ? "待分配到周五、周六或周日"
                : !orderSaved ? "完成日已分配，接着安排闯关顺序"
                : "周五 " + fridayCount + " 项 · 周六 " + saturdayCount + " 项 · 周日 " + sundayCount + " 项");
        boolean needsAction = isFriday && confirmed && (!planSaved || !orderSaved);
        weekendTaskPlanEntry.setBackground(rounded(needsAction ? AMBER_SOFT : GREEN_SOFT, 16,
                needsAction ? AMBER : Color.rgb(188, 209, 248), 1));

        weekendTaskPlannerKicker.setText(isFriday ? "周五安排与闯关" : "周五计划已自动带入");
        weekendTaskPlannerTitle.setText(isFriday ? "给每项作业安排完成日期"
                : "今天按" + (currentDate.equals(saturday) ? "周六" : "周日") + "计划完成");
        weekendTaskPlannerHelp.setText(isFriday
                ? "默认安排在周六；挑一部分放到今天完成，其余再分到周末。"
                : "这份清单来自 " + formatShortDate(key) + "（周五），今天不需要重新录入。");
        weekendTaskPlanSummary.setText(planSaved
                ? "周五 " + fridayCount + " 项 · 周六 " + saturdayCount + " 项 · 周日 " + sundayCount + " 项" : "尚未保存");

        weekendTaskPlanList.removeAllViews();
        if (isFriday && confirmed && tasks.length() > 0) {
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task == null) continue;
                final int taskIndex = index;
                String subjectName = task.optString("subject", "其他");
                int subjectColor = taskSubjectColor(subjectName);
                LinearLayout row = vertical();
                row.setPadding(dp(12), dp(10), dp(12), dp(10));
                row.setBackground(rounded(taskSubjectSoftColor(subjectName), 13, subjectColor, 1));
                LinearLayout titleRow = horizontal();
                titleRow.setGravity(Gravity.CENTER_VERTICAL);
                TextView subjectBadge = text(subjectName, 10, Color.WHITE, true);
                subjectBadge.setGravity(Gravity.CENTER);
                subjectBadge.setPadding(dp(8), dp(3), dp(8), dp(3));
                subjectBadge.setBackground(rounded(subjectColor, 16, subjectColor, 0));
                titleRow.addView(subjectBadge);
                titleRow.addView(spaceHorizontal(7));
                titleRow.addView(text(task.optString("title", "未命名作业"), 13, INK, true), weightedWrap(1));
                row.addView(titleRow, matchWrap());
                LinearLayout days = horizontal();
                days.setPadding(0, dp(8), 0, 0);
                Button fridayButton = planDayButton("周五", "friday".equals(plannedDayForTask(task)), executionStarted);
                fridayButton.setOnClickListener(v -> selectWeekendTaskDay(taskIndex, "friday"));
                days.addView(fridayButton, weightedFixed(1, dp(38)));
                days.addView(spaceHorizontal(6));
                Button saturdayButton = planDayButton("周六", "saturday".equals(plannedDayForTask(task)), executionStarted);
                saturdayButton.setOnClickListener(v -> selectWeekendTaskDay(taskIndex, "saturday"));
                days.addView(saturdayButton, weightedFixed(1, dp(38)));
                days.addView(spaceHorizontal(6));
                Button sundayButton = planDayButton("周日", "sunday".equals(plannedDayForTask(task)), executionStarted);
                sundayButton.setOnClickListener(v -> selectWeekendTaskDay(taskIndex, "sunday"));
                days.addView(sundayButton, weightedFixed(1, dp(38)));
                row.addView(days, matchFixed(dp(46)));
                LinearLayout.LayoutParams rowParams = matchWrap();
                if (weekendTaskPlanList.getChildCount() > 0) rowParams.topMargin = dp(8);
                weekendTaskPlanList.addView(row, rowParams);
            }
        } else if (!isFriday && planSaved) {
            addWeekendPlanSummaryRow("周五计划", fridayDone + " / " + fridayCount + " 项完成", false);
            addWeekendPlanSummaryRow("周六计划", saturdayDone + " / " + saturdayCount + " 项完成", currentDate.equals(saturday));
            addWeekendPlanSummaryRow("周日计划", sundayDone + " / " + sundayCount + " 项完成", currentDate.equals(sunday));
        }

        saveWeekendTaskPlanButton.setVisibility(isFriday && confirmed && tasks.length() > 0 && !executionStarted
                ? View.VISIBLE : View.GONE);
        saveWeekendTaskPlanButton.setText(planSaved ? "更新周末安排" : "保存周末安排");
        if (!confirmed) {
            weekendTaskPlanHint.setText(isFriday ? "先核对并确认上面的作业清单。" : "周五的作业清单还没有确认。");
        } else if (!planSaved) {
            weekendTaskPlanHint.setText(isFriday ? "选好每项作业的完成日，再保存安排。" : "周五还没有保存周末安排。");
        } else if (executionStarted && isFriday) {
            weekendTaskPlanHint.setText("三天计划已经开始执行，安排已锁定。");
        } else if (isFriday && !taskOrderSaved()) {
            weekendTaskPlanHint.setText("日期已安排，关闭弹窗后排好三天的闯关顺序。");
        } else if (isFriday) {
            weekendTaskPlanHint.setText("安排好啦，今天先完成周五的 " + fridayCount + " 项。");
        } else if (currentDate.equals(saturday)) {
            weekendTaskPlanHint.setText("今天优先完成周六的 " + saturdayCount + " 项。");
        } else if (currentDate.equals(sunday)) {
            weekendTaskPlanHint.setText("今天完成周日的 " + sundayCount + " 项，并补齐未完成项。");
        } else {
            weekendTaskPlanHint.setText("安排保存后，三天会按计划显示。");
        }

        Result result = weekendResultFor(key, weekend);
        weekendTaskResultPanel.setVisibility(result == null ? View.GONE : View.VISIBLE);
        if (result != null) {
            weekendTaskResultLabel.setText(result.label);
            weekendTaskResultAmount.setText(amountText(result.amount));
            weekendTaskResultAmount.setTextColor(amountColor(result.amount));
            int fill = result.amount < 0 ? RED_SOFT : result.amount == 0 ? AMBER_SOFT : GREEN_SOFT;
            weekendTaskResultPanel.setBackground(rounded(fill, 12, fill, 0));
        }
        boolean showPenalty = currentDate.equals(sunday) && planSaved && !hasText(weekend, "allDoneDate");
        weekendTaskPenaltyButton.setVisibility(showPenalty ? View.VISIBLE : View.GONE);
        weekendTaskPenaltyButton.setText(weekend.optBoolean("penaltyConfirmed")
                ? "撤销未完成结算" : "周日结束仍未完成");
    }

    private Button planDayButton(String label, boolean selected, boolean locked) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(10);
        button.setTextColor(selected ? Color.rgb(118, 84, 31) : MUTED);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setEnabled(!locked);
        button.setBackground(rounded(selected ? AMBER_SOFT : Color.WHITE, 18,
                selected ? AMBER : LINE, 1));
        return button;
    }

    private void addWeekendPlanSummaryRow(String title, String status, boolean today) {
        LinearLayout row = vertical();
        row.setPadding(dp(12), dp(10), dp(12), dp(10));
        row.setBackground(rounded(today ? GREEN_SOFT : Color.WHITE, 15, today ? Color.rgb(156, 188, 245) : LINE, 1));
        row.addView(text(title, 13, INK, true));
        TextView statusView = text(status, 10, MUTED, false);
        statusView.setPadding(0, dp(3), 0, 0);
        row.addView(statusView);
        LinearLayout.LayoutParams params = matchWrap();
        if (weekendTaskPlanList.getChildCount() > 0) params.topMargin = dp(8);
        weekendTaskPlanList.addView(row, params);
    }

    private void selectWeekendTaskDay(int index, String plannedDay) {
        String key = weekendKeyFor(currentDate);
        if (key == null || !currentDate.equals(key)) {
            toast("周末安排只能在周五制定");
            return;
        }
        JSONObject weekend = weekendForDate(currentDate, true);
        if (!weekend.optBoolean("confirmed")) {
            toast("请先确认作业清单");
            return;
        }
        JSONArray tasks = taskArray(false);
        for (int taskIndex = 0; taskIndex < tasks.length(); taskIndex++) {
            JSONObject item = tasks.optJSONObject(taskIndex);
            if (item != null && !"pending".equals(item.optString("status", "pending"))) {
                toast("周末已经开始执行，安排已锁定");
                return;
            }
        }
        JSONObject task = tasks.optJSONObject(index);
        if (task == null) return;
        put(task, "plannedDay", "friday".equals(plannedDay) ? "friday"
                : "sunday".equals(plannedDay) ? "sunday" : "saturday");
        weekend.remove("planSaved");
        weekend.remove("planSavedAt");
        put(weekend, "orderSaved", false);
        weekend.remove("orderSavedAt");
        saveWeekends();
        renderAll();
    }

    private void saveWeekendTaskPlan() {
        String key = weekendKeyFor(currentDate);
        if (key == null || !currentDate.equals(key)) {
            toast("周末安排只能在周五保存");
            return;
        }
        JSONObject weekend = weekendForDate(currentDate, true);
        JSONArray tasks = taskArray(false);
        if (!weekend.optBoolean("confirmed") || tasks.length() == 0) {
            toast("请先确认完整的作业清单");
            return;
        }
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && !"pending".equals(task.optString("status", "pending"))) {
                toast("周末已经开始执行，安排已锁定");
                return;
            }
            if (task != null) put(task, "plannedDay", plannedDayForTask(task));
        }
        put(weekend, "planSaved", true);
        put(weekend, "planSavedAt", currentTime());
        put(weekend, "orderSaved", false);
        weekend.remove("orderSavedAt");
        weekend.remove("penaltyConfirmed");
        saveWeekends();
        renderAll();
        if (weekendTaskPlanDialog != null && weekendTaskPlanDialog.isShowing()) weekendTaskPlanDialog.dismiss();
        toast("完成日期已保存，接下来排好三天顺序吧");
    }

    private void toggleWeekendTaskPenalty() {
        String key = weekendKeyFor(currentDate);
        JSONObject weekend = weekendForDate(currentDate, true);
        if (key == null || !currentDate.equals(addDays(key, 2)) || !weekend.optBoolean("planSaved")
                || hasText(weekend, "allDoneDate")) return;
        if (weekend.optBoolean("penaltyConfirmed")) {
            weekend.remove("penaltyConfirmed");
            saveWeekends();
            renderAll();
            toast("已撤销未完成结算");
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("确认周末未完成")
                .setMessage("确认到周日结束，学校作业仍未全部完成吗？")
                .setNegativeButton("取消", null)
                .setPositiveButton("确认", (dialog, which) -> {
                    put(weekend, "penaltyConfirmed", true);
                    saveWeekends();
                    renderAll();
                    toast("周末未完成已结算");
                })
                .show();
    }

    private void addTaskActionButton(LinearLayout row, String label, boolean primary, boolean danger, Runnable action) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(11);
        button.setTextColor(primary ? Color.WHITE : danger ? RED : GREEN);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        int fill = primary ? GREEN : danger ? Color.rgb(255, 244, 244) : Color.WHITE;
        int stroke = primary ? GREEN : danger ? Color.rgb(235, 148, 148) : LINE;
        button.setBackground(rounded(fill, 18, stroke, 1));
        button.setOnClickListener(v -> action.run());
        int width = label.length() > 3 ? dp(76) : dp(58);
        LinearLayout.LayoutParams params = fixed(width, dp(34));
        if (row.getChildCount() > 0) params.leftMargin = dp(5);
        row.addView(button, params);
    }

    private void performTaskAction(String action, int index) {
        String weekendKey = weekendKeyFor(currentDate);
        JSONObject weekend = weekendKey == null ? null : weekendForDate(currentDate, true);
        JSONArray tasks = taskArray(true);
        JSONObject task = tasks.optJSONObject(index);
        if (task == null) return;
        boolean showFocusAfterRender = false;
        int nextStartPlanTaskIndex = -1;
        int offerBreakTaskIndex = -1;
        int offerBreakSourceTaskIndex = -1;
        boolean offerBreakFromPause = false;
        if ("delete".equals(action)) {
            if (weekendKey != null && !currentDate.equals(weekendKey)) {
                toast("周末清单只能在周五修改");
                return;
            }
            timerHandler.removeCallbacks(clearDeletedTaskUndo);
            lastDeletedTask = task;
            lastDeletedTaskDate = currentDate;
            timerHandler.postDelayed(clearDeletedTaskUndo, 15000);
            tasks.remove(index);
            if (weekendKey == null) {
                JSONObject owner = taskOwner(true);
                owner.remove("finishTime");
                owner.remove("tasksFinishedAt");
                owner.remove("ruleId");
            } else {
                weekend.remove("planSaved");
                weekend.remove("planSavedAt");
            }
            JSONObject owner = taskOwner(true);
            if (task.optString("id").equals(owner.optString("mealAfterTaskId"))) {
                owner.remove("mealAfterTaskId");
            }
            owner.remove("orderSaved");
            owner.remove("orderSavedAt");
            cleanupCurrentRecord();
            cleanupWeekend();
            taskListExpanded = false;
            completedTasksExpanded = false;
            saveTaskData();
            renderAll();
            toast("已删除，可以在上方撤销");
            return;
        }
        if (!taskListConfirmed()) {
            toast("请先确认作业清单");
            return;
        }
        if (!taskOrderSaved()) {
            toast(weekendKey != null && !currentDate.equals(weekendKey)
                    ? "请回到周五确定周末闯关顺序" : "请先确定闯关顺序");
            return;
        }
        if (weekendKey != null && !weekend.optBoolean("planSaved")) {
            toast("请先在周五保存三天的作业安排");
            return;
        }
        if (weekendKey != null && currentDate.equals(weekendKey)
                && !"friday".equals(plannedDayForTask(task))
                && !"undo".equals(action)) {
            toast("这项安排在周末，今天先做周五计划");
            return;
        }
        if (weekendKey != null && currentDate.equals(addDays(weekendKey, 1))
                && "sunday".equals(plannedDayForTask(task))
                && ("start".equals(action) || "complete".equals(action))) {
            toast("这项安排在周日，今天先做周六计划");
            return;
        }
        JSONObject record = currentRecord(true);
        if (weekendKey == null && hasText(record, "finishTime") && !"undo".equals(action)) {
            toast("当天已经结算，如需修改可先撤销一项完成");
            return;
        }
        if ("start".equals(action)) {
            if (hasActiveBreakSession()) clearBreakSession();
            if (hasActiveStartPlanSession() || startPlanDialog != null) clearStartPlanSession();
            JSONObject active = activeTask(false);
            if (active != null && active != task) {
                toast("请先暂停或完成“" + active.optString("title", "当前作业") + "”");
                return;
            }
            put(task, "status", "active");
            put(task, "activeSince", System.currentTimeMillis());
            if (!hasText(task, "startedAt")) put(task, "startedAt", currentTime());
            if (!hasText(record, "startTime")) put(record, "startTime", currentTime());
            showFocusAfterRender = true;
            toast("开始：" + task.optString("title", "作业"));
        } else if ("pause".equals(action)) {
            stopTaskClock(task, "paused");
            dismissTaskFocusDialog();
            offerBreakTaskIndex = index;
            offerBreakSourceTaskIndex = index;
            offerBreakFromPause = true;
        } else if ("complete".equals(action)) {
            stopTaskClock(task, "done");
            dismissTaskFocusDialog();
            put(task, "completedAt", currentTime());
            if (weekendKey != null) put(task, "completedDate", currentDate);
            boolean completedAll = allTasksDone();
            if (completedAll && weekendKey == null) {
                put(record, "tasksFinishedAt", task.optString("completedAt"));
                record.remove("ruleId");
                if (record.optBoolean("ledgerConfirmed")) {
                    put(record, "finishTime", record.optString("tasksFinishedAt"));
                    Result result = resultFor(record);
                    String kind = result.amount < 0 ? "扣款" : result.amount == 0 ? "结算" : "奖励";
                    toast("已全部完成，自动" + kind + " " + amountText(result.amount));
                } else {
                    record.remove("finishTime");
                    toast("作业已全部完成，补全成长记录册后自动结算");
                }
            } else if (completedAll) {
                put(weekend, "allDoneDate", currentDate);
                put(weekend, "allDoneTime", task.optString("completedAt"));
                weekend.remove("penaltyConfirmed");
                Result result = weekendResultFor(weekendKey, weekend);
                toast("周末作业已全部完成，" + result.label + " " + amountText(result.amount));
            } else if (weekendKey == null && task.optString("id")
                    .equals(taskOwner(false).optString("mealAfterTaskId"))) {
                toast("饭前计划完成，可以准备吃饭啦");
            } else {
                int todayTotal = 0;
                int todayDone = 0;
                for (int taskPosition = 0; taskPosition < tasks.length(); taskPosition++) {
                    JSONObject todayTask = tasks.optJSONObject(taskPosition);
                    if (todayTask == null) continue;
                    String todayTaskDay = plannedDayForTask(todayTask);
                    boolean include = weekendKey == null
                            || currentDate.equals(weekendKey) && "friday".equals(todayTaskDay)
                            || currentDate.equals(addDays(weekendKey, 1))
                            && ("saturday".equals(todayTaskDay)
                            || "friday".equals(todayTaskDay)
                            && (!"done".equals(todayTask.optString("status"))
                            || currentDate.equals(todayTask.optString("completedDate"))))
                            || currentDate.equals(addDays(weekendKey, 2))
                            && ("sunday".equals(todayTaskDay)
                            || ("friday".equals(todayTaskDay) || "saturday".equals(todayTaskDay))
                            && (!"done".equals(todayTask.optString("status"))
                            || currentDate.equals(todayTask.optString("completedDate"))));
                    if (!include) continue;
                    todayTotal++;
                    if ("done".equals(todayTask.optString("status"))) todayDone++;
                }
                int remaining = Math.max(0, todayTotal - todayDone);
                if (remaining == 0) toast("我完成今天安排的作业啦！");
                else if (remaining <= 2) toast("我快到终点了，只剩 " + remaining + " 项！");
                else if (todayDone >= Math.ceil(todayTotal / 2.0)) toast("我又闯过一关，已经完成一半多啦！");
                else toast("我又闯过一关！已经完成 " + todayDone + " 项");
            }
            nextStartPlanTaskIndex = nextTaskIndexForToday();
        } else if ("undo".equals(action)) {
            put(task, "status", "paused");
            task.remove("completedAt");
            task.remove("completedDate");
            if (weekendKey == null) {
                record.remove("finishTime");
                record.remove("tasksFinishedAt");
                record.remove("ruleId");
            } else {
                weekend.remove("allDoneDate");
                weekend.remove("allDoneTime");
                weekend.remove("penaltyConfirmed");
            }
            toast("已撤销完成，可以继续这项作业");
        }
        taskListExpanded = false;
        completedTasksExpanded = false;
        saveTaskData();
        renderAll();
        if (showFocusAfterRender) showTaskFocusDialog(task, index);
        else if (nextStartPlanTaskIndex >= 0) showTaskStartChoice(nextStartPlanTaskIndex, true);
        else if (offerBreakTaskIndex >= 0) showBreakChoiceDialog(
                offerBreakTaskIndex, offerBreakFromPause, offerBreakSourceTaskIndex);
    }

    private void saveTaskData() {
        saveRecords();
        saveWeekends();
    }

    private LinearLayout buildSportCard() {
        LinearLayout item = vertical();
        item.setPadding(dp(14), dp(12), dp(14), dp(12));
        item.setBackground(rounded(Color.WHITE, 15, LINE, 1));

        LinearLayout head = horizontal();
        head.setGravity(Gravity.CENTER_VERTICAL);
        sportCheckView = text("✓", 18, Color.TRANSPARENT, true);
        sportCheckView.setGravity(Gravity.CENTER);
        sportCheckView.setBackground(rounded(PAGE, 20, LINE, 1));
        head.addView(sportCheckView, fixed(dp(34), dp(34)));
        head.addView(spaceHorizontal(12));
        LinearLayout copy = vertical();
        copy.addView(text("运动打卡", 14, INK, true));
        sportStatusView = text("选择今天完成的运动", 11, MUTED, false);
        sportStatusView.setPadding(0, dp(3), 0, 0);
        copy.addView(sportStatusView);
        head.addView(copy, weightedWrap(1));
        item.addView(head, matchWrap());

        sportButtons.clear();
        LinearLayout currentRow = null;
        for (int index = 0; index < SPORTS.length; index++) {
            if (index == 0 || index == 3) {
                currentRow = horizontal();
                LinearLayout.LayoutParams rowParams = matchFixed(dp(40));
                rowParams.topMargin = dp(8);
                item.addView(currentRow, rowParams);
            }
            final String activity = SPORTS[index];
            Button button = new Button(this);
            button.setText(activity);
            button.setTextSize(10);
            button.setAllCaps(false);
            button.setMinHeight(0);
            button.setMinimumHeight(0);
            button.setPadding(dp(3), 0, dp(3), 0);
            button.setOnClickListener(v -> toggleSport(activity));
            LinearLayout.LayoutParams params = weightedFixed(1, dp(40));
            if (currentRow.getChildCount() > 0) params.leftMargin = dp(6);
            currentRow.addView(button, params);
            sportButtons.add(button);
        }
        return item;
    }

    private LinearLayout prepCard(String title, String subtitle) {
        LinearLayout item = horizontal();
        item.setGravity(Gravity.CENTER_VERTICAL);
        item.setPadding(dp(14), dp(10), dp(14), dp(10));
        item.setClickable(true);
        item.setFocusable(true);
        TextView check = text("✓", 18, Color.TRANSPARENT, true);
        check.setGravity(Gravity.CENTER);
        check.setBackground(rounded(PAGE, 20, LINE, 1));
        item.addView(check, fixed(dp(34), dp(34)));
        item.addView(spaceHorizontal(12));
        LinearLayout copy = vertical();
        TextView titleView = text(title, 14, INK, true);
        copy.addView(titleView);
        TextView status = text(subtitle, 11, MUTED, false);
        status.setPadding(0, dp(3), 0, 0);
        copy.addView(status);
        item.addView(copy, weightedWrap(1));
        ledgerCheckView = check;
        ledgerTitleView = titleView;
        ledgerStatusView = status;
        item.setOnClickListener(v -> togglePrep("ledgerConfirmed", "ledgerAt", "钉钉和成长记录册核对状态已更新"));
        return item;
    }

    private LinearLayout dailyHabitCard(String title, String subtitle, String field, String timeField) {
        LinearLayout item = horizontal();
        item.setGravity(Gravity.CENTER_VERTICAL);
        item.setPadding(dp(11), dp(9), dp(10), dp(9));
        item.setClickable(true);
        item.setFocusable(true);
        TextView check = text("✓", 15, Color.TRANSPARENT, true);
        check.setGravity(Gravity.CENTER);
        check.setBackground(rounded(PAGE, 18, LINE, 1));
        item.addView(check, fixed(dp(30), dp(30)));
        item.addView(spaceHorizontal(8));
        LinearLayout copy = vertical();
        copy.addView(text(title, 12, INK, true));
        TextView status = text(subtitle, 9, MUTED, false);
        status.setPadding(0, dp(2), 0, 0);
        copy.addView(status);
        item.addView(copy, weightedWrap(1));
        TextView action = text("打卡", 10, GREEN, true);
        action.setGravity(Gravity.CENTER);
        action.setPadding(dp(9), dp(6), dp(9), dp(6));
        action.setBackground(rounded(GREEN_SOFT, 16, GREEN_SOFT, 0));
        item.addView(action);
        if ("readingDone".equals(field)) {
            readingCheckView = check;
            readingStatusView = status;
            readingActionView = action;
        } else if ("mathThinkingDone".equals(field)) {
            mathThinkingCheckView = check;
            mathThinkingStatusView = status;
            mathThinkingActionView = action;
        } else if ("englishReadingDone".equals(field)) {
            englishReadingCheckView = check;
            englishReadingStatusView = status;
            englishReadingActionView = action;
        }
        item.setOnClickListener(v -> togglePrep(field, timeField, title + "状态已更新"));
        return item;
    }

    private TextView[] timelineRow(String label) {
        LinearLayout row = horizontal();
        row.setGravity(Gravity.TOP);
        TextView dot = text("○", 20, Color.rgb(170, 170, 163), true);
        dot.setGravity(Gravity.CENTER_HORIZONTAL);
        row.addView(dot, fixed(dp(26), dp(40)));
        LinearLayout copy = vertical();
        TextView labelView = text(label, 13, INK, true);
        copy.addView(labelView);
        TextView time = text("--:--", 11, MUTED, false);
        time.setPadding(0, dp(2), 0, 0);
        copy.addView(time);
        row.addView(copy, weightedWrap(1));
        return new TextView[]{dot, time, labelView};
    }

    private View buildDictationPage() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(PAGE);
        LinearLayout content = vertical();
        content.setPadding(dp(16), dp(22), dp(16), dp(28));
        scroll.addView(content, matchWrap());

        LinearLayout header = horizontal();
        header.setGravity(Gravity.CENTER_VERTICAL);
        Button back = smallButton("返回");
        back.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        back.setGravity(Gravity.CENTER);
        back.setIncludeFontPadding(false);
        back.setPadding(0, 0, 0, 0);
        back.setOnClickListener(v -> showMainPage());
        header.addView(back, fixed(dp(64), dp(40)));
        header.addView(spaceHorizontal(13));
        LinearLayout headerCopy = vertical();
        headerCopy.addView(text("🔊 四上语文词语表", 10, GREEN, true));
        headerCopy.addView(text("听写练习", 25, GREEN_DARK, true));
        TextView cheer = text("我选好课程，放下手机，认真听写。", 10, MUTED, false);
        cheer.setPadding(0, dp(3), 0, 0);
        headerCopy.addView(cheer);
        header.addView(headerCopy, weightedWrap(1));
        content.addView(header, matchWrap());
        content.addView(space(16));

        LinearLayout card = card();
        LinearLayout lessonRow = horizontal();
        lessonRow.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout lessonCopy = vertical();
        lessonCopy.addView(text("选择课程", 10, MUTED, true));
        dictationLessonButton = new Button(this);
        dictationLessonButton.setText(DICTATION_LESSONS[0][1] + "  ▾");
        dictationLessonButton.setTextSize(14);
        dictationLessonButton.setTextColor(INK);
        dictationLessonButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        dictationLessonButton.setAllCaps(false);
        dictationLessonButton.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        dictationLessonButton.setPadding(dp(12), 0, dp(12), 0);
        dictationLessonButton.setBackground(rounded(Color.WHITE, 11, LINE, 1));
        dictationLessonButton.setOnClickListener(v -> showDictationLessonPicker());
        LinearLayout.LayoutParams lessonButtonParams = matchFixed(dp(44));
        lessonButtonParams.topMargin = dp(6);
        lessonCopy.addView(dictationLessonButton, lessonButtonParams);
        lessonRow.addView(lessonCopy, weightedWrap(1));
        lessonRow.addView(spaceHorizontal(10));
        dictationLessonCountView = text("0 个词语", 11, GREEN, true);
        dictationLessonCountView.setPadding(dp(9), dp(6), dp(9), dp(6));
        dictationLessonCountView.setBackground(rounded(GREEN_SOFT, 18, GREEN_SOFT, 0));
        lessonRow.addView(dictationLessonCountView);
        card.addView(lessonRow, matchWrap());

        LinearLayout lessonNavigation = horizontal();
        dictationPreviousLessonButton = smallButton("← 上一课");
        dictationPreviousLessonButton.setOnClickListener(v -> selectDictationLesson(selectedDictationLessonIndex - 1));
        lessonNavigation.addView(dictationPreviousLessonButton, weightedFixed(1, dp(42)));
        lessonNavigation.addView(spaceHorizontal(8));
        dictationNextLessonButton = smallButton("下一课 →");
        dictationNextLessonButton.setOnClickListener(v -> selectDictationLesson(selectedDictationLessonIndex + 1));
        lessonNavigation.addView(dictationNextLessonButton, weightedFixed(1, dp(42)));
        LinearLayout.LayoutParams lessonNavigationParams = matchWrap();
        lessonNavigationParams.topMargin = dp(10);
        card.addView(lessonNavigation, lessonNavigationParams);

        dictationWordBank = vertical();
        dictationWordBank.setPadding(dp(15), dp(15), dp(15), dp(15));
        dictationWordBank.setBackground(rounded(Color.rgb(248, 251, 255), 17, LINE, 1));
        TextView bankKicker = text("本课词语与人工录音", 10, GREEN, true);
        bankKicker.setLetterSpacing(0.1f);
        dictationWordBank.addView(bankKicker);
        dictationLessonTitleView = text("第1课", 18, INK, true);
        dictationWordBank.addView(dictationLessonTitleView);
        TextView bankHelp = text("请为每个词清楚地读一遍并保存；开始听写前，本课词语需要全部完成录音。", 9, MUTED, false);
        bankHelp.setPadding(0, dp(4), 0, dp(8));
        dictationWordBank.addView(bankHelp);
        dictationWordsContainer = vertical();
        dictationWordBank.addView(dictationWordsContainer, matchWrap());

        LinearLayout addRow = horizontal();
        addRow.setGravity(Gravity.CENTER_VERTICAL);
        dictationWordInput = new EditText(this);
        dictationWordInput.setTextSize(13);
        dictationWordInput.setTextColor(INK);
        dictationWordInput.setHintTextColor(Color.rgb(150, 158, 172));
        dictationWordInput.setHint("多个词语用空格或顿号分开");
        dictationWordInput.setSingleLine(true);
        dictationWordInput.setPadding(dp(11), 0, dp(11), 0);
        dictationWordInput.setBackground(rounded(Color.WHITE, 11, LINE, 1));
        addRow.addView(dictationWordInput, weightedFixed(1, dp(43)));
        addRow.addView(spaceHorizontal(7));
        Button addWords = smallButton("添加");
        addWords.setOnClickListener(v -> addCustomDictationWords());
        addRow.addView(addWords, fixed(dp(68), dp(43)));
        LinearLayout.LayoutParams addRowParams = matchWrap();
        addRowParams.topMargin = dp(11);
        dictationWordBank.addView(addRow, addRowParams);
        LinearLayout.LayoutParams bankParams = matchWrap();
        bankParams.topMargin = dp(16);
        card.addView(dictationWordBank, bankParams);

        dictationHiddenWords = vertical();
        dictationHiddenWords.setGravity(Gravity.CENTER);
        dictationHiddenWords.setPadding(dp(18), dp(28), dp(18), dp(28));
        dictationHiddenWords.setBackground(rounded(Color.rgb(242, 247, 255), 17, Color.rgb(188, 209, 248), 1));
        TextView hiddenIcon = text("🙈", 34, INK, false);
        hiddenIcon.setGravity(Gravity.CENTER);
        dictationHiddenWords.addView(hiddenIcon);
        TextView hiddenTitle = text("词语已经藏起来了", 16, INK, true);
        hiddenTitle.setGravity(Gravity.CENTER);
        hiddenTitle.setPadding(0, dp(7), 0, 0);
        dictationHiddenWords.addView(hiddenTitle);
        TextView hiddenHelp = text("我专心听，不偷看，写完再核对。", 10, MUTED, false);
        hiddenHelp.setGravity(Gravity.CENTER);
        hiddenHelp.setPadding(0, dp(4), 0, 0);
        dictationHiddenWords.addView(hiddenHelp);
        LinearLayout.LayoutParams hiddenParams = matchFixed(dp(170));
        hiddenParams.topMargin = dp(16);
        card.addView(dictationHiddenWords, hiddenParams);

        LinearLayout practice = vertical();
        practice.setPadding(dp(16), dp(16), dp(16), dp(16));
        practice.setBackground(rounded(Color.rgb(237, 244, 255), 17, Color.rgb(191, 212, 251), 1));
        TextView practiceKicker = text("听写进度", 10, GREEN, true);
        practiceKicker.setLetterSpacing(0.1f);
        practice.addView(practiceKicker);
        dictationStatusView = text("准备好后开始听写", 17, INK, true);
        practice.addView(dictationStatusView);
        dictationTimingView = text(DICTATION_VOICE_GUIDANCE, 10, MUTED, false);
        dictationTimingView.setPadding(0, dp(5), 0, 0);
        practice.addView(dictationTimingView);
        LinearLayout progressRow = horizontal();
        progressRow.setGravity(Gravity.CENTER_VERTICAL);
        dictationProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        dictationProgressBar.setMax(100);
        dictationProgressBar.setProgressTintList(ColorStateList.valueOf(GREEN));
        dictationProgressBar.setProgressBackgroundTintList(ColorStateList.valueOf(Color.rgb(220, 232, 251)));
        progressRow.addView(dictationProgressBar, weightedFixed(1, dp(10)));
        progressRow.addView(spaceHorizontal(10));
        dictationProgressTextView = text("0 / 0", 12, GREEN, true);
        dictationProgressTextView.setGravity(Gravity.END);
        progressRow.addView(dictationProgressTextView, fixed(dp(62), dp(30)));
        LinearLayout.LayoutParams progressParams = matchWrap();
        progressParams.topMargin = dp(12);
        practice.addView(progressRow, progressParams);
        LinearLayout actions = horizontal();
        startDictationButton = new Button(this);
        startDictationButton.setText("开始听写");
        startDictationButton.setTextSize(13);
        startDictationButton.setTextColor(Color.WHITE);
        startDictationButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        startDictationButton.setAllCaps(false);
        startDictationButton.setBackground(rounded(GREEN, 12, GREEN, 0));
        startDictationButton.setOnClickListener(v -> startDictation());
        actions.addView(startDictationButton, weightedFixed(1, dp(45)));
        actions.addView(spaceHorizontal(7));
        stopDictationButton = new Button(this);
        stopDictationButton.setText("停止听写");
        stopDictationButton.setTextSize(13);
        stopDictationButton.setTextColor(RED);
        stopDictationButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        stopDictationButton.setAllCaps(false);
        stopDictationButton.setBackground(rounded(RED_SOFT, 12, Color.rgb(219, 175, 169), 1));
        stopDictationButton.setOnClickListener(v -> stopDictation(false, true));
        actions.addView(stopDictationButton, weightedFixed(1, dp(45)));
        LinearLayout.LayoutParams actionsParams = matchWrap();
        actionsParams.topMargin = dp(12);
        practice.addView(actions, actionsParams);
        LinearLayout.LayoutParams practiceParams = matchWrap();
        practiceParams.topMargin = dp(16);
        card.addView(practice, practiceParams);

        content.addView(card, matchWrap());
        renderDictationPage();
        return scroll;
    }

    private String selectedDictationLessonId() {
        return DICTATION_LESSONS[selectedDictationLessonIndex][0];
    }

    private JSONArray customWordsForSelectedLesson() {
        JSONArray words = dictationCustomWords.optJSONArray(selectedDictationLessonId());
        return words == null ? new JSONArray() : words;
    }

    private List<String> dictationWordsForSelectedLesson() {
        List<String> words = new ArrayList<>();
        Collections.addAll(words, DICTATION_LESSONS[selectedDictationLessonIndex][2].split(" "));
        JSONArray custom = customWordsForSelectedLesson();
        for (int index = 0; index < custom.length(); index++) {
            String word = custom.optString(index, "").trim();
            if (!word.isEmpty() && !words.contains(word)) words.add(word);
        }
        return words;
    }

    private void addDictationWordRow(String word, int number, boolean custom, int customIndex) {
        LinearLayout row = vertical();
        row.setPadding(dp(10), dp(8), dp(9), dp(8));
        row.setBackground(rounded(custom ? Color.rgb(240, 251, 247) : Color.WHITE, 12,
                custom ? Color.rgb(168, 220, 201) : Color.rgb(199, 216, 245), 1));

        boolean hasRecording = hasDictationWordRecording(word);
        boolean recordingThisWord = word.equals(activeDictationRecordingWord);
        boolean recordingAnotherWord = activeDictationRecordingWord != null && !recordingThisWord;
        LinearLayout info = horizontal();
        info.setGravity(Gravity.CENTER_VERTICAL);
        TextView badge = text(String.valueOf(number), 10, custom ? Color.rgb(55, 126, 104) : GREEN, true);
        badge.setGravity(Gravity.CENTER);
        info.addView(badge, fixed(dp(27), dp(30)));
        info.addView(spaceHorizontal(5));
        LinearLayout copy = vertical();
        TextView wordView = text(word + (custom ? "  ·  自定义" : ""), 13, INK, true);
        copy.addView(wordView);
        String recordingStatus = recordingThisWord ? "正在录音，读完后点击停止"
                : hasRecording ? "已录音" : "未录音";
        TextView status = text(recordingStatus, 9,
                recordingThisWord ? RED : hasRecording ? Color.rgb(55, 126, 104) : MUTED, false);
        status.setPadding(0, dp(2), 0, 0);
        copy.addView(status);
        info.addView(copy, weightedWrap(1));
        row.addView(info, matchWrap());

        LinearLayout actions = horizontal();
        actions.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);
        Button record = dictationWordActionButton(
                recordingThisWord ? "停止" : hasRecording ? "重录" : "录音",
                !hasRecording && !recordingThisWord,
                recordingThisWord
        );
        record.setEnabled(!recordingAnotherWord && !dictationRunning);
        record.setOnClickListener(v -> toggleDictationWordRecording(word));
        actions.addView(record, fixed(dp(55), dp(34)));
        if (hasRecording && !recordingThisWord) {
            actions.addView(spaceHorizontal(4));
            Button preview = dictationWordActionButton(
                    word.equals(activeDictationPreviewWord) ? "停止" : "试听", false, false);
            preview.setEnabled(activeDictationRecordingWord == null && !dictationRunning);
            preview.setOnClickListener(v -> toggleDictationWordPreview(word));
            actions.addView(preview, fixed(dp(50), dp(34)));
            actions.addView(spaceHorizontal(4));
            Button deleteRecording = dictationWordActionButton("删录音", false, true);
            deleteRecording.setEnabled(activeDictationRecordingWord == null && !dictationRunning);
            deleteRecording.setOnClickListener(v -> deleteDictationWordRecording(word));
            actions.addView(deleteRecording, fixed(dp(62), dp(34)));
        }
        if (custom) {
            actions.addView(spaceHorizontal(4));
            Button remove = dictationWordActionButton("删词语", false, false);
            remove.setEnabled(activeDictationRecordingWord == null && !dictationRunning);
            remove.setOnClickListener(v -> removeCustomDictationWord(customIndex));
            actions.addView(remove, fixed(dp(58), dp(34)));
        }
        LinearLayout.LayoutParams actionParams = matchWrap();
        actionParams.topMargin = dp(6);
        row.addView(actions, actionParams);
        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(6);
        dictationWordsContainer.addView(row, params);
    }

    private Button dictationWordActionButton(String label, boolean primary, boolean danger) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(10);
        button.setTextColor(primary ? Color.WHITE : danger ? RED : GREEN);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setAllCaps(false);
        button.setMinWidth(0);
        button.setMinimumWidth(0);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setPadding(0, 0, 0, 0);
        int fill = primary ? GREEN : danger ? Color.rgb(255, 244, 244) : Color.WHITE;
        int stroke = primary ? GREEN : danger ? Color.rgb(235, 148, 148) : LINE;
        button.setBackground(rounded(fill, 10, stroke, 1));
        return button;
    }

    private void renderDictationPage() {
        if (dictationLessonButton == null) return;
        String[] lesson = DICTATION_LESSONS[selectedDictationLessonIndex];
        List<String> allWords = dictationWordsForSelectedLesson();
        JSONArray custom = customWordsForSelectedLesson();
        dictationLessonButton.setText(lesson[1] + "  ▾");
        boolean lessonSelectionEnabled = !dictationRunning && activeDictationRecordingWord == null;
        dictationLessonButton.setEnabled(lessonSelectionEnabled);
        dictationPreviousLessonButton.setEnabled(lessonSelectionEnabled && selectedDictationLessonIndex > 0);
        dictationNextLessonButton.setEnabled(
                lessonSelectionEnabled && selectedDictationLessonIndex < DICTATION_LESSONS.length - 1);
        dictationLessonTitleView.setText(lesson[1]);
        int recordedCount = 0;
        for (String word : allWords) if (hasDictationWordRecording(word)) recordedCount++;
        dictationLessonCountView.setText("已录 " + recordedCount + " / " + allWords.size());
        dictationWordsContainer.removeAllViews();
        String[] builtIn = lesson[2].split(" ");
        for (int index = 0; index < builtIn.length; index++) {
            addDictationWordRow(builtIn[index], index + 1, false, -1);
        }
        for (int index = 0; index < custom.length(); index++) {
            String word = custom.optString(index, "").trim();
            if (!word.isEmpty()) addDictationWordRow(word, builtIn.length + index + 1, true, index);
        }
        dictationWordBank.setVisibility(dictationRunning ? View.GONE : View.VISIBLE);
        dictationHiddenWords.setVisibility(dictationRunning ? View.VISIBLE : View.GONE);
        startDictationButton.setVisibility(dictationRunning ? View.GONE : View.VISIBLE);
        startDictationButton.setEnabled(activeDictationRecordingWord == null);
        stopDictationButton.setVisibility(dictationRunning ? View.VISIBLE : View.GONE);
        if (!dictationRunning) {
            if (activeDictationRecordingWord != null) {
                dictationStatusView.setText("正在录制「" + activeDictationRecordingWord + "」");
                dictationTimingView.setText("清楚地读一遍，读完点击“停止”保存；单个词最长录制10秒。");
            } else {
                dictationStatusView.setText(recordedCount == allWords.size()
                        ? "本课人声已录齐，可以开始听写"
                        : "还有 " + (allWords.size() - recordedCount) + " 个词语未录音");
                dictationTimingView.setText(DICTATION_VOICE_GUIDANCE);
            }
            setDictationProgress(0, allWords.size(), -1);
        }
    }

    private void showDictationLessonPicker() {
        if (dictationRunning || activeDictationRecordingWord != null) return;
        String[] labels = new String[DICTATION_LESSONS.length];
        for (int index = 0; index < DICTATION_LESSONS.length; index++) labels[index] = DICTATION_LESSONS[index][1];
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("选择听写课程")
                .setSingleChoiceItems(labels, selectedDictationLessonIndex, null)
                .setNegativeButton("取消", null)
                .create();
        dialog.setOnShowListener(ignored -> dialog.getListView().setOnItemClickListener((parent, view, position, id) -> {
            selectDictationLesson(position);
            dialog.dismiss();
        }));
        dialog.show();
    }

    private void selectDictationLesson(int lessonIndex) {
        if (dictationRunning || activeDictationRecordingWord != null) return;
        if (lessonIndex < 0 || lessonIndex >= DICTATION_LESSONS.length) return;
        releaseDictationPreviewPlayer();
        selectedDictationLessonIndex = lessonIndex;
        preferences.edit().putString(KEY_DICTATION_LESSON, selectedDictationLessonId()).apply();
        renderDictationPage();
    }

    private void addCustomDictationWords() {
        String value = dictationWordInput.getText().toString().trim();
        if (value.isEmpty()) {
            toast("请先输入要添加的词语");
            return;
        }
        List<String> allWords = dictationWordsForSelectedLesson();
        JSONArray custom = customWordsForSelectedLesson();
        int added = 0;
        for (String raw : value.split("[\\s,，、;；]+")) {
            String word = raw.trim();
            if (word.isEmpty() || allWords.contains(word)) continue;
            custom.put(word);
            allWords.add(word);
            added++;
        }
        if (added == 0) {
            toast("这些词语已经在本课词语表中");
            return;
        }
        put(dictationCustomWords, selectedDictationLessonId(), custom);
        preferences.edit().putString(KEY_DICTATION_CUSTOM, dictationCustomWords.toString()).apply();
        dictationWordInput.setText("");
        renderDictationPage();
        toast("已添加 " + added + " 个词语");
    }

    private void removeCustomDictationWord(int customIndex) {
        JSONArray custom = customWordsForSelectedLesson();
        if (customIndex < 0 || customIndex >= custom.length()) return;
        custom.remove(customIndex);
        if (custom.length() == 0) dictationCustomWords.remove(selectedDictationLessonId());
        else put(dictationCustomWords, selectedDictationLessonId(), custom);
        preferences.edit().putString(KEY_DICTATION_CUSTOM, dictationCustomWords.toString()).apply();
        renderDictationPage();
        toast("已移除自定义词语");
    }

    private File dictationRecordingDirectory() {
        return new File(getFilesDir(), "dictation-word-recordings");
    }

    private File dictationWordRecordingFile(String word) {
        String fileName;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(word.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte value : digest) hex.append(String.format(Locale.ROOT, "%02x", value & 0xff));
            fileName = hex + ".m4a";
        } catch (NoSuchAlgorithmException ignored) {
            fileName = Integer.toHexString(word.hashCode()) + ".m4a";
        }
        return new File(dictationRecordingDirectory(), fileName);
    }

    private boolean hasDictationWordRecording(String word) {
        File file = dictationWordRecordingFile(word);
        return file.isFile() && file.length() > 0;
    }

    private void toggleDictationWordRecording(String word) {
        if (word.equals(activeDictationRecordingWord)) {
            stopDictationWordRecording(true, true);
            return;
        }
        if (activeDictationRecordingWord != null || dictationRunning) return;
        releaseDictationPreviewPlayer();
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            pendingDictationRecordingWord = word;
            requestPermissions(
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    DICTATION_RECORD_AUDIO_PERMISSION_REQUEST
            );
            return;
        }
        beginDictationWordRecording(word);
    }

    private void beginDictationWordRecording(String word) {
        if (activeDictationRecordingWord != null || dictationRunning) return;
        stopOfflineVoiceInput();
        if (offlineVoiceRecognizer != null && offlineVoiceRecognizer.isBusy()) {
            pendingDictationRecordingWord = word;
            timerHandler.postDelayed(() -> {
                if (word.equals(pendingDictationRecordingWord)
                        && dictationPageView != null
                        && dictationPageView.getVisibility() == View.VISIBLE) {
                    beginDictationWordRecording(word);
                }
            }, 250);
            return;
        }
        pendingDictationRecordingWord = null;
        releaseDictationPreviewPlayer();
        releaseDictationMediaPlayer();
        File directory = dictationRecordingDirectory();
        if ((!directory.isDirectory() && !directory.mkdirs()) || !directory.canWrite()) {
            toast("无法创建词语录音目录");
            return;
        }
        File output = new File(directory, dictationWordRecordingFile(word).getName() + ".recording");
        if (output.exists() && !output.delete()) {
            toast("无法准备词语录音文件");
            return;
        }

        MediaRecorder recorder = new MediaRecorder();
        try {
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setAudioSamplingRate(44100);
            recorder.setAudioEncodingBitRate(96000);
            recorder.setMaxDuration(10_000);
            recorder.setOutputFile(output.getAbsolutePath());
            recorder.setOnInfoListener((source, what, extra) -> {
                if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED) {
                    runOnUiThread(() -> stopDictationWordRecording(true, true));
                }
            });
            recorder.setOnErrorListener((source, what, extra) -> runOnUiThread(() -> {
                stopDictationWordRecording(false, false);
                toast("词语录音失败，请重试");
            }));
            recorder.prepare();
            recorder.start();
            dictationRecorder = recorder;
            pendingDictationRecordingFile = output;
            activeDictationRecordingWord = word;
            dictationRecordingStartedAt = System.currentTimeMillis();
            renderDictationPage();
        } catch (Exception error) {
            recorder.reset();
            recorder.release();
            output.delete();
            toast("无法开始录音，请检查麦克风权限");
        }
    }

    private void stopDictationWordRecording(boolean keepRecording, boolean notify) {
        MediaRecorder recorder = dictationRecorder;
        String word = activeDictationRecordingWord;
        File temporaryFile = pendingDictationRecordingFile;
        if (recorder == null || word == null) return;
        dictationRecorder = null;
        activeDictationRecordingWord = null;
        pendingDictationRecordingFile = null;
        boolean longEnough = System.currentTimeMillis() - dictationRecordingStartedAt
                >= DICTATION_RECORDING_MIN_MS;
        boolean stoppedCleanly = false;
        try {
            recorder.stop();
            stoppedCleanly = true;
        } catch (RuntimeException ignored) {
            // A very short or interrupted capture is discarded below.
        }
        recorder.reset();
        recorder.release();

        boolean saved = false;
        if (keepRecording && stoppedCleanly && longEnough && temporaryFile != null
                && temporaryFile.isFile() && temporaryFile.length() > 0) {
            File finalFile = dictationWordRecordingFile(word);
            File backupFile = new File(finalFile.getParentFile(), finalFile.getName() + ".backup");
            boolean backupReady = !backupFile.exists() || backupFile.delete();
            boolean oldRecordingMoved = backupReady
                    && (!finalFile.exists() || finalFile.renameTo(backupFile));
            saved = oldRecordingMoved && temporaryFile.renameTo(finalFile);
            if (saved) {
                backupFile.delete();
            } else if (backupFile.exists()) {
                backupFile.renameTo(finalFile);
            }
        }
        if (!saved && temporaryFile != null) temporaryFile.delete();
        renderDictationPage();
        if (notify) {
            toast(saved ? "“" + word + "”的录音已保存，正在自动试听" : "录音时间太短，请重新录制");
            if (saved) toggleDictationWordPreview(word);
        }
    }

    private void toggleDictationWordPreview(String word) {
        if (word.equals(activeDictationPreviewWord)) {
            releaseDictationPreviewPlayer();
            renderDictationPage();
            return;
        }
        releaseDictationPreviewPlayer();
        File recording = dictationWordRecordingFile(word);
        if (!recording.isFile()) {
            renderDictationPage();
            toast("这个词还没有录音");
            return;
        }
        MediaPlayer player = new MediaPlayer();
        try {
            player.setDataSource(recording.getAbsolutePath());
            player.setOnCompletionListener(completed -> runOnUiThread(() -> {
                if (dictationPreviewPlayer != completed) return;
                releaseDictationPreviewPlayer();
                renderDictationPage();
            }));
            player.setOnErrorListener((failed, what, extra) -> {
                runOnUiThread(() -> {
                    if (dictationPreviewPlayer != failed) return;
                    releaseDictationPreviewPlayer();
                    renderDictationPage();
                    toast("无法播放这条词语录音");
                });
                return true;
            });
            player.prepare();
            dictationPreviewPlayer = player;
            activeDictationPreviewWord = word;
            player.start();
            renderDictationPage();
        } catch (Exception error) {
            player.release();
            toast("无法播放这条词语录音");
        }
    }

    private void releaseDictationPreviewPlayer() {
        MediaPlayer player = dictationPreviewPlayer;
        dictationPreviewPlayer = null;
        activeDictationPreviewWord = null;
        if (player != null) player.release();
    }

    private void deleteDictationWordRecording(String word) {
        new AlertDialog.Builder(this)
                .setTitle("删除词语录音")
                .setMessage("确定删除“" + word + "”的录音吗？")
                .setNegativeButton("取消", null)
                .setPositiveButton("删除", (dialog, which) -> {
                    if (word.equals(activeDictationPreviewWord)) releaseDictationPreviewPlayer();
                    File file = dictationWordRecordingFile(word);
                    boolean deleted = !file.exists() || file.delete();
                    renderDictationPage();
                    toast(deleted ? "词语录音已删除" : "无法删除词语录音");
                })
                .show();
    }

    private void setDictationProgress(int completed, int total, int current) {
        int percent = total == 0 ? 0 : Math.round(completed * 100f / total);
        dictationProgressBar.setProgress(percent);
        dictationProgressTextView.setText((current < 0 ? completed : current) + " / " + total);
    }

    private void startDictation() {
        List<String> words = dictationWordsForSelectedLesson();
        if (words.isEmpty()) {
            toast("请先添加听写词语");
            return;
        }
        List<String> missing = new ArrayList<>();
        for (String word : words) {
            if (!hasDictationWordRecording(word)) missing.add(word);
        }
        if (!missing.isEmpty()) {
            String firstMissing = missing.get(0);
            toast("还有 " + missing.size() + " 个词未录音，请先录制“" + firstMissing + "”");
            return;
        }
        releaseDictationPreviewPlayer();
        stopDictation(false, false);
        activeDictationWords = new ArrayList<>(words);
        activeDictationIndex = 0;
        activeDictationRepeat = 0;
        dictationRunning = true;
        renderDictationPage();
        speakCurrentDictationWord();
    }

    private void speakCurrentDictationWord() {
        if (!dictationRunning || activeDictationIndex >= activeDictationWords.size()) return;
        String word = activeDictationWords.get(activeDictationIndex);
        int repeatNumber = activeDictationRepeat + 1;
        int nextWordGap = dictationWordGapMs(word);
        dictationStatusView.setText("第 " + (activeDictationIndex + 1) + " 个词语 · 正在播放录音第 "
                + repeatNumber + " 遍");
        dictationTimingView.setText(repeatNumber == 1
                ? "我要认真听，1秒后会再播放一遍。"
                : activeDictationIndex + 1 >= activeDictationWords.size()
                ? "这是最后一个词，我写完就可以核对啦。"
                : "我写下这个词，" + (nextWordGap / 1000) + "秒后进入下一个。");
        setDictationProgress(activeDictationIndex, activeDictationWords.size(), activeDictationIndex + 1);
        playDictationWordRecording(word);
    }

    private void playDictationWordRecording(String word) {
        releaseDictationMediaPlayer();
        File recording = dictationWordRecordingFile(word);
        if (!recording.isFile()) {
            stopDictation(false, false);
            toast("“" + word + "”的录音不存在，请重新录制");
            return;
        }
        MediaPlayer player = new MediaPlayer();
        try {
            player.setDataSource(recording.getAbsolutePath());
            player.setOnCompletionListener(completedPlayer -> runOnUiThread(() -> {
                if (dictationMediaPlayer != completedPlayer) return;
                dictationMediaPlayer = null;
                completedPlayer.release();
                handleDictationAudioDone();
            }));
            player.setOnErrorListener((failedPlayer, what, extra) -> {
                runOnUiThread(() -> {
                    if (dictationMediaPlayer != failedPlayer) return;
                    dictationMediaPlayer = null;
                    failedPlayer.release();
                    stopDictation(false, false);
                    toast("无法播放“" + word + "”的录音，请重新录制");
                });
                return true;
            });
            player.prepare();
            dictationMediaPlayer = player;
            player.start();
        } catch (Exception error) {
            player.release();
            stopDictation(false, false);
            toast("无法播放“" + word + "”的录音，请重新录制");
        }
    }

    private void releaseDictationMediaPlayer() {
        MediaPlayer player = dictationMediaPlayer;
        dictationMediaPlayer = null;
        if (player != null) player.release();
    }

    private void handleDictationAudioDone() {
        if (!dictationRunning) return;
        timerHandler.removeCallbacks(dictationNextWord);
        if (activeDictationRepeat == 0) {
            activeDictationRepeat = 1;
            dictationStatusView.setText("第 " + (activeDictationIndex + 1) + " 个词语 · 1秒后再读一遍");
            timerHandler.postDelayed(dictationNextWord, 1000);
            return;
        }
        if (activeDictationIndex + 1 >= activeDictationWords.size()) {
            stopDictation(true, true);
            return;
        }
        int nextWordGap = dictationWordGapMs(activeDictationWords.get(activeDictationIndex));
        activeDictationIndex++;
        activeDictationRepeat = 0;
        dictationStatusView.setText("已完成 " + activeDictationIndex + " 个 · " + (nextWordGap / 1000) + "秒后下一个词语");
        setDictationProgress(activeDictationIndex, activeDictationWords.size(), -1);
        timerHandler.postDelayed(dictationNextWord, nextWordGap);
    }

    private int dictationWordGapMs(String word) {
        String normalized = word.trim();
        return normalized.codePointCount(0, normalized.length()) == 4 ? 3000 : 2000;
    }

    private void stopDictation(boolean completed, boolean notify) {
        if (!dictationRunning && activeDictationWords.isEmpty()) return;
        int total = activeDictationWords.size();
        int completedCount = completed ? total : activeDictationIndex;
        dictationRunning = false;
        timerHandler.removeCallbacks(dictationNextWord);
        releaseDictationMediaPlayer();
        renderDictationPage();
        dictationStatusView.setText(completed ? "听写完成，共 " + total + " 个词语！" : "听写已停止");
        dictationTimingView.setText(completed ? "太棒了，我可以打开词语表自己核对啦！" : "可以重新选择课程，准备好后再次开始。");
        setDictationProgress(completedCount, total, -1);
        activeDictationWords.clear();
        if (completed && notify) toast("听写完成，我来认真核对一下");
    }

    private void showDictationPage() {
        dismissTaskEntryDialog();
        dismissTaskFocusDialog();
        if (weekendTaskPlanDialog != null && weekendTaskPlanDialog.isShowing()) weekendTaskPlanDialog.dismiss();
        mainPageView.setVisibility(View.GONE);
        historyPageView.setVisibility(View.GONE);
        settingsPageView.setVisibility(View.GONE);
        dictationPageView.setVisibility(View.VISIBLE);
        renderDictationPage();
        if (dictationPageView instanceof ScrollView) ((ScrollView) dictationPageView).scrollTo(0, 0);
    }

    private View buildHistoryPage() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(PAGE);
        LinearLayout content = vertical();
        content.setPadding(dp(16), dp(22), dp(16), dp(28));
        scroll.addView(content, matchWrap());

        LinearLayout header = horizontal();
        header.setGravity(Gravity.CENTER_VERTICAL);
        Button back = new Button(this);
        back.setText("‹");
        back.setTextSize(26);
        back.setTextColor(GREEN);
        back.setAllCaps(false);
        back.setMinHeight(0);
        back.setMinimumHeight(0);
        back.setBackground(rounded(Color.WHITE, 15, LINE, 1));
        back.setOnClickListener(v -> showMainPage());
        header.addView(back, fixed(dp(44), dp(44)));
        header.addView(spaceHorizontal(13));
        LinearLayout copy = vertical();
        copy.addView(text("🌈 每一步都算数", 10, GREEN, true));
        copy.addView(text("成长足迹", 25, GREEN_DARK, true));
        TextView cheer = text("回头看看，我已经完成了很多关。", 10, MUTED, false);
        cheer.setPadding(0, dp(3), 0, 0);
        copy.addView(cheer);
        header.addView(copy, weightedWrap(1));
        historyManageButton = smallButton("管理记录");
        historyManageButton.setOnClickListener(v -> {
            historyManageMode = !historyManageMode;
            historyManageButton.setText(historyManageMode ? "完成管理" : "管理记录");
            renderHistoryAndSummary();
        });
        header.addView(historyManageButton);
        content.addView(header, matchWrap());
        content.addView(space(16));
        content.addView(buildSummaryCard());
        content.addView(space(14));
        content.addView(buildWeeklyReviewCard());
        content.addView(space(14));
        content.addView(buildHistoryCard());
        content.addView(space(16));
        TextView footer = text("🌱 每一条记录，都是我认真坚持的证明", 11, MUTED, true);
        footer.setGravity(Gravity.CENTER);
        content.addView(footer, matchWrap());
        return scroll;
    }

    private void showHistoryPage() {
        stopDictation(false, false);
        pendingDictationRecordingWord = null;
        stopDictationWordRecording(true, false);
        releaseDictationPreviewPlayer();
        historyManageMode = false;
        if (historyManageButton != null) historyManageButton.setText("管理记录");
        renderHistoryAndSummary();
        mainPageView.setVisibility(View.GONE);
        dictationPageView.setVisibility(View.GONE);
        settingsPageView.setVisibility(View.GONE);
        historyPageView.setVisibility(View.VISIBLE);
        if (historyPageView instanceof ScrollView) ((ScrollView) historyPageView).scrollTo(0, 0);
    }

    private void showMainPage() {
        stopDictation(false, false);
        pendingDictationRecordingWord = null;
        stopDictationWordRecording(true, false);
        releaseDictationPreviewPlayer();
        stopBreakAlarmRecording(true, false);
        releaseBreakAlarmPlayer();
        historyManageMode = false;
        if (historyManageButton != null) historyManageButton.setText("管理记录");
        historyPageView.setVisibility(View.GONE);
        dictationPageView.setVisibility(View.GONE);
        settingsPageView.setVisibility(View.GONE);
        mainPageView.setVisibility(View.VISIBLE);
        if (mainPageView instanceof ScrollView) ((ScrollView) mainPageView).scrollTo(0, 0);
    }

    private View buildHistoryCard() {
        LinearLayout card = card();
        TextView kicker = text("🌈 成长足迹", 10, GREEN, true);
        kicker.setLetterSpacing(0.12f);
        card.addView(kicker);
        TextView title = text("看看最近的进步", 21, INK, true);
        title.setPadding(0, dp(3), 0, dp(8));
        card.addView(title);
        historyList = vertical();
        card.addView(historyList, matchWrap());
        emptyHistoryView = text("🌟\n新的成长旅程要开始啦\n完成第一份作业后，这里会留下我的进步。", 13, MUTED, false);
        emptyHistoryView.setGravity(Gravity.CENTER);
        emptyHistoryView.setLineSpacing(dp(4), 1f);
        emptyHistoryView.setPadding(dp(6), dp(28), dp(6), dp(20));
        card.addView(emptyHistoryView, matchWrap());
        return card;
    }

    private View buildWeeklyReviewCard() {
        LinearLayout review = card();
        LinearLayout heading = horizontal();
        heading.setGravity(Gravity.TOP);
        LinearLayout copy = vertical();
        copy.addView(text("本周计划复盘", 10, GREEN, true));
        copy.addView(text("看看时间估得准不准", 18, INK, true));
        heading.addView(copy, weightedWrap(1));
        weeklyReviewRangeView = text("", 10, MUTED, true);
        heading.addView(weeklyReviewRangeView);
        review.addView(heading, matchWrap());
        review.addView(space(13));

        LinearLayout stats = horizontal();
        weeklyPlanDaysView = addWeeklyReviewStat(stats, "按计划完成");
        weeklyEstimatedTimeView = addWeeklyReviewStat(stats, "预计用时");
        weeklyActualTimeView = addWeeklyReviewStat(stats, "实际用时");
        review.addView(stats, matchWrap());
        weeklyReviewInsightView = text("完成几项作业后，我就能更了解自己的时间。", 11, MUTED, false);
        weeklyReviewInsightView.setPadding(0, dp(13), 0, 0);
        review.addView(weeklyReviewInsightView);
        return review;
    }

    private TextView addWeeklyReviewStat(LinearLayout parent, String label) {
        LinearLayout item = vertical();
        item.setGravity(Gravity.CENTER);
        item.setPadding(dp(5), dp(11), dp(5), dp(11));
        item.setBackground(rounded(Color.rgb(245, 248, 254), 13, Color.rgb(245, 248, 254), 0));
        item.addView(text(label, 9, MUTED, false));
        TextView value = text("0 分钟", 14, Color.rgb(49, 93, 159), true);
        value.setPadding(0, dp(4), 0, 0);
        item.addView(value);
        LinearLayout.LayoutParams params = weightedWrap(1);
        if (parent.getChildCount() > 0) params.leftMargin = dp(7);
        parent.addView(item, params);
        return value;
    }

    private void renderWeekend() {
        String key = weekendKeyFor(currentDate);
        boolean weekendMode = key != null;
        weekendCard.setVisibility(weekendMode ? View.VISIBLE : View.GONE);
        weekendSpacer.setVisibility(weekendMode ? View.VISIBLE : View.GONE);
        if (!weekendMode) return;

        JSONObject weekend = weekendForDate(currentDate, false);
        if (weekend == null) weekend = new JSONObject();
        String saturday = addDays(key, 1);
        String sunday = addDays(key, 2);
        weekendRangeView.setText(formatShortDate(key) + "（周五）— " + formatShortDate(sunday) + "（周日）");
        boolean confirmed = weekend.optBoolean("confirmed", false);
        styleWeekendCheck(weekendConfirmedCard, weekendConfirmedCheck, confirmed);
        weekendConfirmedStatus.setText(confirmed
                ? fallbackTime(weekend, "confirmedAt") + " 确认全部作业" : "已核对钉钉并补全成长记录册");
        styleWeekendCheck(dailySeparatedCard, dailySeparatedCheck, weekend.optBoolean("dailySeparated", false));
        styleWeekendCheck(specialSeparatedCard, specialSeparatedCheck, weekend.optBoolean("specialSeparated", false));

        fridayPlanInput.setText(valueOrBlank(weekend, "fridayMinutes"));
        saturdayMorningInput.setText(valueOrBlank(weekend, "saturdayMorningMinutes"));
        saturdayAfternoonInput.setText(valueOrBlank(weekend, "saturdayAfternoonMinutes"));
        saturdayTargetButton.setText(weekend.optString("targetTime", "18:00"));
        updateWeekendPlannedTotal();
        saveWeekendPlanButton.setText(weekend.optBoolean("planSaved") ? "更新周末计划" : "保存周末计划");
        weekendActualView.setText(weekendActualMinutes(key) + " 分钟");

        boolean fridayDone = weekend.optBoolean("fridayDone", false);
        styleMilestone(fridayMilestone, fridayMilestoneNumber, fridayDone, false);
        fridayMilestoneStatus.setText(fridayDone
                ? fallbackTime(weekend, "fridayDoneAt") + " 完成，获得 ¥0.50 部分"
                : "完成计划中的周五部分，可得 ¥0.50");
        boolean morningDone = weekend.optBoolean("saturdayMorningDone", false);
        styleMilestone(saturdayMorningMilestone, saturdayMorningMilestoneNumber, morningDone, false);
        saturdayMorningMilestoneStatus.setText(morningDone
                ? fallbackTime(weekend, "saturdayMorningDoneAt") + " 按计划完成"
                : "按自己制定的上午计划执行");
        boolean allDone = hasText(weekend, "allDoneDate");
        boolean failed = weekend.optBoolean("penaltyConfirmed", false) && !allDone;
        styleMilestone(saturdayMilestone, saturdayMilestoneNumber, allDone, failed);
        saturdayMilestoneStatus.setText(allDone
                ? formatShortDate(weekend.optString("allDoneDate")) + " " + weekend.optString("allDoneTime", "") + " 全部完成"
                : failed ? "周日结束仍未完成，扣 ¥0.50"
                : weekend.optString("targetTime", "18:00") + " 前完成，可得 ¥1.00");

        Result result = weekendResultFor(key, weekend);
        weekendResultPanel.setVisibility(result == null ? View.GONE : View.VISIBLE);
        if (result != null) {
            weekendResultLabel.setText(result.label);
            weekendResultAmount.setText(amountText(result.amount));
            weekendResultAmount.setTextColor(amountColor(result.amount));
            int fill = result.amount < 0 ? RED_SOFT : result.amount == 0 ? AMBER_SOFT : GREEN_SOFT;
            weekendResultPanel.setBackground(rounded(fill, 12, fill, 0));
        }

        if (!weekend.optBoolean("planSaved")) weekendStatusView.setText("等待制定计划");
        else if (!weekendOrderSaved(weekend)) weekendStatusView.setText("等待确定闯关顺序");
        else if (result != null) weekendStatusView.setText("本周末已结算");
        else if (currentDate.equals(key)) weekendStatusView.setText("执行周五安排");
        else if (currentDate.equals(saturday)) weekendStatusView.setText("周六完成学校作业");
        else weekendStatusView.setText("周日缓冲与收尾");

        weekendActionContainer.removeAllViews();
        if (weekend.optBoolean("planSaved") && weekendOrderSaved(weekend) && confirmed) {
            if (!fridayDone) addWeekendAction(currentDate.equals(key) ? "完成周五安排" : "补记周五已完成",
                    false, false, () -> performWeekendAction("fridayDone"));
            else addWeekendAction("撤销周五完成", false, false, () -> performWeekendAction("undoFriday"));
            if (currentDate.compareTo(saturday) >= 0 && !morningDone && !allDone) {
                addWeekendAction("完成周六上午安排", false, false, () -> performWeekendAction("morningDone"));
            } else if (morningDone && !allDone) {
                addWeekendAction("撤销上午完成", false, false, () -> performWeekendAction("undoMorning"));
            }
            if (!allDone && !failed && (currentDate.compareTo(saturday) >= 0 || fridayDone)) {
                addWeekendAction("学校作业全部完成", true, false, () -> performWeekendAction("allDone"));
            } else if (allDone) {
                addWeekendAction("撤销全部完成", false, false, () -> performWeekendAction("undoAll"));
            }
            if (currentDate.equals(sunday) && !allDone && !failed) {
                addWeekendAction("周日仍未完成", false, true, () -> confirmWeekendPenalty());
            } else if (failed) {
                addWeekendAction("撤销未完成结算", false, false, () -> performWeekendAction("undoPenalty"));
            }
        }
    }

    private void toggleWeekendField(String field, String timeField, String message) {
        JSONObject weekend = weekendForDate(currentDate, true);
        if ("confirmed".equals(field) && weekend.optBoolean("confirmed") && activeTask(false) != null) {
            toast("请先暂停当前作业再修改清单");
            return;
        }
        boolean checked = !weekend.optBoolean(field, false);
        put(weekend, field, checked);
        if (timeField != null) {
            if (checked) put(weekend, timeField, currentTime()); else weekend.remove(timeField);
        }
        cleanupWeekend();
        saveWeekends();
        renderAll();
        toast(message);
    }

    private void saveWeekendPlan() {
        JSONObject weekend = weekendForDate(currentDate, true);
        if (!weekend.optBoolean("confirmed", false)) {
            toast("请先确认周末作业已经全部核对");
            return;
        }
        int friday = planValue(fridayPlanInput);
        int morning = planValue(saturdayMorningInput);
        int afternoon = planValue(saturdayAfternoonInput);
        if (friday + morning + afternoon <= 0) {
            toast("请填写至少一个计划时段");
            return;
        }
        put(weekend, "fridayMinutes", friday);
        put(weekend, "saturdayMorningMinutes", morning);
        put(weekend, "saturdayAfternoonMinutes", afternoon);
        put(weekend, "targetTime", saturdayTargetButton.getText().toString());
        put(weekend, "planSaved", true);
        saveWeekends();
        renderAll();
        toast("周末计划已保存");
    }

    private void performWeekendAction(String action) {
        JSONObject weekend = weekendForDate(currentDate, true);
        if (!weekend.optBoolean("planSaved") || !weekend.optBoolean("confirmed")) {
            toast("请先确认作业并保存周末计划");
            return;
        }
        if ("fridayDone".equals(action)) {
            put(weekend, "fridayDone", true);
            put(weekend, "fridayDoneAt", currentTime());
            toast("周五安排已完成");
        } else if ("undoFriday".equals(action)) {
            weekend.remove("fridayDone");
            weekend.remove("fridayDoneAt");
            toast("已撤销周五完成");
        } else if ("morningDone".equals(action)) {
            put(weekend, "saturdayMorningDone", true);
            put(weekend, "saturdayMorningDoneAt", currentTime());
            toast("周六上午安排已完成");
        } else if ("undoMorning".equals(action)) {
            weekend.remove("saturdayMorningDone");
            weekend.remove("saturdayMorningDoneAt");
            toast("已撤销上午完成");
        } else if ("allDone".equals(action)) {
            if (taskArray(false).length() > 0 && !allTasksDone()) {
                toast("清单里还有作业没有完成");
                return;
            }
            String key = weekendKeyFor(currentDate);
            if (key != null && currentDate.compareTo(addDays(key, 1)) >= 0
                    && !weekend.optBoolean("saturdayMorningDone")) {
                put(weekend, "saturdayMorningDone", true);
                put(weekend, "saturdayMorningDoneAt", currentTime());
            }
            put(weekend, "allDoneDate", currentDate);
            put(weekend, "allDoneTime", currentTime());
            weekend.remove("penaltyConfirmed");
            toast("学校的一次性作业已全部完成");
        } else if ("undoAll".equals(action)) {
            weekend.remove("allDoneDate");
            weekend.remove("allDoneTime");
            toast("已撤销全部完成");
        } else if ("penalty".equals(action)) {
            put(weekend, "penaltyConfirmed", true);
            toast("周末未完成已结算");
        } else if ("undoPenalty".equals(action)) {
            weekend.remove("penaltyConfirmed");
            toast("已撤销未完成结算");
        }
        saveWeekends();
        renderAll();
    }

    private void confirmWeekendPenalty() {
        new AlertDialog.Builder(this)
                .setTitle("确认周末未完成")
                .setMessage("确认到周日结束学校作业仍未完成吗？")
                .setNegativeButton("取消", null)
                .setPositiveButton("确认", (dialog, which) -> performWeekendAction("penalty"))
                .show();
    }

    private void showWeekendTargetPicker() {
        String value = saturdayTargetButton.getText().toString();
        int hour = minutes(value) / 60;
        int minute = minutes(value) % 60;
        new TimePickerDialog(this, (view, selectedHour, selectedMinute) ->
                saturdayTargetButton.setText(String.format(Locale.CHINA, "%02d:%02d", selectedHour, selectedMinute)),
                hour, minute, true).show();
    }

    private void updateWeekendPlannedTotal() {
        if (plannedTotalView == null) return;
        int total = planValue(fridayPlanInput) + planValue(saturdayMorningInput) + planValue(saturdayAfternoonInput);
        plannedTotalView.setText("共 " + total + " 分钟");
    }

    private int planValue(EditText input) {
        try {
            int value = Integer.parseInt(input.getText().toString().trim());
            return Math.max(0, Math.min(300, value));
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private void addWeekendAction(String label, boolean primary, boolean danger, Runnable runnable) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(12);
        button.setTextColor(primary ? Color.WHITE : danger ? RED : GREEN);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        int fill = primary ? GREEN : danger ? RED_SOFT : GREEN_SOFT;
        int stroke = primary ? GREEN : danger ? Color.rgb(238, 166, 176) : Color.rgb(156, 188, 245);
        button.setBackground(rounded(fill, 11, stroke, 1));
        button.setOnClickListener(v -> runnable.run());
        LinearLayout.LayoutParams params = matchFixed(dp(44));
        if (weekendActionContainer.getChildCount() > 0) params.topMargin = dp(7);
        weekendActionContainer.addView(button, params);
    }

    private void styleWeekendCheck(LinearLayout card, TextView check, boolean selected) {
        card.setBackground(rounded(selected ? GREEN_SOFT : Color.WHITE, 14,
                selected ? Color.rgb(156, 188, 245) : LINE, 1));
        check.setTextColor(selected ? Color.WHITE : Color.TRANSPARENT);
        check.setBackground(rounded(selected ? GREEN : PAGE, 18, selected ? GREEN : LINE, 1));
    }

    private void styleMilestone(LinearLayout card, TextView badge, boolean done, boolean failed) {
        int fill = failed ? RED_SOFT : done ? GREEN_SOFT : PAGE;
        int stroke = failed ? Color.rgb(238, 166, 176) : done ? Color.rgb(156, 188, 245) : LINE;
        int accent = failed ? RED : done ? GREEN : MUTED;
        card.setBackground(rounded(fill, 13, stroke, 1));
        badge.setTextColor(done || failed ? Color.WHITE : MUTED);
        badge.setBackground(rounded(done || failed ? accent : Color.WHITE, 18, stroke, 1));
    }

    private String valueOrBlank(JSONObject object, String key) {
        return object.has(key) ? String.valueOf(object.optInt(key, 0)) : "";
    }

    private void togglePrep(String field, String timeField, String message) {
        JSONObject record = currentRecord(true);
        boolean checked = !record.optBoolean(field, false);
        put(record, field, checked);
        if (checked) put(record, timeField, currentTime()); else record.remove(timeField);
        if ("ledgerConfirmed".equals(field) && taskArray(false).length() > 0 && allTasksDone()) {
            if (checked) {
                put(record, "finishTime", hasText(record, "tasksFinishedAt")
                        ? record.optString("tasksFinishedAt") : currentTime());
                Result result = resultFor(record);
                String kind = result.amount < 0 ? "扣款" : result.amount == 0 ? "结算" : "奖励";
                message = "成长记录册已补全，自动" + kind + " " + amountText(result.amount);
            } else {
                record.remove("finishTime");
            }
        }
        cleanupCurrentRecord();
        saveRecords();
        renderAll();
        toast(message);
    }

    private List<String> sportActivities(JSONObject record) {
        List<String> selected = new ArrayList<>();
        JSONArray stored = record == null ? null : record.optJSONArray("sportActivities");
        if (stored != null) {
            for (String activity : SPORTS) {
                for (int index = 0; index < stored.length(); index++) {
                    String savedActivity = stored.optString(index);
                    if (activity.equals(savedActivity)
                            || ("50米".equals(activity) && "50米跑".equals(savedActivity))) {
                        selected.add(activity);
                        break;
                    }
                }
            }
        } else if (record != null && record.optBoolean("ropeDone", false)) {
            selected.add("跳绳");
        }
        return selected;
    }

    private void toggleSport(String activity) {
        JSONObject record = currentRecord(true);
        List<String> selected = sportActivities(record);
        boolean removing = selected.remove(activity);
        if (!removing) selected.add(activity);
        JSONArray stored = new JSONArray();
        for (String sport : SPORTS) if (selected.contains(sport)) stored.put(sport);
        if (stored.length() > 0) {
            put(record, "sportActivities", stored);
            if (!hasText(record, "sportAt")) put(record, "sportAt", currentTime());
        } else {
            record.remove("sportActivities");
            record.remove("sportAt");
        }
        record.remove("ropeDone");
        record.remove("ropeAt");
        cleanupCurrentRecord();
        saveRecords();
        renderAll();
        toast(removing ? "已取消" + activity : activity + "已打卡");
    }

    private void performAction(String action) {
        JSONObject record = currentRecord(true);
        String now = currentTime();
        boolean weekendMode = weekendKeyFor(currentDate) != null;
        if ("replaceLegacy".equals(action)) {
            record.remove("ruleId");
            saveAndRender("可以开始记录今天的流程了");
        } else if ("start".equals(action)) {
            put(record, "startTime", now);
            saveAndRender(weekendMode ? "本段作业已开始" : "饭前作业已开始");
        } else if ("dinner".equals(action)) {
            JSONObject active = activeTask(false);
            if (active != null) stopTaskClock(active, "paused");
            put(record, "dinnerTime", now);
            saveWeekends();
            saveAndRender(weekendMode ? "已暂停休息" : "已暂停，安心吃饭吧");
        } else if ("resume".equals(action)) {
            put(record, "resumeTime", now);
            saveAndRender(weekendMode ? "已继续作业" : "饭后作业已继续");
        } else if ("finish".equals(action)) {
            JSONObject weekend = weekendForDate(currentDate, false);
            JSONArray tasks = taskArray(false);
            if (activeTask(false) != null) {
                toast("请先暂停或完成当前作业");
                return;
            }
            if (tasks.length() > 0 && !taskListConfirmed()) {
                toast("请先确认作业清单");
                return;
            }
            if (!weekendMode && tasks.length() > 0 && !allTasksDone()) {
                toast("还有作业没有完成");
                return;
            }
            if (weekendMode && (weekend == null || !weekend.optBoolean("confirmed")
                    || !weekend.optBoolean("planSaved"))) {
                toast("请先确认作业并保存周末计划");
                return;
            }
            if (!weekendMode && !record.optBoolean("ledgerConfirmed", false)) {
                toast("请先核对钉钉，并补全成长记录册");
                return;
            }
            put(record, "finishTime", now);
            record.remove("ruleId");
            if (weekendMode) {
                saveAndRender("今天的作业时段已结束");
            } else {
                Result result = resultFor(record);
                String kind = result.amount < 0 ? "扣款" : result.amount == 0 ? "不奖不罚" : "奖励";
                saveAndRender("已完成，今日" + kind + " " + amountText(result.amount));
            }
        }
    }

    private void saveAndRender(String message) {
        saveRecords();
        renderAll();
        toast(message);
    }

    private void renderAll() {
        boolean viewingToday = currentDate.equals(todayIso());
        historicalDateNotice.setVisibility(viewingToday ? View.GONE : View.VISIBLE);
        historicalDateLabel.setText(viewingToday ? "" : formatLongDate(currentDate));
        renderWeekend();
        renderTasks();
        renderWeekendTaskPlanner();
        renderCurrent();
        renderHistoryAndSummary();
    }

    private void renderCurrent() {
        JSONObject record = currentRecord(false);
        if (record == null) record = new JSONObject();
        boolean weekendMode = weekendKeyFor(currentDate) != null;
        JSONArray tasks = taskArray(false);
        JSONObject activeTask = activeTask(false);
        boolean tasksConfirmed = taskListConfirmed();
        boolean tasksDone = allTasksDone();
        recordHeadingView.setText(currentDate.equals(todayIso())
                ? "今天我也会一步一步完成！" : formatShortDate(currentDate) + "的记录");
        finishLabelView.setText(weekendMode ? "结束今日时段" : "全部完成");
        startLabelView.setText(weekendMode ? "开始本段作业" : "开始饭前作业");
        dinnerLabelView.setText(weekendMode ? "暂停休息" : "吃饭暂停");
        resumeLabelView.setText(weekendMode ? "继续作业" : "饭后继续");

        List<String> selectedSports = sportActivities(record);
        boolean sportDone = !selectedSports.isEmpty();
        sportCard.setBackground(rounded(sportDone ? GREEN_SOFT : Color.WHITE, 15,
                sportDone ? Color.rgb(156, 188, 245) : LINE, 1));
        sportCheckView.setTextColor(sportDone ? Color.WHITE : Color.TRANSPARENT);
        sportCheckView.setBackground(rounded(sportDone ? GREEN : PAGE, 20, sportDone ? GREEN : LINE, 1));
        sportStatusView.setText(sportDone
                ? (hasText(record, "sportAt") ? record.optString("sportAt") : fallbackTime(record, "ropeAt"))
                + " 完成：" + android.text.TextUtils.join("、", selectedSports)
                : "选择今天完成的运动");
        for (int index = 0; index < sportButtons.size(); index++) {
            Button button = sportButtons.get(index);
            boolean selected = selectedSports.contains(SPORTS[index]);
            button.setTextColor(selected ? Color.WHITE : MUTED);
            button.setTypeface(Typeface.DEFAULT, selected ? Typeface.BOLD : Typeface.NORMAL);
            button.setBackground(rounded(selected ? GREEN : Color.WHITE, 18, selected ? GREEN : LINE, 1));
        }
        boolean readingDone = record.optBoolean("readingDone", false);
        boolean mathThinkingDone = record.optBoolean("mathThinkingDone", false);
        boolean englishReadingDone = record.optBoolean("englishReadingDone", false);
        stylePrep(readingCard, readingCheckView, readingDone);
        stylePrep(mathThinkingCard, mathThinkingCheckView, mathThinkingDone);
        stylePrep(englishReadingCard, englishReadingCheckView, englishReadingDone);
        styleHabitAction(readingActionView, readingDone);
        styleHabitAction(mathThinkingActionView, mathThinkingDone);
        styleHabitAction(englishReadingActionView, englishReadingDone);
        readingStatusView.setText(readingDone
                ? fallbackTime(record, "readingAt") + " 完成中文阅读" : "完成中文阅读后打卡");
        mathThinkingStatusView.setText(mathThinkingDone
                ? fallbackTime(record, "mathThinkingAt") + " 完成数学思维"
                : "完成数学思维练习后打卡");
        englishReadingStatusView.setText(englishReadingDone
                ? fallbackTime(record, "englishReadingAt") + " 完成英文阅读"
                : "完成英文阅读后打卡");
        int dailyDoneCount = (sportDone ? 1 : 0) + (readingDone ? 1 : 0)
                + (mathThinkingDone ? 1 : 0) + (englishReadingDone ? 1 : 0);
        dailyCheckinsSummaryView.setText(dailyDoneCount == 4
                ? "4 / 4 已完成 · 我今天也坚持下来啦"
                : dailyDoneCount + " / 4 已完成 · "
                + (dailyDoneCount > 0 ? "我再完成一项" : "我做完作业再来打卡"));
        dailyCheckinsToggle.setBackground(rounded(dailyDoneCount == 4
                        ? Color.rgb(239, 251, 247) : Color.rgb(248, 251, 255),
                17, dailyDoneCount == 4 ? Color.rgb(159, 214, 197) : LINE, 1));
        dailyCheckinsBody.setVisibility(dailyCheckinsExpanded ? View.VISIBLE : View.GONE);
        dailyCheckinsArrowView.setText(dailyCheckinsExpanded ? "⌃" : "⌄");

        boolean ledgerConfirmed = record.optBoolean("ledgerConfirmed", false);
        stylePrep(ledgerCard, ledgerCheckView, ledgerConfirmed);
        String weekendKey = weekendKeyFor(currentDate);
        ledgerCard.setVisibility(weekendKey != null && !currentDate.equals(weekendKey) ? View.GONE : View.VISIBLE);
        ledgerTitleView.setText(ledgerConfirmed ? "我已核对钉钉，也补全了成长记录册" : "核对钉钉，补全成长记录册");
        ledgerStatusView.setText(ledgerConfirmed
                ? fallbackTime(record, "ledgerAt") + " 完成" : "把钉钉里新增的作业补充进去");
        ViewGroup.LayoutParams ledgerParams = ledgerCard.getLayoutParams();
        if (ledgerParams != null) {
            ledgerParams.height = dp(ledgerConfirmed ? 56 : 72);
            ledgerCard.setLayoutParams(ledgerParams);
        }

        String start = record.optString("startTime", "");
        String dinner = record.optString("dinnerTime", "");
        String resume = record.optString("resumeTime", "");
        String finish = record.optString("finishTime", "");
        startTimeView.setText(orDash(start));
        dinnerTimeView.setText(orDash(dinner));
        resumeTimeView.setText(orDash(resume));
        finishTimeView.setText(orDash(finish));
        focusView.setText(focusDuration(record, currentDate.equals(todayIso())) + " 分钟");
        styleDot(startDot, !start.isEmpty(), start.isEmpty());
        styleDot(dinnerDot, !dinner.isEmpty(), !start.isEmpty() && dinner.isEmpty() && finish.isEmpty());
        styleDot(resumeDot, !resume.isEmpty(), !dinner.isEmpty() && resume.isEmpty() && finish.isEmpty());
        styleDot(finishDot, !finish.isEmpty(), !resume.isEmpty() && finish.isEmpty());

        actionContainer.removeAllViews();
        boolean legacy = hasText(record, "ruleId") && finish.isEmpty();
        if (legacy) {
            sessionStatusView.setText("旧版手动记录");
            addAction("改为流程记录", false, () -> performAction("replaceLegacy"));
        } else if (start.isEmpty()) {
            sessionStatusView.setText(tasks.length() > 0
                    ? tasksConfirmed ? "从清单选择一项开始" : "先确认作业清单" : "尚未开始");
            if (tasks.length() == 0) {
                addAction(weekendMode ? "开始本段作业" : "开始饭前作业", true, () -> performAction("start"));
            }
        } else if (!finish.isEmpty()) {
            sessionStatusView.setText(weekendMode ? finish + " 今日时段已结束" : finish + " 已全部完成");
        } else if (tasks.length() > 0 && activeTask != null) {
            sessionStatusView.setText("专注：" + activeTask.optString("subject", "其他") + " "
                    + activeTask.optString("title", "作业"));
            if (dinner.isEmpty()) {
                addAction(weekendMode ? "暂停休息" : "吃饭暂停", false, () -> performAction("dinner"));
            }
        } else if (tasks.length() > 0) {
            if (!dinner.isEmpty() && resume.isEmpty()) {
                sessionStatusView.setText(weekendMode ? "正在休息" : "正在吃饭休息");
            } else if (tasksDone) {
                sessionStatusView.setText(weekendMode ? "今日清单已完成" : "清单已完成，检查后结算");
            } else {
                sessionStatusView.setText("已暂停，选择一项继续");
            }
            if (dinner.isEmpty() && !tasksDone) {
                addAction(weekendMode ? "暂停休息" : "吃饭暂停", false, () -> performAction("dinner"));
            }
            if ((weekendMode || tasksDone) && !(!dinner.isEmpty() && resume.isEmpty())) {
                addAction(weekendMode ? "结束今日时段" : "全部完成", true, () -> performAction("finish"));
            }
        } else if (dinner.isEmpty()) {
            sessionStatusView.setText(weekendMode ? "本段作业进行中" : "饭前作业进行中");
            addAction(weekendMode ? "暂停休息" : "吃饭暂停", false, () -> performAction("dinner"));
            addAction(weekendMode ? "结束今日时段" : "全部完成", true, () -> performAction("finish"));
        } else if (resume.isEmpty()) {
            sessionStatusView.setText(weekendMode ? "正在休息" : "正在吃饭休息");
            addAction(weekendMode ? "继续写作业" : "饭后继续写作业", true, () -> performAction("resume"));
        } else {
            sessionStatusView.setText(weekendMode ? "作业继续进行中" : "饭后作业进行中");
            addAction(weekendMode ? "结束今日时段" : "全部完成", true, () -> performAction("finish"));
        }

        Result result = weekendMode && !includeDailyInLedger(currentDate, record) ? null : resultFor(record);
        resultPanel.setVisibility(result == null ? View.GONE : View.VISIBLE);
        if (result != null) {
            resultLabelView.setText(result.label);
            resultAmountView.setText(amountText(result.amount));
            int fill = result.amount < 0 ? RED_SOFT : result.amount == 0 ? AMBER_SOFT : GREEN_SOFT;
            resultPanel.setBackground(rounded(fill, 13, fill, 0));
            resultAmountView.setTextColor(amountColor(result.amount));
        }

        loadingNote = true;
        noteInput.setText(record.optString("note", ""));
        noteInput.setSelection(noteInput.length());
        loadingNote = false;
    }

    private void renderHistoryAndSummary() {
        List<String> dailyDates = activeDates();
        List<String> weekendKeys = activeWeekendKeys();
        int completed = 0;
        int rewarded = 0;
        double total = 0;
        double deductions = 0;
        for (String date : dailyDates) {
            JSONObject record = records.optJSONObject(date);
            if (!includeDailyInLedger(date, record)) continue;
            Result result = resultFor(record);
            if (result == null) continue;
            completed++;
            total += result.amount;
            if (result.amount > 0) rewarded++;
            if (result.amount < 0) deductions += Math.abs(result.amount);
        }
        for (String key : weekendKeys) {
            JSONObject weekend = weekends.optJSONObject(key);
            Result result = weekendResultFor(key, weekend);
            if (result == null) continue;
            completed++;
            total += result.amount;
            if (result.amount > 0) rewarded++;
            if (weekend.optBoolean("penaltyConfirmed") && !hasText(weekend, "allDoneDate")) {
                deductions += 0.5;
            }
        }
        balanceView.setText(total < 0
                ? String.format(Locale.CHINA, "− ¥ %.2f", Math.abs(total))
                : String.format(Locale.CHINA, "¥ %.2f", total));
        balanceView.setTextColor(total < 0 ? Color.rgb(255, 213, 206) : Color.WHITE);
        periodView.setText("全部成长记录");
        completedDaysView.setText(String.valueOf(completed));
        rewardDaysView.setText(String.valueOf(rewarded));
        deductionView.setText(String.format(Locale.CHINA, "¥%.2f", deductions));

        List<String> entries = new ArrayList<>();
        for (String date : dailyDates) {
            if (includeDailyInLedger(date, records.optJSONObject(date))) entries.add("D|" + date);
        }
        for (String key : weekendKeys) entries.add("W|" + key);
        Collections.sort(entries, (first, second) -> second.substring(2).compareTo(first.substring(2)));
        historyList.removeAllViews();
        emptyHistoryView.setVisibility(entries.isEmpty() ? View.VISIBLE : View.GONE);
        for (int index = 0; index < entries.size(); index++) {
            String entry = entries.get(index);
            String date = entry.substring(2);
            historyList.addView(entry.startsWith("W|")
                    ? buildWeekendHistoryRow(date, weekends.optJSONObject(date))
                    : buildHistoryRow(date, records.optJSONObject(date)));
            if (index < entries.size() - 1) historyList.addView(divider());
        }
        renderWeeklyReview();
    }

    private void renderWeeklyReview() {
        if (weeklyReviewRangeView == null) return;
        Calendar today = calendarFromIso(todayIso());
        int offset = (today.get(Calendar.DAY_OF_WEEK) + 5) % 7;
        String weekStart = addDays(todayIso(), -offset);
        String weekEnd = addDays(weekStart, 6);
        List<JSONObject> plannedTasks = new ArrayList<>();
        List<String> plannedDates = new ArrayList<>();

        Iterator<String> recordKeys = records.keys();
        while (recordKeys.hasNext()) {
            String date = recordKeys.next();
            if (date.compareTo(weekStart) < 0 || date.compareTo(weekEnd) > 0) continue;
            JSONObject record = records.optJSONObject(date);
            JSONArray tasks = record == null ? null : record.optJSONArray("tasks");
            if (tasks == null) continue;
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null) {
                    plannedTasks.add(task);
                    plannedDates.add(date);
                }
            }
        }
        Iterator<String> weekendKeys = weekends.keys();
        while (weekendKeys.hasNext()) {
            String key = weekendKeys.next();
            JSONObject weekend = weekends.optJSONObject(key);
            JSONArray tasks = weekend == null ? null : weekend.optJSONArray("tasks");
            if (tasks == null) continue;
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task == null) continue;
                String plannedDate = plannedDateForTask(key, task);
                if (plannedDate.compareTo(weekStart) >= 0 && plannedDate.compareTo(weekEnd) <= 0) {
                    plannedTasks.add(task);
                    plannedDates.add(plannedDate);
                }
            }
        }

        List<String> uniqueDays = new ArrayList<>();
        for (String date : plannedDates) if (!uniqueDays.contains(date)) uniqueDays.add(date);
        int onPlanDays = 0;
        for (String date : uniqueDays) {
            boolean allOnPlan = true;
            for (int index = 0; index < plannedTasks.size(); index++) {
                if (!date.equals(plannedDates.get(index))) continue;
                JSONObject task = plannedTasks.get(index);
                if (!"done".equals(task.optString("status"))
                        || hasText(task, "completedDate") && task.optString("completedDate").compareTo(date) > 0) {
                    allOnPlan = false;
                    break;
                }
            }
            if (allOnPlan) onPlanDays++;
        }
        int estimated = 0;
        int actual = 0;
        int completed = 0;
        for (JSONObject task : plannedTasks) {
            if (!"done".equals(task.optString("status"))) continue;
            completed++;
            estimated += estimatedMinutes(task);
            actual += taskActualMinutes(task);
        }
        weeklyReviewRangeView.setText(formatShortDate(weekStart) + "—" + formatShortDate(weekEnd));
        weeklyPlanDaysView.setText(onPlanDays + " 天");
        weeklyEstimatedTimeView.setText(estimated + " 分钟");
        weeklyActualTimeView.setText(actual + " 分钟");
        if (completed == 0) {
            weeklyReviewInsightView.setText("完成几项作业后，我就能更了解自己的时间。");
            return;
        }
        int difference = actual - estimated;
        int tolerance = Math.max(5, Math.round(estimated * 0.2f));
        if (Math.abs(difference) <= tolerance) {
            weeklyReviewInsightView.setText("这周的预计时间和实际时间很接近，我估得越来越准了。");
        } else if (difference > 0) {
            weeklyReviewInsightView.setText("这些作业比预计多用了 " + difference
                    + " 分钟，下次我要给长作业多留一点时间。");
        } else {
            weeklyReviewInsightView.setText("这些作业比预计少用了 " + Math.abs(difference)
                    + " 分钟，我越来越了解自己的速度了。");
        }
    }

    private View buildHistoryRow(String date, JSONObject record) {
        LinearLayout row = vertical();
        row.setPadding(0, dp(13), 0, dp(11));
        Result result = resultFor(record);
        LinearLayout top = horizontal();
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.addView(text(formatLongDate(date), 14, INK, true), weightedWrap(1));
        TextView amount = text(result == null ? "进行中" : amountText(result.amount), 15,
                result == null ? MUTED : amountColor(result.amount), true);
        top.addView(amount);
        row.addView(top, matchWrap());

        TextView status = text(latestStatus(record), 12, MUTED, false);
        status.setPadding(0, dp(4), 0, dp(2));
        row.addView(status);
        String note = record.optString("note", "").trim();
        if (!note.isEmpty()) row.addView(text(note, 12, MUTED, false));

        LinearLayout actions = horizontal();
        actions.setGravity(Gravity.END);
        Button view = textButton("查看");
        view.setOnClickListener(v -> {
            showMainPage();
            selectDate(date);
            toast("已打开这一天的记录");
        });
        Button delete = textButton("删除");
        delete.setTextColor(RED);
        delete.setOnClickListener(v -> confirmDelete(date));
        actions.addView(view);
        if (historyManageMode) actions.addView(delete);
        row.addView(actions, matchWrap());
        return row;
    }

    private View buildWeekendHistoryRow(String key, JSONObject weekend) {
        LinearLayout row = vertical();
        row.setPadding(0, dp(13), 0, dp(11));
        Result result = weekendResultFor(key, weekend);
        LinearLayout top = horizontal();
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.addView(text(formatShortDate(key) + "周末", 14, INK, true), weightedWrap(1));
        TextView amount = text(result == null ? "进行中" : amountText(result.amount), 15,
                result == null ? MUTED : amountColor(result.amount), true);
        top.addView(amount);
        row.addView(top, matchWrap());

        String status;
        if (hasText(weekend, "allDoneDate")) {
            status = formatShortDate(weekend.optString("allDoneDate")) + " "
                    + weekend.optString("allDoneTime", "") + " 全部完成";
        } else if (weekend.optBoolean("penaltyConfirmed")) {
            status = "周日结束仍未完成";
        } else if (weekend.optBoolean("planSaved") && weekendOrderSaved(weekend)) {
            status = "三天计划已制定，正在闯关";
        } else if (weekend.optBoolean("planSaved")) {
            status = "等待确定闯关顺序";
        } else {
            status = "等待周五安排";
        }
        TextView statusView = text(status, 12, MUTED, false);
        statusView.setPadding(0, dp(4), 0, dp(2));
        row.addView(statusView);
        if (result != null) row.addView(text(result.label, 12, MUTED, false));

        LinearLayout actions = horizontal();
        actions.setGravity(Gravity.END);
        Button view = textButton("查看");
        view.setOnClickListener(v -> {
            String sunday = addDays(key, 2);
            String target = todayIso().compareTo(key) >= 0 && todayIso().compareTo(sunday) <= 0
                    ? todayIso() : todayIso().compareTo(sunday) > 0 ? sunday : key;
            showMainPage();
            selectDate(target);
            toast("已打开本周末计划");
        });
        Button delete = textButton("删除");
        delete.setTextColor(RED);
        delete.setOnClickListener(v -> confirmDeleteWeekend(key));
        actions.addView(view);
        if (historyManageMode) actions.addView(delete);
        row.addView(actions, matchWrap());
        return row;
    }

    private String latestStatus(JSONObject record) {
        if (hasText(record, "finishTime")) {
            return record.optString("finishTime") + " 完成 · 有效 " + focusDuration(record, false) + " 分钟";
        }
        if (hasText(record, "ruleId")) return "旧版手动记录";
        if (hasText(record, "resumeTime")) return record.optString("resumeTime") + " 饭后继续，进行中";
        if (hasText(record, "dinnerTime")) return record.optString("dinnerTime") + " 吃饭暂停";
        if (hasText(record, "startTime")) return record.optString("startTime") + " 开始，进行中";
        if (record.optBoolean("ledgerConfirmed")) return "成长记录册已补全";
        List<String> dailyCheckins = new ArrayList<>();
        if (!sportActivities(record).isEmpty()) dailyCheckins.add("运动");
        if (record.optBoolean("readingDone")) dailyCheckins.add("中文阅读");
        if (record.optBoolean("mathThinkingDone")) dailyCheckins.add("数学思维");
        if (record.optBoolean("englishReadingDone")) dailyCheckins.add("英文阅读");
        if (!dailyCheckins.isEmpty()) {
            return android.text.TextUtils.join("、", dailyCheckins) + "已打卡";
        }
        if (record.optBoolean("choresDone")) return "家务已打卡";
        if (taskCount(record) > 0) return "作业清单已录入";
        return "尚未开始";
    }

    private void showEditTimesDialog() {
        JSONObject record = currentRecord(false);
        final String[] values = new String[4];
        for (int i = 0; i < TIME_KEYS.length; i++) {
            values[i] = record == null ? "" : record.optString(TIME_KEYS[i], "");
        }
        boolean editingWeekend = weekendKeyFor(currentDate) != null;
        String[] labels = editingWeekend
                ? new String[]{"开始作业", "暂停休息", "继续作业", "结束今日时段"}
                : new String[]{"开始作业", "吃饭暂停", "饭后继续", "全部完成"};
        LinearLayout form = vertical();
        form.setPadding(dp(18), dp(4), dp(18), 0);
        for (int i = 0; i < labels.length; i++) {
            final int index = i;
            LinearLayout row = horizontal();
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.addView(text(labels[i], 13, INK, true), weightedWrap(1));
            Button valueButton = smallButton(values[i].isEmpty() ? "--:--" : values[i]);
            valueButton.setOnClickListener(v -> showTimePicker(values, index, valueButton));
            row.addView(valueButton);
            Button clear = textButton("清除");
            clear.setOnClickListener(v -> {
                values[index] = "";
                valueButton.setText("--:--");
            });
            row.addView(clear);
            form.addView(row, matchFixed(dp(52)));
        }

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("手动调整时间")
                .setView(form)
                .setNegativeButton("取消", null)
                .setPositiveButton("保存", null)
                .create();
        dialog.setOnShowListener(ignored -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String error = validateTimes(values);
            if (error != null) {
                toast(error);
                return;
            }
            JSONObject current = currentRecord(true);
            boolean weekendMode = weekendKeyFor(currentDate) != null;
            JSONObject weekend = weekendForDate(currentDate, false);
            if (!values[3].isEmpty() && activeTask(false) != null) {
                toast("请先暂停或完成当前作业");
                return;
            }
            if (!values[3].isEmpty() && !weekendMode && taskArray(false).length() > 0 && !allTasksDone()) {
                toast("还有作业没有完成");
                return;
            }
            if (!values[3].isEmpty() && weekendMode
                    && (weekend == null || !weekend.optBoolean("confirmed", false)
                    || !weekend.optBoolean("planSaved", false))) {
                toast("请先确认作业并保存周末计划");
                return;
            }
            if (!values[3].isEmpty() && !weekendMode && !current.optBoolean("ledgerConfirmed", false)) {
                toast("请先核对钉钉，并补全成长记录册");
                return;
            }
            boolean any = false;
            for (int i = 0; i < TIME_KEYS.length; i++) {
                if (values[i].isEmpty()) current.remove(TIME_KEYS[i]);
                else {
                    put(current, TIME_KEYS[i], values[i]);
                    any = true;
                }
            }
            if (any) current.remove("ruleId");
            cleanupCurrentRecord();
            saveRecords();
            renderAll();
            dialog.dismiss();
            toast("时间已调整");
        }));
        dialog.show();
    }

    private void showTimePicker(String[] values, int index, Button target) {
        Calendar now = Calendar.getInstance();
        int hour = now.get(Calendar.HOUR_OF_DAY);
        int minute = now.get(Calendar.MINUTE);
        if (!values[index].isEmpty()) {
            hour = minutes(values[index]) / 60;
            minute = minutes(values[index]) % 60;
        }
        new TimePickerDialog(this, (view, selectedHour, selectedMinute) -> {
            values[index] = String.format(Locale.CHINA, "%02d:%02d", selectedHour, selectedMinute);
            target.setText(values[index]);
        }, hour, minute, true).show();
    }

    private String validateTimes(String[] values) {
        int start = minutesOrMissing(values[0]);
        int dinner = minutesOrMissing(values[1]);
        int resume = minutesOrMissing(values[2]);
        int finish = minutesOrMissing(values[3]);
        if (finish >= 0 && start < 0) return "填写完成时间前，需要先填写开始时间";
        if (dinner >= 0 && start < 0) return "填写吃饭时间前，需要先填写开始时间";
        if (resume >= 0 && dinner < 0) return "填写饭后继续时间前，需要先填写吃饭时间";
        if (dinner >= 0 && resume < 0 && finish >= 0) return "有吃饭暂停时，需要填写饭后继续时间";
        int previous = -1;
        for (String value : values) {
            if (value.isEmpty()) continue;
            int current = minutes(value);
            if (previous > current) return "请调整时间顺序：开始、吃饭、继续、完成";
            previous = current;
        }
        return null;
    }

    private void confirmResetCurrent() {
        if (!isMeaningful(currentRecord(false))) {
            toast("这一天还没有记录");
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("清除当天记录")
                .setMessage("确定清除 " + formatLongDate(currentDate) + " 的全部记录吗？")
                .setNegativeButton("取消", null)
                .setPositiveButton("清除", (dialog, which) -> {
                    dismissTaskFocusDialog();
                    records.remove(currentDate);
                    saveRecords();
                    renderAll();
                    toast("当天记录已清除");
                }).show();
    }

    private void confirmDelete(String date) {
        new AlertDialog.Builder(this)
                .setTitle("删除记录")
                .setMessage("确定删除 " + formatLongDate(date) + " 的记录吗？")
                .setNegativeButton("取消", null)
                .setPositiveButton("删除", (dialog, which) -> {
                    records.remove(date);
                    saveRecords();
                    renderAll();
                    toast("记录已删除");
                }).show();
    }

    private void confirmDeleteWeekend(String key) {
        new AlertDialog.Builder(this)
                .setTitle("删除周末计划")
                .setMessage("确定删除 " + formatShortDate(key) + " 开始的周末计划吗？")
                .setNegativeButton("取消", null)
                .setPositiveButton("删除", (dialog, which) -> {
                    weekends.remove(key);
                    saveWeekends();
                    renderAll();
                    toast("周末计划已删除");
                }).show();
    }

    private View buildSettingsPage() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(PAGE);
        LinearLayout content = vertical();
        content.setPadding(dp(16), dp(22), dp(16), dp(28));
        scroll.addView(content, matchWrap());

        LinearLayout header = horizontal();
        header.setGravity(Gravity.CENTER_VERTICAL);
        Button back = smallButton("返回");
        back.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        back.setOnClickListener(v -> showMainPage());
        header.addView(back, fixed(dp(64), dp(40)));
        header.addView(spaceHorizontal(13));
        LinearLayout headerCopy = vertical();
        headerCopy.addView(text("设置", 25, GREEN_DARK, true));
        header.addView(headerCopy, weightedWrap(1));
        content.addView(header, matchWrap());
        content.addView(space(12));

        LinearLayout dateShortcut = horizontal();
        dateShortcut.setGravity(Gravity.CENTER_VERTICAL);
        dateShortcut.setPadding(dp(11), dp(5), dp(6), dp(5));
        dateShortcut.setBackground(rounded(Color.argb(185, 255, 255, 255), 12, LINE, 1));
        settingsCurrentDateView = text("", 10, MUTED, true);
        dateShortcut.addView(settingsCurrentDateView, weightedWrap(1));
        Button recordDate = smallButton("选择日期");
        recordDate.setOnClickListener(v -> showRecordDatePicker());
        dateShortcut.addView(recordDate, fixed(dp(86), dp(36)));
        dateShortcut.addView(spaceHorizontal(6));
        Button today = smallButton("今天");
        today.setOnClickListener(v -> selectDate(todayIso()));
        dateShortcut.addView(today, fixed(dp(62), dp(36)));
        content.addView(dateShortcut, matchFixed(dp(46)));
        content.addView(space(14));

        content.addView(buildTaskKeywordSettingsCard(), matchWrap());
        content.addView(space(14));

        LinearLayout alarmCard = card();
        alarmCard.addView(text("休息结束提醒", 19, INK, true));
        breakAlarmRecordButton = smallButton("🎙 开始录音");
        breakAlarmRecordButton.setOnClickListener(v -> toggleBreakAlarmRecording());
        LinearLayout.LayoutParams recordParams = matchFixed(dp(48));
        recordParams.topMargin = dp(13);
        alarmCard.addView(breakAlarmRecordButton, recordParams);
        LinearLayout previewRow = horizontal();
        breakAlarmPreviewButton = smallButton("🔊 试听默认提示");
        breakAlarmPreviewButton.setOnClickListener(v -> playBreakAlarm(1));
        previewRow.addView(breakAlarmPreviewButton, weightedFixed(1, dp(44)));
        previewRow.addView(spaceHorizontal(8));
        breakAlarmResetButton = smallButton("恢复默认");
        breakAlarmResetButton.setTextColor(RED);
        breakAlarmResetButton.setOnClickListener(v -> confirmResetBreakAlarm());
        previewRow.addView(breakAlarmResetButton, weightedFixed(1, dp(44)));
        LinearLayout.LayoutParams previewParams = matchFixed(dp(44));
        previewParams.topMargin = dp(8);
        alarmCard.addView(previewRow, previewParams);
        breakAlarmHintView = text("", 10, MUTED, false);
        breakAlarmHintView.setPadding(0, dp(9), 0, 0);
        breakAlarmHintView.setVisibility(View.GONE);
        alarmCard.addView(breakAlarmHintView);
        content.addView(alarmCard, matchWrap());
        content.addView(space(14));

        LinearLayout dataCard = card();
        dataCard.addView(text("本地数据", 10, GREEN, true));
        dataCard.addView(text("备份与恢复", 20, INK, true));
        Button export = smallButton("导出本地备份");
        export.setOnClickListener(v -> launchBackupExport());
        LinearLayout.LayoutParams exportParams = matchFixed(dp(46));
        exportParams.topMargin = dp(12);
        dataCard.addView(export, exportParams);
        Button restore = smallButton("从备份恢复");
        restore.setOnClickListener(v -> launchBackupImport());
        LinearLayout.LayoutParams restoreParams = matchFixed(dp(46));
        restoreParams.topMargin = dp(8);
        dataCard.addView(restore, restoreParams);
        TextView note = text("备份包含作业、计划、打卡、听写词语和作业关键词；提示音录音仅保存在当前设备。删除记录请进入“足迹—管理记录”。", 10, MUTED, false);
        note.setPadding(0, dp(11), 0, 0);
        note.setLineSpacing(dp(3), 1f);
        dataCard.addView(note);
        content.addView(dataCard, matchWrap());
        renderBreakAlarmSettings();
        return scroll;
    }

    private LinearLayout buildTaskKeywordSettingsCard() {
        LinearLayout keywordCard = card();
        keywordCard.addView(text("快捷录入", 10, GREEN, true));
        keywordCard.addView(text("作业关键词", 20, INK, true));
        TextView description = text("决定录作业时显示哪些词；内置词也可以隐藏、排序或删除。", 10, MUTED, false);
        description.setPadding(0, dp(6), 0, 0);
        description.setLineSpacing(dp(2), 1f);
        keywordCard.addView(description);

        taskKeywordSettingsSubjects = vertical();
        LinearLayout.LayoutParams subjectParams = matchWrap();
        subjectParams.topMargin = dp(12);
        keywordCard.addView(taskKeywordSettingsSubjects, subjectParams);

        taskKeywordSettingsList = vertical();
        LinearLayout.LayoutParams listParams = matchWrap();
        listParams.topMargin = dp(10);
        keywordCard.addView(taskKeywordSettingsList, listParams);

        LinearLayout addRow = horizontal();
        addRow.setGravity(Gravity.CENTER_VERTICAL);
        taskKeywordSettingsInput = new EditText(this);
        taskKeywordSettingsInput.setTextSize(13);
        taskKeywordSettingsInput.setTextColor(INK);
        taskKeywordSettingsInput.setHintTextColor(Color.rgb(150, 158, 173));
        taskKeywordSettingsInput.setHint("添加一个关键词");
        taskKeywordSettingsInput.setSingleLine(true);
        taskKeywordSettingsInput.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_DONE);
        taskKeywordSettingsInput.setFilters(new InputFilter[]{new InputFilter.LengthFilter(12)});
        taskKeywordSettingsInput.setPadding(dp(11), 0, dp(11), 0);
        taskKeywordSettingsInput.setBackground(rounded(Color.WHITE, 11, LINE, 1));
        taskKeywordSettingsInput.setOnEditorActionListener((view, actionId, event) -> {
            boolean enterPressed = event != null
                    && event.getKeyCode() == android.view.KeyEvent.KEYCODE_ENTER
                    && event.getAction() == android.view.KeyEvent.ACTION_DOWN;
            if (actionId != android.view.inputmethod.EditorInfo.IME_ACTION_DONE && !enterPressed) return false;
            addTaskKeywordSetting();
            return true;
        });
        addRow.addView(taskKeywordSettingsInput, weightedFixed(1, dp(43)));
        addRow.addView(spaceHorizontal(8));
        Button add = smallButton("添加");
        add.setTextColor(Color.WHITE);
        add.setBackground(rounded(GREEN, 11, GREEN, 0));
        add.setOnClickListener(v -> addTaskKeywordSetting());
        addRow.addView(add, fixed(dp(72), dp(43)));
        LinearLayout.LayoutParams addParams = matchFixed(dp(43));
        addParams.topMargin = dp(10);
        keywordCard.addView(addRow, addParams);

        TextView note = text("隐藏后不会出现在录入页；删除后仍可在这里重新添加。", 10, MUTED, false);
        note.setPadding(0, dp(9), 0, 0);
        keywordCard.addView(note);
        renderTaskKeywordSettings();
        return keywordCard;
    }

    private void renderTaskKeywordSettings() {
        if (taskKeywordSettingsSubjects == null || taskKeywordSettingsList == null) return;
        taskKeywordSettingsSubjects.removeAllViews();
        LinearLayout[] subjectRows = {horizontal(), horizontal()};
        for (int index = 0; index < TASK_SUBJECTS.length; index++) {
            String subject = TASK_SUBJECTS[index];
            boolean selected = subject.equals(selectedTaskKeywordSettingsSubject);
            Button subjectButton = new Button(this);
            subjectButton.setText(subject);
            subjectButton.setTextSize(12);
            subjectButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
            subjectButton.setAllCaps(false);
            subjectButton.setTextColor(selected ? Color.WHITE : taskSubjectColor(subject));
            subjectButton.setMinHeight(0);
            subjectButton.setMinimumHeight(0);
            subjectButton.setBackground(rounded(selected ? taskSubjectColor(subject)
                    : taskSubjectSoftColor(subject), 10, taskSubjectColor(subject), 1));
            subjectButton.setOnClickListener(v -> {
                selectedTaskKeywordSettingsSubject = subject;
                renderTaskKeywordSettings();
            });
            LinearLayout.LayoutParams params = weightedFixed(1, dp(40));
            if (index % 2 == 1) params.leftMargin = dp(7);
            subjectRows[index / 2].addView(subjectButton, params);
        }
        taskKeywordSettingsSubjects.addView(subjectRows[0], matchFixed(dp(40)));
        LinearLayout.LayoutParams secondRowParams = matchFixed(dp(40));
        secondRowParams.topMargin = dp(7);
        taskKeywordSettingsSubjects.addView(subjectRows[1], secondRowParams);

        taskKeywordSettingsList.removeAllViews();
        JSONArray keywords = taskKeywordArray(selectedTaskKeywordSettingsSubject);
        if (keywords.length() == 0) {
            TextView empty = text("这个科目还没有关键词，可以在下方添加", 11, MUTED, false);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(dp(8), dp(18), dp(8), dp(18));
            empty.setBackground(rounded(Color.TRANSPARENT, 12, LINE, 1));
            taskKeywordSettingsList.addView(empty, matchWrap());
            return;
        }
        for (int index = 0; index < keywords.length(); index++) {
            JSONObject entry = keywords.optJSONObject(index);
            if (entry == null) continue;
            String id = entry.optString("id");
            String label = entry.optString("label");
            boolean visible = entry.optBoolean("visible", true);
            LinearLayout row = horizontal();
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(10), dp(5), dp(6), dp(5));
            row.setBackground(rounded(Color.rgb(248, 251, 255), 11, LINE, 1));
            TextView name = text(label, 12, visible ? INK : MUTED, true);
            row.addView(name, weightedWrap(1));
            Button visibility = taskKeywordActionButton(visible ? "显示中" : "已隐藏",
                    visible ? Color.rgb(76, 109, 166) : MUTED);
            visibility.setOnClickListener(v -> changeTaskKeywordSetting(id, "toggle"));
            row.addView(visibility, fixed(dp(64), dp(32)));
            row.addView(spaceHorizontal(4));
            Button up = taskKeywordActionButton("↑", Color.rgb(76, 109, 166));
            up.setEnabled(index > 0);
            up.setOnClickListener(v -> changeTaskKeywordSetting(id, "up"));
            row.addView(up, fixed(dp(34), dp(32)));
            row.addView(spaceHorizontal(4));
            Button down = taskKeywordActionButton("↓", Color.rgb(76, 109, 166));
            down.setEnabled(index < keywords.length() - 1);
            down.setOnClickListener(v -> changeTaskKeywordSetting(id, "down"));
            row.addView(down, fixed(dp(34), dp(32)));
            row.addView(spaceHorizontal(4));
            Button delete = taskKeywordActionButton("删除", RED);
            delete.setOnClickListener(v -> changeTaskKeywordSetting(id, "delete"));
            row.addView(delete, fixed(dp(48), dp(32)));
            LinearLayout.LayoutParams rowParams = matchFixed(dp(44));
            if (index > 0) rowParams.topMargin = dp(7);
            taskKeywordSettingsList.addView(row, rowParams);
        }
    }

    private Button taskKeywordActionButton(String label, int color) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(10);
        button.setTextColor(color);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setMinWidth(0);
        button.setMinimumWidth(0);
        button.setPadding(0, 0, 0, 0);
        button.setBackground(rounded(Color.WHITE, 8, LINE, 1));
        return button;
    }

    private void addTaskKeywordSetting() {
        if (taskKeywordSettingsInput == null) return;
        String label = taskKeywordSettingsInput.getText().toString().trim();
        if (label.isEmpty()) {
            toast("请输入一个关键词");
            return;
        }
        JSONArray keywords = taskKeywordArray(selectedTaskKeywordSettingsSubject);
        for (int index = 0; index < keywords.length(); index++) {
            if (label.equals(keywords.optJSONObject(index).optString("label"))) {
                toast("这个关键词已经有了");
                return;
            }
        }
        JSONObject entry = new JSONObject();
        put(entry, "id", "custom-" + System.currentTimeMillis());
        put(entry, "label", label);
        put(entry, "visible", true);
        keywords.put(entry);
        taskKeywordSettingsInput.setText("");
        saveTaskKeywords();
        taskKeywordSettingsInput.requestFocus();
        toast("关键词已添加");
    }

    private void changeTaskKeywordSetting(String id, String action) {
        JSONArray keywords = taskKeywordArray(selectedTaskKeywordSettingsSubject);
        int targetIndex = -1;
        for (int index = 0; index < keywords.length(); index++) {
            JSONObject entry = keywords.optJSONObject(index);
            if (entry != null && id.equals(entry.optString("id"))) {
                targetIndex = index;
                break;
            }
        }
        if (targetIndex < 0) return;
        JSONObject entry = keywords.optJSONObject(targetIndex);
        if ("delete".equals(action)) {
            final int deleteIndex = targetIndex;
            final String label = entry.optString("label");
            new AlertDialog.Builder(this)
                    .setTitle("删除关键词")
                    .setMessage("删除关键词“" + label + "”吗？")
                    .setNegativeButton("取消", null)
                    .setPositiveButton("删除", (dialog, which) -> {
                        keywords.remove(deleteIndex);
                        saveTaskKeywords();
                        toast("关键词已删除");
                    })
                    .show();
            return;
        }
        if ("toggle".equals(action)) {
            put(entry, "visible", !entry.optBoolean("visible", true));
        } else if ("up".equals(action) && targetIndex > 0) {
            Object previous = keywords.opt(targetIndex - 1);
            keywords.put(targetIndex - 1, entry);
            keywords.put(targetIndex, previous);
        } else if ("down".equals(action) && targetIndex < keywords.length() - 1) {
            Object next = keywords.opt(targetIndex + 1);
            keywords.put(targetIndex + 1, entry);
            keywords.put(targetIndex, next);
        } else {
            return;
        }
        saveTaskKeywords();
        toast("关键词设置已更新");
    }

    private void showSettingsPage() {
        stopDictation(false, false);
        pendingDictationRecordingWord = null;
        stopDictationWordRecording(true, false);
        releaseDictationPreviewPlayer();
        dismissTaskEntryDialog();
        dismissTaskFocusDialog();
        if (weekendTaskPlanDialog != null && weekendTaskPlanDialog.isShowing()) weekendTaskPlanDialog.dismiss();
        mainPageView.setVisibility(View.GONE);
        historyPageView.setVisibility(View.GONE);
        dictationPageView.setVisibility(View.GONE);
        settingsPageView.setVisibility(View.VISIBLE);
        renderBreakAlarmSettings();
        renderTaskKeywordSettings();
        if (settingsPageView instanceof ScrollView) ((ScrollView) settingsPageView).scrollTo(0, 0);
    }

    private File breakAlarmFile() {
        return new File(getFilesDir(), "break-alarm.m4a");
    }

    private void renderBreakAlarmSettings() {
        if (settingsCurrentDateView != null) {
            settingsCurrentDateView.setText("查看日期 · " + formatShortDate(currentDate));
        }
        boolean custom = breakAlarmFile().isFile() && breakAlarmFile().length() > 0;
        if (breakAlarmPreviewButton != null) breakAlarmPreviewButton.setText(custom ? "🔊 试听我的录音" : "🔊 试听默认提示");
        if (breakAlarmResetButton != null) breakAlarmResetButton.setVisibility(custom ? View.VISIBLE : View.GONE);
        if (breakAlarmRecordButton != null && breakAlarmRecorder == null) {
            breakAlarmRecordButton.setText(custom ? "🎙 重新录音" : "🎙 开始录音");
        }
    }

    private void setBreakAlarmHint(String message) {
        if (breakAlarmHintView == null) return;
        breakAlarmHintView.setText(message == null ? "" : message);
        breakAlarmHintView.setVisibility(message == null || message.isEmpty() ? View.GONE : View.VISIBLE);
    }

    private void toggleBreakAlarmRecording() {
        if (breakAlarmRecorder != null) {
            stopBreakAlarmRecording(true, true);
            return;
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            startBreakAlarmRecordingAfterPermission = true;
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, BREAK_ALARM_RECORD_AUDIO_PERMISSION_REQUEST);
            return;
        }
        beginBreakAlarmRecording();
    }

    private void beginBreakAlarmRecording() {
        releaseBreakAlarmPlayer();
        File output = new File(getFilesDir(), "break-alarm.m4a.recording");
        if (output.exists()) output.delete();
        MediaRecorder recorder = new MediaRecorder();
        try {
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setAudioSamplingRate(44100);
            recorder.setAudioEncodingBitRate(128000);
            recorder.setMaxDuration(8000);
            recorder.setOutputFile(output.getAbsolutePath());
            recorder.setOnInfoListener((source, what, extra) -> {
                if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED) {
                    runOnUiThread(() -> stopBreakAlarmRecording(true, true));
                }
            });
            recorder.setOnErrorListener((source, what, extra) -> runOnUiThread(() -> {
                stopBreakAlarmRecording(false, false);
                toast("提示音录制失败，请重试");
            }));
            recorder.prepare();
            recorder.start();
            breakAlarmRecorder = recorder;
            pendingBreakAlarmFile = output;
            breakAlarmRecordingStartedAt = System.currentTimeMillis();
            breakAlarmRecordButton.setText("■ 完成录音");
            setBreakAlarmHint("正在录音……说完后点“完成录音”，最长 8 秒。");
        } catch (Exception error) {
            recorder.reset();
            recorder.release();
            output.delete();
            toast("无法开始录音，请检查麦克风权限");
        }
    }

    private void stopBreakAlarmRecording(boolean keep, boolean notify) {
        MediaRecorder recorder = breakAlarmRecorder;
        File temporary = pendingBreakAlarmFile;
        if (recorder == null) return;
        breakAlarmRecorder = null;
        pendingBreakAlarmFile = null;
        boolean longEnough = System.currentTimeMillis() - breakAlarmRecordingStartedAt >= BREAK_ALARM_RECORDING_MIN_MS;
        boolean stopped = false;
        try {
            recorder.stop();
            stopped = true;
        } catch (RuntimeException ignored) { }
        recorder.reset();
        recorder.release();
        boolean saved = false;
        if (keep && stopped && longEnough && temporary != null && temporary.isFile() && temporary.length() > 0) {
            File target = breakAlarmFile();
            if (target.exists()) target.delete();
            saved = temporary.renameTo(target);
        }
        if (!saved && temporary != null) temporary.delete();
        setBreakAlarmHint(saved ? "录音已保存。试听一下，确认声音清楚、响亮。" : "录音太短或已取消，请重新录一遍。");
        renderBreakAlarmSettings();
        if (notify) toast(saved ? "提示音录音已保存" : "录音太短，请重新录制");
    }

    private void confirmResetBreakAlarm() {
        new AlertDialog.Builder(this)
                .setTitle("恢复默认提示")
                .setMessage("确定删除我的录音，改用“作业时间到啦”吗？")
                .setNegativeButton("取消", null)
                .setPositiveButton("恢复默认", (dialog, which) -> {
                    releaseBreakAlarmPlayer();
                    boolean deleted = !breakAlarmFile().exists() || breakAlarmFile().delete();
                    renderBreakAlarmSettings();
                    setBreakAlarmHint("已恢复默认语音：“作业时间到啦”。");
                    toast(deleted ? "已恢复默认提示" : "无法删除录音，请重试");
                }).show();
    }

    private void playBreakAlarm(int repeats) {
        releaseBreakAlarmPlayer();
        if (breakAlarmTts != null) breakAlarmTts.stop();
        File file = breakAlarmFile();
        if (!file.isFile() || file.length() == 0) {
            if (breakAlarmTts == null) {
                toast("作业时间到啦！");
                return;
            }
            Bundle first = new Bundle();
            first.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1f);
            breakAlarmTts.speak("作业时间到啦", TextToSpeech.QUEUE_FLUSH, first, "break-alarm-1");
            if (repeats > 1) {
                Bundle second = new Bundle();
                second.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1f);
                breakAlarmTts.speak("作业时间到啦", TextToSpeech.QUEUE_ADD, second, "break-alarm-2");
            }
            return;
        }
        remainingBreakAlarmPlays = Math.max(1, repeats);
        playBreakAlarmFile();
    }

    private void playBreakAlarmFile() {
        if (remainingBreakAlarmPlays <= 0) return;
        remainingBreakAlarmPlays--;
        MediaPlayer player = new MediaPlayer();
        breakAlarmPlayer = player;
        try {
            player.setDataSource(breakAlarmFile().getAbsolutePath());
            player.setVolume(1f, 1f);
            player.setOnCompletionListener(done -> {
                done.release();
                if (breakAlarmPlayer == done) breakAlarmPlayer = null;
                if (remainingBreakAlarmPlays > 0) timerHandler.postDelayed(this::playBreakAlarmFile, 350);
            });
            player.prepare();
            player.start();
        } catch (Exception error) {
            player.release();
            breakAlarmPlayer = null;
            toast("无法播放提示音");
        }
    }

    private void releaseBreakAlarmPlayer() {
        remainingBreakAlarmPlays = 0;
        MediaPlayer player = breakAlarmPlayer;
        breakAlarmPlayer = null;
        if (player != null) player.release();
        if (breakAlarmTts != null) breakAlarmTts.stop();
    }

    private void launchBackupExport() {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, "作业小账本备份-" + todayIso() + ".json");
        startActivityForResult(intent, EXPORT_BACKUP_REQUEST);
    }

    private void launchBackupImport() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        startActivityForResult(intent, IMPORT_BACKUP_REQUEST);
    }

    private JSONObject backupPayload() {
        JSONObject state = new JSONObject();
        put(state, "records", records);
        put(state, "weekends", weekends);
        put(state, "dictationCustom", dictationCustomWords);
        put(state, "taskKeywords", taskKeywords);
        JSONObject payload = new JSONObject();
        put(payload, "format", "homework-ledger-backup");
        put(payload, "version", 3);
        put(payload, "exportedAt", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.CHINA)
                .format(Calendar.getInstance().getTime()));
        put(payload, "state", state);
        return payload;
    }

    private void writeBackup(Uri uri) {
        try (OutputStream output = getContentResolver().openOutputStream(uri)) {
            if (output == null) throw new IllegalStateException("output unavailable");
            output.write(backupPayload().toString(2).getBytes(StandardCharsets.UTF_8));
            output.flush();
            toast("备份文件已导出");
        } catch (Exception exception) {
            toast("导出失败，请重新选择保存位置");
        }
    }

    private void readBackup(Uri uri) {
        try (InputStream input = getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new IllegalStateException("input unavailable");
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            JSONObject parsed = new JSONObject(output.toString(StandardCharsets.UTF_8.name()));
            JSONObject source = "homework-ledger-backup".equals(parsed.optString("format"))
                    ? parsed.optJSONObject("state") : parsed;
            if (source == null || source.optJSONObject("records") == null
                    || source.optJSONObject("weekends") == null) {
                throw new JSONException("invalid backup");
            }
            confirmBackupRestore(source);
        } catch (Exception exception) {
            toast("备份文件无法识别，请选择本应用导出的文件");
        }
    }

    private void confirmBackupRestore(JSONObject source) {
        new AlertDialog.Builder(this)
                .setTitle("恢复本地备份")
                .setMessage("恢复会替换当前全部记录，确定继续吗？")
                .setNegativeButton("取消", null)
                .setPositiveButton("恢复", (dialog, which) -> {
                    records = source.optJSONObject("records");
                    weekends = source.optJSONObject("weekends");
                    JSONObject restoredWords = source.optJSONObject("dictationCustom");
                    dictationCustomWords = restoredWords == null ? new JSONObject() : restoredWords;
                    taskKeywords = normalizeTaskKeywords(source.optJSONObject("taskKeywords"));
                    currentDate = todayIso();
                    preferences.edit()
                            .putString(KEY_RECORDS, records.toString())
                            .putString(KEY_WEEKENDS, weekends.toString())
                            .putString(KEY_DICTATION_CUSTOM, dictationCustomWords.toString())
                            .putString(KEY_TASK_KEYWORDS, taskKeywords.toString())
                            .apply();
                    dismissTaskEntryDialog();
                    dismissTaskFocusDialog();
                    renderAll();
                    toast("备份已恢复");
                })
                .show();
    }

    private void showRecordDatePicker() {
        Calendar calendar = calendarFromIso(currentDate);
        DatePickerDialog dialog = new DatePickerDialog(this, (view, year, month, day) -> {
            selectDate(isoFromParts(year, month, day));
        }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH));
        dialog.setTitle("选择记录日期");
        dialog.show();
    }

    private void selectDate(String date) {
        dismissTaskEntryDialog();
        dismissTaskFocusDialog();
        taskListExpanded = false;
        completedTasksExpanded = false;
        currentDate = date;
        renderAll();
        renderBreakAlarmSettings();
    }

    private JSONObject currentRecord(boolean create) {
        JSONObject record = records.optJSONObject(currentDate);
        if (record != null || !create) return record;
        record = new JSONObject();
        try {
            records.put(currentDate, record);
        } catch (JSONException ignored) { }
        return record;
    }

    private JSONObject weekendForDate(String date, boolean create) {
        String key = weekendKeyFor(date);
        if (key == null) return null;
        JSONObject weekend = weekends.optJSONObject(key);
        if (weekend != null || !create) return weekend;
        weekend = new JSONObject();
        try {
            weekends.put(key, weekend);
        } catch (JSONException ignored) { }
        return weekend;
    }

    private String weekendKeyFor(String date) {
        Calendar calendar = calendarFromIso(date);
        int day = calendar.get(Calendar.DAY_OF_WEEK);
        if (day == Calendar.FRIDAY) return date;
        if (day == Calendar.SATURDAY) return addDays(date, -1);
        if (day == Calendar.SUNDAY) return addDays(date, -2);
        return null;
    }

    private String addDays(String date, int count) {
        Calendar calendar = calendarFromIso(date);
        calendar.add(Calendar.DAY_OF_MONTH, count);
        return new SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).format(calendar.getTime());
    }

    private boolean isWeekendMeaningful(JSONObject weekend) {
        if (weekend == null) return false;
        return weekend.optBoolean("confirmed") || weekend.optBoolean("dailySeparated")
                || weekend.optBoolean("specialSeparated") || weekend.optBoolean("planSaved")
                || weekend.optBoolean("fridayDone") || weekend.optBoolean("saturdayMorningDone")
                || weekend.optBoolean("penaltyConfirmed") || taskCount(weekend) > 0
                || hasText(weekend, "allDoneDate");
    }

    private void cleanupWeekend() {
        String key = weekendKeyFor(currentDate);
        if (key != null && !isWeekendMeaningful(weekends.optJSONObject(key))) weekends.remove(key);
    }

    private boolean includeDailyInLedger(String date, JSONObject record) {
        String key = weekendKeyFor(date);
        if (key == null) return true;
        return hasText(record, "ruleId") && !isWeekendMeaningful(weekends.optJSONObject(key));
    }

    private Result weekendResultFor(String key, JSONObject weekend) {
        if (weekend == null) return null;
        JSONArray tasks = weekend.optJSONArray("tasks");
        boolean orderReady = weekend.optBoolean("orderSaved");
        if (!orderReady && tasks != null) {
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null && !"pending".equals(task.optString("status", "pending"))) {
                    orderReady = true;
                    break;
                }
            }
        }
        double planningPart = weekend.optBoolean("planSaved") && orderReady ? 0.5 : 0;
        if (weekend.optBoolean("penaltyConfirmed") && !hasText(weekend, "allDoneDate")) {
            return new Result("周日结束仍未完成", planningPart - 0.5);
        }
        if (!hasText(weekend, "allDoneDate")) return null;
        boolean followedPlan = tasks != null && tasks.length() > 0;
        if (followedPlan) {
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task == null || !"done".equals(task.optString("status"))) {
                    followedPlan = false;
                    break;
                }
                String completedDate = task.optString("completedDate", weekend.optString("allDoneDate"));
                if (completedDate.compareTo(plannedDateForTask(key, task)) > 0) {
                    followedPlan = false;
                    break;
                }
            }
        } else {
            followedPlan = weekend.optString("allDoneDate").compareTo(addDays(key, 1)) <= 0;
        }
        return new Result(followedPlan ? "按周五计划完成" : "全部完成，但晚于计划",
                planningPart + (followedPlan ? 1.0 : 0.5));
    }

    private boolean weekendOrderSaved(JSONObject weekend) {
        if (weekend == null) return false;
        if (weekend.optBoolean("orderSaved")) return true;
        JSONArray tasks = weekend.optJSONArray("tasks");
        if (tasks == null) return false;
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && !"pending".equals(task.optString("status", "pending"))) return true;
        }
        return false;
    }

    private int weekendActualMinutes(String key) {
        JSONObject weekend = weekends.optJSONObject(key);
        JSONArray tasks = weekend == null ? null : weekend.optJSONArray("tasks");
        if (tasks != null && tasks.length() > 0) {
            long total = 0L;
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task != null) total += taskElapsedMillis(task);
            }
            return (int) (total / 60000L);
        }
        int total = 0;
        for (int offset = 0; offset < 3; offset++) {
            String date = addDays(key, offset);
            JSONObject record = records.optJSONObject(date);
            if (record != null) total += focusDuration(record, date.equals(todayIso()));
        }
        return total;
    }

    private boolean isMeaningful(JSONObject record) {
        if (record == null) return false;
        if (record.optBoolean("ropeDone")
                || (record.optJSONArray("sportActivities") != null && record.optJSONArray("sportActivities").length() > 0)
                || record.optBoolean("ledgerConfirmed") || record.optBoolean("readingDone")
                || record.optBoolean("mathThinkingDone") || record.optBoolean("englishReadingDone")
                || record.optBoolean("choresDone")) return true;
        if (record.optBoolean("tasksConfirmed") || taskCount(record) > 0) return true;
        if (hasText(record, "note") || hasText(record, "ruleId")) return true;
        for (String key : TIME_KEYS) if (hasText(record, key)) return true;
        return false;
    }

    private void cleanupCurrentRecord() {
        if (!isMeaningful(currentRecord(false))) records.remove(currentDate);
    }

    private Result resultFor(JSONObject record) {
        if (record == null) return null;
        if (hasText(record, "finishTime")) return ruleForTime(record.optString("finishTime"));
        String legacy = record.optString("ruleId", "");
        if ("best".equals(legacy)) return new Result("8:30 及以前", 1.5);
        if ("good".equals(legacy)) return new Result("8:30 后至 8:40", 1.0);
        if ("neutral".equals(legacy)) return new Result("8:40 后至 9:30", 0.0);
        if ("late".equals(legacy)) return new Result("9:30 以后", -0.5);
        return null;
    }

    private Result ruleForTime(String time) {
        int value = minutes(time);
        if (value <= 20 * 60 + 30) return new Result("8:30 及以前", 1.5);
        if (value <= 20 * 60 + 40) return new Result("8:30 后至 8:40", 1.0);
        if (value <= 21 * 60 + 30) return new Result("8:40 后至 9:30", 0.0);
        return new Result("9:30 以后", -0.5);
    }

    private int focusDuration(JSONObject record, boolean live) {
        JSONArray tasks = record.optJSONArray("tasks");
        if (tasks != null && tasks.length() > 0) {
            long total = 0L;
            for (int index = 0; index < tasks.length(); index++) {
                JSONObject task = tasks.optJSONObject(index);
                if (task == null) continue;
                total += task.optLong("elapsedMs", 0L);
                if (live && "active".equals(task.optString("status"))) {
                    long started = task.optLong("activeSince", 0L);
                    if (started > 0) total += Math.max(0L, System.currentTimeMillis() - started);
                }
            }
            return (int) (total / 60000L);
        }
        String start = record.optString("startTime", "");
        if (start.isEmpty()) return 0;
        String finish = record.optString("finishTime", "");
        String end = finish.isEmpty() && live ? currentTime() : finish;
        String dinner = record.optString("dinnerTime", "");
        if (!dinner.isEmpty()) {
            int first = segmentMinutes(start, dinner);
            String resume = record.optString("resumeTime", "");
            return first + (!resume.isEmpty() && !end.isEmpty() ? segmentMinutes(resume, end) : 0);
        }
        return end.isEmpty() ? 0 : segmentMinutes(start, end);
    }

    private int segmentMinutes(String from, String to) {
        int start = minutes(from);
        int end = minutes(to);
        return end >= start ? end - start : end + 1440 - start;
    }

    private int minutes(String time) {
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }

    private int minutesOrMissing(String time) {
        return time == null || time.isEmpty() ? -1 : minutes(time);
    }

    private List<String> activeDates() {
        List<String> dates = new ArrayList<>();
        Iterator<String> keys = records.keys();
        while (keys.hasNext()) {
            String date = keys.next();
            if (isMeaningful(records.optJSONObject(date))) dates.add(date);
        }
        Collections.sort(dates, Collections.reverseOrder());
        return dates;
    }

    private List<String> activeWeekendKeys() {
        List<String> keysList = new ArrayList<>();
        Iterator<String> keys = weekends.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (isWeekendMeaningful(weekends.optJSONObject(key))) {
                keysList.add(key);
            }
        }
        Collections.sort(keysList, Collections.reverseOrder());
        return keysList;
    }

    private JSONObject readRecords() {
        return readJson(KEY_RECORDS);
    }

    private JSONObject readJson(String key) {
        try {
            return new JSONObject(preferences.getString(key, "{}"));
        } catch (JSONException exception) {
            return new JSONObject();
        }
    }

    private void saveRecords() {
        preferences.edit().putString(KEY_RECORDS, records.toString()).apply();
    }

    private void saveWeekends() {
        preferences.edit().putString(KEY_WEEKENDS, weekends.toString()).apply();
    }

    private void put(JSONObject object, String key, Object value) {
        try {
            object.put(key, value);
        } catch (JSONException ignored) { }
    }

    private boolean hasText(JSONObject object, String key) {
        return object != null && !object.optString(key, "").isEmpty();
    }

    private int taskCount(JSONObject owner) {
        JSONArray tasks = owner == null ? null : owner.optJSONArray("tasks");
        return tasks == null ? 0 : tasks.length();
    }

    private String fallbackTime(JSONObject record, String key) {
        String value = record.optString(key, "");
        return value.isEmpty() ? "已" : value;
    }

    private void stylePrep(LinearLayout card, TextView check, boolean selected) {
        card.setBackground(rounded(selected ? GREEN_SOFT : Color.WHITE, 17, selected ? Color.rgb(156, 188, 245) : LINE, 1));
        check.setTextColor(selected ? Color.WHITE : Color.TRANSPARENT);
        check.setBackground(rounded(selected ? GREEN : PAGE, 20, selected ? GREEN : LINE, 1));
    }

    private void styleHabitAction(TextView action, boolean selected) {
        action.setText(selected ? "已完成" : "打卡");
        action.setTextColor(selected ? Color.WHITE : GREEN);
        action.setBackground(rounded(selected ? GREEN : GREEN_SOFT, 16,
                selected ? GREEN : GREEN_SOFT, 0));
    }

    private void styleDot(TextView dot, boolean done, boolean active) {
        dot.setText(done ? "●" : active ? "◉" : "○");
        dot.setTextColor(done || active ? GREEN : Color.rgb(170, 170, 163));
    }

    private void addAction(String label, boolean primary, Runnable runnable) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(13);
        button.setTextColor(primary ? Color.WHITE : GREEN);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setBackground(rounded(primary ? GREEN : GREEN_SOFT, 15, primary ? GREEN : Color.rgb(156, 188, 245), 1));
        button.setOnClickListener(v -> runnable.run());
        LinearLayout.LayoutParams params = weightedFixed(1, dp(46));
        if (actionContainer.getChildCount() > 0) params.leftMargin = dp(9);
        actionContainer.addView(button, params);
    }

    private String amountText(double amount) {
        if (amount > 0) return String.format(Locale.CHINA, "+ ¥%.2f", amount);
        if (amount < 0) return String.format(Locale.CHINA, "− ¥%.2f", Math.abs(amount));
        return "¥0.00";
    }

    private int amountColor(double amount) {
        if (amount < 0) return RED;
        if (amount == 0) return AMBER;
        return GREEN;
    }

    private String orDash(String value) { return value.isEmpty() ? "--:--" : value; }
    private String currentTime() { return new SimpleDateFormat("HH:mm", Locale.CHINA).format(Calendar.getInstance().getTime()); }
    private String todayIso() { return new SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).format(Calendar.getInstance().getTime()); }
    private String isoFromParts(int year, int month, int day) {
        return String.format(Locale.CHINA, "%04d-%02d-%02d", year, month + 1, day);
    }
    private Calendar calendarFromIso(String iso) {
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd", Locale.CHINA);
        parser.setLenient(false);
        try { calendar.setTime(parser.parse(iso)); } catch (ParseException ignored) { }
        return calendar;
    }
    private String formatLongDate(String iso) {
        return new SimpleDateFormat("M月d日 EEEE", Locale.CHINA).format(calendarFromIso(iso).getTime());
    }
    private String formatShortDate(String iso) {
        return new SimpleDateFormat("M月d日", Locale.CHINA).format(calendarFromIso(iso).getTime());
    }

    private LinearLayout card() {
        LinearLayout card = vertical();
        card.setPadding(dp(18), dp(22), dp(18), dp(20));
        card.setBackground(rounded(SURFACE, 26, LINE, 1));
        return card;
    }
    private LinearLayout vertical() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        return layout;
    }
    private LinearLayout horizontal() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        return layout;
    }
    private TextView text(String value, float sp, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sp);
        view.setTextColor(color);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }
    private Button smallButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(13);
        button.setTextColor(GREEN);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setPadding(dp(13), dp(9), dp(13), dp(9));
        button.setBackground(rounded(SURFACE, 11, LINE, 1));
        return button;
    }
    private Button textButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(12);
        button.setTextColor(GREEN);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setMinWidth(0);
        button.setMinimumWidth(0);
        button.setPadding(dp(11), dp(6), dp(11), dp(6));
        button.setBackgroundColor(Color.TRANSPARENT);
        return button;
    }
    private GradientDrawable rounded(int fill, int radiusDp, int strokeColor, int strokeWidthDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(fill);
        drawable.setCornerRadius(dp(radiusDp));
        if (strokeWidthDp > 0) drawable.setStroke(dp(strokeWidthDp), strokeColor);
        return drawable;
    }
    private View divider() {
        View view = new View(this);
        view.setBackgroundColor(LINE);
        view.setLayoutParams(matchFixed(1));
        return view;
    }
    private Space space(int heightDp) {
        Space space = new Space(this);
        space.setLayoutParams(fixed(1, dp(heightDp)));
        return space;
    }
    private Space spaceHorizontal(int widthDp) {
        Space space = new Space(this);
        space.setLayoutParams(fixed(dp(widthDp), 1));
        return space;
    }
    private LinearLayout.LayoutParams matchWrap() {
        return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    }
    private LinearLayout.LayoutParams matchFixed(int heightPx) {
        return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, heightPx);
    }
    private LinearLayout.LayoutParams weightedWrap(float weight) {
        return new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, weight);
    }
    private LinearLayout.LayoutParams weightedFixed(float weight, int heightPx) {
        return new LinearLayout.LayoutParams(0, heightPx, weight);
    }
    private LinearLayout.LayoutParams fixed(int widthPx, int heightPx) {
        return new LinearLayout.LayoutParams(widthPx, heightPx);
    }
    private int dp(float value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private void hideKeyboard() {
        View current = getCurrentFocus();
        if (current == null) return;
        InputMethodManager manager = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (manager != null) manager.hideSoftInputFromWindow(current.getWindowToken(), 0);
        current.clearFocus();
    }
    private void toast(String message) { Toast.makeText(this, message, Toast.LENGTH_SHORT).show(); }
}
