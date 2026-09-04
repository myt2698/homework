package com.homework.ledger;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognizerIntent;
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
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.Space;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

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
    private static final String KEY_START_DATE = "start_date";
    private static final String KEY_RECORDS = "records";
    private static final String KEY_WEEKENDS = "weekends";
    private static final String[] TIME_KEYS = {"startTime", "dinnerTime", "resumeTime", "finishTime"};
    private static final String[] SPORTS = {"跳绳", "仰卧起坐", "50米跑", "踢毽子", "坐位体前屈"};
    private static final String[] TASK_SUBJECTS = {"语文", "数学", "英语", "科学"};
    private static final int VOICE_TASK_REQUEST = 201;
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
    private String startDate;
    private String currentDate;
    private boolean loadingNote;

    private TextView balanceView;
    private TextView periodView;
    private TextView completedDaysView;
    private TextView rewardDaysView;
    private TextView deductionView;
    private TextView recordHeadingView;
    private Button recordDateButton;
    private TextView viewModeView;

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
    private LinearLayout choresCard;
    private TextView choresCheckView;
    private TextView choresStatusView;
    private LinearLayout ledgerCard;
    private TextView ledgerCheckView;
    private TextView ledgerStatusView;

    private LinearLayout taskEntryPanel;
    private EditText taskDraftInput;
    private TextView taskSummaryView;
    private TextView taskPanelTitleView;
    private TextView taskPanelHelpView;
    private LinearLayout taskQuestProgressPanel;
    private TextView taskQuestStageView;
    private TextView taskQuestRemainingView;
    private TextView taskQuestPercentView;
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
    private final List<Button> subjectTabButtons = new ArrayList<>();
    private String selectedTaskSubject = "语文";
    private boolean taskListExpanded;
    private boolean completedTasksExpanded;

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

    private AlertDialog taskFocusDialog;
    private AlertDialog weekendTaskPlanDialog;
    private TextView taskFocusElapsedView;
    private JSONObject taskFocusTask;

    private final Handler timerHandler = new Handler(Looper.getMainLooper());
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
            timerHandler.postDelayed(this, 1000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(GREEN_DARK);
        window.setNavigationBarColor(PAGE);

        preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        startDate = preferences.getString(KEY_START_DATE, todayIso());
        if (startDate.compareTo(todayIso()) > 0) startDate = todayIso();
        records = readRecords();
        weekends = readJson(KEY_WEEKENDS);
        currentDate = todayIso().compareTo(startDate) < 0 ? startDate : todayIso();

        setContentView(buildScreen());
        renderAll();
        timerHandler.postDelayed(timerTick, 30000);
    }

    @Override
    protected void onDestroy() {
        timerHandler.removeCallbacks(timerTick);
        timerHandler.removeCallbacks(taskFocusTick);
        if (taskFocusDialog != null) taskFocusDialog.dismiss();
        if (weekendTaskPlanDialog != null) weekendTaskPlanDialog.dismiss();
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != VOICE_TASK_REQUEST || resultCode != RESULT_OK || data == null) return;
        ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        if (results == null || results.isEmpty()) return;
        String spoken = results.get(0).trim();
        if (spoken.isEmpty()) return;
        String existing = taskDraftInput.getText().toString().trim();
        taskDraftInput.setText(existing.isEmpty() ? spoken : existing + "；" + spoken);
        taskDraftInput.setSelection(taskDraftInput.length());
        toast("语音已转成文字，请核对后生成清单");
    }

    private void startVoiceTaskInput() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "zh-CN");
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "请连续报作业，每项先说科目");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        try {
            startActivityForResult(intent, VOICE_TASK_REQUEST);
        } catch (ActivityNotFoundException exception) {
            toast("手机没有可用的语音识别服务，请直接输入文字");
        }
    }

    private View buildScreen() {
        ScrollView scrollView = new ScrollView(this);
        scrollView.setFillViewport(true);
        scrollView.setBackgroundColor(PAGE);

        LinearLayout content = vertical();
        content.setPadding(dp(16), dp(22), dp(16), dp(28));
        scrollView.addView(content, matchWrap());
        content.addView(buildHeader());
        content.addView(space(16));
        content.addView(buildSummaryCard());
        content.addView(space(14));
        content.addView(buildDateStrip());
        content.addView(space(14));
        weekendCard = buildWeekendCard();
        weekendSpacer = space(0);
        content.addView(buildProcessCard());
        content.addView(space(14));
        content.addView(buildHistoryCard());
        content.addView(space(16));

        TextView footer = text("🌱 每天完成一点点，就会越来越厉害\n数据只保存在这台手机中", 11, MUTED, true);
        footer.setGravity(Gravity.CENTER);
        content.addView(footer, matchWrap());
        return scrollView;
    }

    private View buildHeader() {
        LinearLayout row = horizontal();
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout titles = vertical();
        TextView eyebrow = text("每天进步一点点", 10, GREEN, true);
        eyebrow.setLetterSpacing(0.12f);
        titles.addView(eyebrow);
        titles.addView(text("🌟 作业小账本", 28, GREEN_DARK, true));
        TextView cheer = text("认真完成，也别忘了开心和休息呀！", 10, MUTED, false);
        cheer.setPadding(0, dp(3), 0, 0);
        titles.addView(cheer);
        row.addView(titles, weightedWrap(1));
        Button settings = smallButton("设置");
        settings.setOnClickListener(v -> showStartDatePicker());
        row.addView(settings);
        return row;
    }

    private View buildDateStrip() {
        LinearLayout row = horizontal();
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(14), dp(11), dp(12), dp(11));
        row.setBackground(rounded(SURFACE, 19, LINE, 1));
        LinearLayout copy = vertical();
        copy.addView(text("当前查看", 10, MUTED, false));
        viewModeView = text("平日记录", 13, INK, true);
        copy.addView(viewModeView);
        row.addView(copy, weightedWrap(1));
        recordDateButton = smallButton("选择日期");
        recordDateButton.setOnClickListener(v -> showRecordDatePicker());
        row.addView(recordDateButton);
        row.addView(spaceHorizontal(5));
        Button todayButton = textButton("今天");
        todayButton.setOnClickListener(v -> selectDate(todayIso().compareTo(startDate) < 0 ? startDate : todayIso()));
        row.addView(todayButton);
        return row;
    }

    private View buildSummaryCard() {
        LinearLayout card = vertical();
        card.setPadding(dp(24), dp(26), dp(24), dp(22));
        card.setBackground(rounded(GREEN_DARK, 28, GREEN_DARK, 0));
        card.addView(text("我的成长能量 ⭐", 14, Color.argb(215, 255, 255, 255), true));
        balanceView = text("¥ 0.00", 44, Color.WHITE, true);
        card.addView(balanceView);
        periodView = text("从今天开始", 12, Color.argb(170, 255, 255, 255), false);
        card.addView(periodView);
        card.addView(space(24));

        LinearLayout stats = horizontal();
        completedDaysView = addStat(stats, "0", "认真完成");
        rewardDaysView = addStat(stats, "0", "收获奖励");
        deductionView = addStat(stats, "¥0.00", "需要加油");
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

        weekendConfirmedCard = weekendCheckCard("周末作业已全部确认", "已核对钉钉和成长记录册", 0);
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
        TextView kicker = text("🚀 今日小目标", 10, GREEN, true);
        kicker.setLetterSpacing(0.12f);
        card.addView(kicker);
        recordHeadingView = text("今天进行到哪里了？", 21, INK, true);
        recordHeadingView.setPadding(0, dp(3), 0, dp(10));
        card.addView(recordHeadingView);

        ledgerCard = prepCard("已核对钉钉和成长记录册", "先确定今天全部作业，再录入清单");
        card.addView(ledgerCard, matchFixed(dp(72)));
        card.addView(space(16));

        card.addView(buildTasksPanel(), matchWrap());
        card.addView(space(16));

        buildWeekendTaskPlanner();
        card.addView(buildWeekendTaskPlanEntry(), matchWrap());
        card.addView(space(16));

        sportCard = buildSportCard();
        card.addView(sportCard, matchWrap());
        card.addView(space(9));
        LinearLayout habitRow = horizontal();
        readingCard = dailyHabitCard("阅读打卡", "完成阅读后打卡", "readingDone", "readingAt", true);
        habitRow.addView(readingCard, weightedFixed(1, dp(76)));
        habitRow.addView(spaceHorizontal(8));
        choresCard = dailyHabitCard("家务打卡", "做完家务后打卡", "choresDone", "choresAt", false);
        habitRow.addView(choresCard, weightedFixed(1, dp(76)));
        card.addView(habitRow, matchFixed(dp(76)));

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
        LinearLayout tools = horizontal();
        tools.setGravity(Gravity.START);
        Button reset = textButton("清除当天记录");
        reset.setTextColor(RED);
        reset.setOnClickListener(v -> confirmResetCurrent());
        tools.addView(reset);
        LinearLayout.LayoutParams toolsParams = matchWrap();
        toolsParams.topMargin = dp(14);
        card.addView(tools, toolsParams);
        return card;
    }

    private LinearLayout buildTasksPanel() {
        LinearLayout panel = vertical();
        panel.setPadding(dp(15), dp(17), dp(15), dp(15));
        panel.setBackground(rounded(Color.WHITE, 18, LINE, 1));

        LinearLayout head = horizontal();
        head.setGravity(Gravity.TOP);
        LinearLayout copy = vertical();
        TextView kicker = text("作业清单", 10, GREEN, true);
        kicker.setLetterSpacing(0.1f);
        copy.addView(kicker);
        taskPanelTitleView = text("选一项，轻松开始吧", 17, INK, true);
        copy.addView(taskPanelTitleView);
        taskPanelHelpView = text("一次专心做一项，每完成一项都很棒！", 10, MUTED, false);
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
        LinearLayout subjectTabs = horizontal();
        subjectTabButtons.clear();
        for (String subject : TASK_SUBJECTS) {
            final String tabSubject = subject;
            Button tab = new Button(this);
            tab.setText(subject);
            tab.setTextSize(11);
            tab.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
            tab.setAllCaps(false);
            tab.setMinHeight(0);
            tab.setMinimumHeight(0);
            tab.setOnClickListener(v -> selectTaskSubject(tabSubject));
            LinearLayout.LayoutParams tabParams = weightedFixed(1, dp(39));
            if (subjectTabs.getChildCount() > 0) tabParams.leftMargin = dp(6);
            subjectTabs.addView(tab, tabParams);
            subjectTabButtons.add(tab);
        }
        taskEntryPanel.addView(subjectTabs, matchFixed(dp(39)));
        selectTaskSubject(selectedTaskSubject);
        taskEntryPanel.addView(space(9));
        Button voice = new Button(this);
        voice.setText("🎙 开始报作业");
        voice.setTextSize(13);
        voice.setTextColor(GREEN);
        voice.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        voice.setAllCaps(false);
        voice.setBackground(rounded(GREEN_SOFT, 13, Color.rgb(156, 188, 245), 1));
        voice.setOnClickListener(v -> startVoiceTaskInput());
        taskEntryPanel.addView(voice, matchFixed(dp(46)));
        TextView voiceTip = text("可以连续说：语文……，数学……，英语……", 10, MUTED, false);
        voiceTip.setPadding(0, dp(7), 0, 0);
        taskEntryPanel.addView(voiceTip);

        taskDraftInput = new EditText(this);
        taskDraftInput.setTextSize(14);
        taskDraftInput.setTextColor(INK);
        taskDraftInput.setHintTextColor(Color.rgb(160, 159, 150));
        taskDraftInput.setHint("例如：1. 背诵第3课  2. 练习册第12页  3. 阅读课文");
        taskDraftInput.setGravity(Gravity.TOP | Gravity.START);
        taskDraftInput.setMinLines(3);
        taskDraftInput.setMaxLines(6);
        taskDraftInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        taskDraftInput.setFilters(new InputFilter[]{new InputFilter.LengthFilter(500)});
        taskDraftInput.setPadding(dp(11), dp(9), dp(11), dp(9));
        taskDraftInput.setBackground(rounded(Color.WHITE, 11, LINE, 1));
        LinearLayout.LayoutParams draftParams = matchWrap();
        draftParams.topMargin = dp(10);
        taskEntryPanel.addView(taskDraftInput, draftParams);

        LinearLayout entryActions = horizontal();
        Button add = new Button(this);
        add.setText("生成作业清单");
        add.setTextSize(12);
        add.setTextColor(Color.WHITE);
        add.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        add.setAllCaps(false);
        add.setBackground(rounded(GREEN, 10, GREEN, 0));
        add.setOnClickListener(v -> addTasksFromDraft());
        entryActions.addView(add, weightedFixed(1, dp(43)));
        entryActions.addView(spaceHorizontal(6));
        Button clear = textButton("清空");
        clear.setOnClickListener(v -> taskDraftInput.setText(""));
        entryActions.addView(clear, fixed(dp(62), dp(43)));
        LinearLayout.LayoutParams entryActionParams = matchWrap();
        entryActionParams.topMargin = dp(9);
        taskEntryPanel.addView(entryActions, entryActionParams);
        LinearLayout.LayoutParams entryParams = matchWrap();
        entryParams.topMargin = dp(13);
        panel.addView(taskEntryPanel, entryParams);

        taskQuestProgressPanel = vertical();
        taskQuestProgressPanel.setPadding(dp(14), dp(13), dp(14), dp(12));
        taskQuestProgressPanel.setBackground(rounded(Color.rgb(237, 244, 255), 16,
                Color.rgb(191, 212, 251), 1));
        LinearLayout questHead = horizontal();
        questHead.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout questCopy = vertical();
        taskQuestStageView = text("第 1 关", 10, Color.rgb(83, 115, 166), true);
        taskQuestRemainingView = text("还剩 0 项", 15, INK, true);
        taskQuestRemainingView.setPadding(0, dp(3), 0, 0);
        questCopy.addView(taskQuestStageView);
        questCopy.addView(taskQuestRemainingView);
        questHead.addView(questCopy, weightedWrap(1));
        taskQuestPercentView = text("0%", 18, GREEN, true);
        questHead.addView(taskQuestPercentView);
        taskQuestProgressPanel.addView(questHead, matchWrap());
        taskQuestProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        taskQuestProgressBar.setMax(100);
        taskQuestProgressBar.setProgressTintList(ColorStateList.valueOf(GREEN));
        taskQuestProgressBar.setProgressBackgroundTintList(ColorStateList.valueOf(Color.rgb(220, 232, 251)));
        LinearLayout.LayoutParams progressParams = matchFixed(dp(10));
        progressParams.topMargin = dp(10);
        taskQuestProgressPanel.addView(taskQuestProgressBar, progressParams);
        taskQuestMessageView = text("先完成一小项，作业就会开始变少啦！", 10,
                Color.rgb(84, 112, 153), true);
        taskQuestMessageView.setPadding(0, dp(8), 0, 0);
        taskQuestProgressPanel.addView(taskQuestMessageView);
        LinearLayout.LayoutParams questParams = matchWrap();
        questParams.topMargin = dp(12);
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

    private void selectTaskSubject(String subject) {
        selectedTaskSubject = subject;
        for (int index = 0; index < subjectTabButtons.size(); index++) {
            Button button = subjectTabButtons.get(index);
            boolean selected = TASK_SUBJECTS[index].equals(subject);
            button.setTextColor(selected ? Color.WHITE : MUTED);
            button.setBackground(rounded(selected ? GREEN : Color.WHITE, 10, selected ? GREEN : LINE, 1));
        }
        if (taskDraftInput != null) {
            taskDraftInput.setHint("例如：1. " + subject + "背诵第3课  2. 练习册第12页  3. 阅读课文");
        }
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

    private void addTasksFromDraft() {
        String weekendKey = weekendKeyFor(currentDate);
        if (weekendKey != null && !currentDate.equals(weekendKey)) {
            toast("周六、周日直接使用周五清单，不需要重新录入");
            return;
        }
        JSONObject dailyRecord = currentRecord(false);
        if (dailyRecord == null || !dailyRecord.optBoolean("ledgerConfirmed")) {
            toast("请先核对钉钉和成长记录册");
            return;
        }
        String draft = taskDraftInput.getText().toString().trim();
        List<JSONObject> parsed = parseTaskDraft(draft);
        if (parsed.isEmpty()) {
            toast("请先说出或输入作业内容");
            return;
        }
        JSONObject owner = taskOwner(true);
        JSONArray tasks = owner.optJSONArray("tasks");
        if (tasks == null) tasks = new JSONArray();
        long stamp = System.currentTimeMillis();
        for (int index = 0; index < parsed.size(); index++) {
            JSONObject task = parsed.get(index);
            put(task, "id", stamp + "-" + index);
            put(task, "status", "pending");
            put(task, "elapsedMs", 0L);
            if (weekendKey != null) put(task, "plannedDay", "saturday");
            tasks.put(task);
        }
        put(owner, "tasks", tasks);
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
        toast("已加入 " + parsed.size() + " 项作业");
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

    private String taskClockLabel(JSONObject task) {
        long seconds = taskElapsedMillis(task) / 1000L;
        long hours = seconds / 3600L;
        long minutes = (seconds % 3600L) / 60L;
        long remainder = seconds % 60L;
        return hours > 0
                ? String.format(Locale.CHINA, "%02d:%02d:%02d", hours, minutes, remainder)
                : String.format(Locale.CHINA, "%02d:%02d", minutes, remainder);
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
        taskFocusElapsedView = text(taskClockLabel(task), 48, GREEN, true);
        taskFocusElapsedView.setGravity(Gravity.CENTER);
        taskFocusElapsedView.setPadding(0, dp(16), 0, dp(8));
        content.addView(taskFocusElapsedView);
        TextView started = text("开始时间  " + task.optString("startedAt", "--:--"), 12, MUTED, false);
        started.setGravity(Gravity.CENTER);
        content.addView(started);
        TextView reminder = text("专心完成这一项，你已经开始得很棒啦！", 11, MUTED, false);
        reminder.setGravity(Gravity.CENTER);
        reminder.setPadding(0, dp(16), 0, dp(4));
        content.addView(reminder);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(content)
                .setNegativeButton("暂时收起", null)
                .setNeutralButton("暂停", null)
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
            toast("请先核对钉钉和成长记录册");
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
        toast(confirmed ? "可以修改作业清单了" : "清单已确认，共 " + tasks.length() + " 项");
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
        if (taskOrderSaved()) {
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
        toast(weekendKey == null ? "顺序已确定，开始第一关吧！" : "周末闯关顺序已确定！");
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
        taskSummaryView.setText(progressTotal == 0 ? "0 项" : progressDone + " / " + progressTotal + " 项完成");
        taskPanelTitleView.setText(sortingMode ? "安排你的闯关顺序"
                : orderPendingWeekend ? "还差一步：确定顺序"
                : questMode ? "今天一关一关来" : "选一项，轻松开始吧");
        taskPanelHelpView.setText(sortingMode ? "这是你的计划，想先做哪一项由你决定。"
                : orderPendingWeekend ? "请回到周五排好顺序，再开始周末作业。"
                : questMode ? "不用一次想完，只看眼前这一项。" : "一次专心做一项，每完成一项都很棒！");
        taskEntryPanel.setVisibility(!confirmed && canEditList && ledgerReady ? View.VISIBLE : View.GONE);
        emptyTaskView.setVisibility(tasks.length() == 0 ? View.VISIBLE : View.GONE);
        emptyTaskView.setText(weekendMode && !isFriday
                ? "周五还没有录入作业清单，请回到周五完成录入和安排。"
                : ledgerReady ? "还没有作业，点击麦克风连续报完，或直接输入文字。"
                : "先核对钉钉和成长记录册，再录入作业。");
        taskConfirmButton.setVisibility(tasks.length() == 0 || !canEditList || confirmed && !allPending
                ? View.GONE : View.VISIBLE);
        taskConfirmButton.setText(confirmed ? "修改作业清单" : "确认作业清单");
        taskOrderButton.setVisibility(canArrangeOrder ? View.VISIBLE : View.GONE);
        taskOrderButton.setText(sortingMode ? "确定顺序，开始闯关" : "调整闯关顺序");
        taskOrderButton.setTextColor(sortingMode ? Color.WHITE : GREEN);
        taskOrderButton.setBackground(rounded(sortingMode ? GREEN : GREEN_SOFT, 13,
                sortingMode ? GREEN : Color.rgb(156, 188, 245), sortingMode ? 0 : 1));
        taskConfirmHintView.setText(sortingMode
                ? weekendMode ? "分别排好周五、周六、周日的顺序，确定后就按计划闯关。"
                    : "长按拖动作业，或使用箭头排好顺序，再确定开始。"
                : orderPendingWeekend ? "周末顺序还没有确定，请回到周五完成最后一步。"
                : weekendMode && isFriday && orderSaved ? "周末完成日期和三天顺序都安排好了。"
                : !canEditList
                ? planSaved ? "清单来自周五，按计划日期逐项完成。" : "请先回到周五保存周末安排。"
                : !ledgerReady ? "第 1 步：先核对钉钉和成长记录册。"
                : confirmed
                ? allDoneCount == tasks.length() && tasks.length() > 0
                    ? weekendMode ? "周末清单已全部完成并自动结算。"
                    : dailyRecord != null && hasText(dailyRecord, "finishTime")
                        ? "最后一项完成时已自动结算。" : "清单已完成，确认成长记录册后自动结算。"
                    : weekendMode ? "清单已确认；点击下方“周五安排与闯关”，给每项作业选择完成日。" : "清单已确认；一次只开始一项。"
                : tasks.length() > 0 ? "核对无误后再确认清单。" : "录入后先核对，避免漏掉作业。");

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
            int remaining = Math.max(0, progressTotal - progressDone);
            taskQuestStageView.setText(progress == 100 ? "🏆 今日通关" : "第 " + (progressDone + 1) + " 关 · 共 " + progressTotal + " 关");
            taskQuestRemainingView.setText(progress == 100 ? "全部完成啦！" : "还剩 " + remaining + " 项");
            taskQuestPercentView.setText(progress + "%");
            taskQuestProgressBar.setProgress(progress);
            String encouragement = "先完成一小项，作业就会开始变少啦！";
            if (progressDone > 0 && progress < 50) encouragement = "已经闯过第一关，作业没有想象中那么难！";
            else if (progress >= 50 && progress < 80) encouragement = "已经完成一半多啦，胜利正在靠近！";
            else if (progress >= 80 && progress < 100) encouragement = "快到终点了，只剩 " + remaining + " 项！";
            else if (progress == 100) encouragement = "全部通关，今天的坚持太棒了！";
            taskQuestMessageView.setText(encouragement);
            int questFill = progress == 100 ? Color.rgb(255, 248, 217) : Color.rgb(237, 244, 255);
            int questStroke = progress == 100 ? Color.rgb(240, 212, 124) : Color.rgb(191, 212, 251);
            taskQuestProgressPanel.setBackground(rounded(questFill, 16, questStroke, 1));
        }

        taskListContainer.removeAllViews();
        if (sortingMode) {
            taskSummaryView.setText(tasks.length() + " 关待安排");
            addOrderIntro();
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
            addQuestSection("🎯 现在只做这一关", "不用想后面的，先把眼前这一项做好");
            addTaskCard(tasks, currentIndex, true, canEditList, weekendMode, isFriday,
                    planSaved, weekendKey, true, true, false, true);
            List<Integer> upcoming = new ArrayList<>();
            List<Integer> later = new ArrayList<>();
            for (int index : remainingIndexes) {
                if (index == currentIndex) continue;
                if (upcoming.size() < 2) upcoming.add(index); else later.add(index);
            }
            if (!upcoming.isEmpty()) {
                addQuestSection("接下来", "提前看一眼就好");
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

    private void addOrderIntro() {
        TextView intro = text("🧭 先选一项容易开始的热身，再安排最需要动脑的作业。", 10,
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
        TextView meta = text("长按拖动，或用右侧箭头调整", 9, MUTED, false);
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
        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(8);
        taskListContainer.addView(item, params);
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
        TextView title = text("太棒了，全部通关！", 16, Color.rgb(114, 83, 28), true);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(5), 0, 0);
        victory.addView(title);
        TextView detail = text("看起来很多的作业，也被你一项一项完成啦。", 10, MUTED, false);
        detail.setGravity(Gravity.CENTER);
        detail.setPadding(0, dp(5), 0, 0);
        victory.addView(detail);
        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(8);
        taskListContainer.addView(victory, params);
    }

    private void addTaskCard(JSONArray tasks, int index, boolean confirmed, boolean canEditList,
                             boolean weekendMode, boolean isFriday, boolean planSaved, String weekendKey,
                             boolean suggested, boolean current, boolean compact, boolean allowActions) {
        JSONObject task = tasks.optJSONObject(index);
        if (task == null) return;
        final int taskIndex = index;
        String status = task.optString("status", "pending");
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
        taskCopy.addView(titleRow, matchWrap());
        String meta = "待开始";
        if ("active".equals(status)) meta = "正在进行 · " + taskDurationLabel(task);
        else if ("paused".equals(status)) meta = "已暂停 · 已用 " + taskDurationLabel(task);
        else if ("done".equals(status)) meta = (hasText(task, "completedDate") ? formatShortDate(task.optString("completedDate")) + " " : "")
                + task.optString("completedAt", "已") + " 完成 · 用时 " + taskDurationLabel(task);
        else if (weekendMode && planSaved && !canDoToday) meta = "计划" + plannedDayLabel(task) + "完成";
        TextView metaView = text(meta, compact ? 9 : 10, MUTED, false);
        metaView.setPadding(0, dp(compact ? 3 : 4), 0, 0);
        taskCopy.addView(metaView);
        mainRow.addView(taskCopy, weightedWrap(1));
        LinearLayout actions = horizontal();
        if (!confirmed && canEditList) {
            addTaskActionButton(actions, "删除", false, true, () -> performTaskAction("delete", taskIndex));
        } else if (confirmed && canDoToday && allowActions && "active".equals(status)) {
            addTaskActionButton(actions, "暂停", false, false, () -> performTaskAction("pause", taskIndex));
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
        LinearLayout.LayoutParams params = matchWrap();
        params.topMargin = dp(current ? 7 : 8);
        taskListContainer.addView(item, params);
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
        int fill = primary ? GREEN : Color.WHITE;
        button.setBackground(rounded(fill, 18, primary ? GREEN : LINE, 1));
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
        if ("delete".equals(action)) {
            if (weekendKey != null && !currentDate.equals(weekendKey)) {
                toast("周末清单只能在周五修改");
                return;
            }
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
            owner.remove("orderSaved");
            owner.remove("orderSavedAt");
            cleanupCurrentRecord();
            cleanupWeekend();
            taskListExpanded = false;
            completedTasksExpanded = false;
            saveTaskData();
            renderAll();
            toast("作业已删除");
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
            toast("已暂停，可以休息或选择下一项");
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
                    toast("作业已全部完成，确认成长记录册后自动结算");
                }
            } else if (completedAll) {
                put(weekend, "allDoneDate", currentDate);
                put(weekend, "allDoneTime", task.optString("completedAt"));
                weekend.remove("penaltyConfirmed");
                Result result = weekendResultFor(weekendKey, weekend);
                toast("周末作业已全部完成，" + result.label + " " + amountText(result.amount));
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
                if (remaining == 0) toast("今天安排的作业已通关，太棒了！");
                else if (remaining <= 2) toast("太棒了，快到终点了，只剩 " + remaining + " 项！");
                else if (todayDone >= Math.ceil(todayTotal / 2.0)) toast("成功闯过一关，已经完成一半多啦！");
                else toast("成功闯过一关！已经完成 " + todayDone + " 项");
            }
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
        copy.addView(text(title, 14, INK, true));
        TextView status = text(subtitle, 11, MUTED, false);
        status.setPadding(0, dp(3), 0, 0);
        copy.addView(status);
        item.addView(copy, weightedWrap(1));
        ledgerCheckView = check;
        ledgerStatusView = status;
        item.setOnClickListener(v -> togglePrep("ledgerConfirmed", "ledgerAt", "成长记录册状态已更新"));
        return item;
    }

    private LinearLayout dailyHabitCard(String title, String subtitle, String field,
                                        String timeField, boolean reading) {
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
        if (reading) {
            readingCheckView = check;
            readingStatusView = status;
        } else {
            choresCheckView = check;
            choresStatusView = status;
        }
        item.setOnClickListener(v -> togglePrep(field, timeField,
                reading ? "阅读打卡状态已更新" : "家务打卡状态已更新"));
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
        emptyHistoryView = text("🌟\n新的成长旅程要开始啦\n完成第一份作业后，这里会留下你的进步。", 13, MUTED, false);
        emptyHistoryView.setGravity(Gravity.CENTER);
        emptyHistoryView.setLineSpacing(dp(4), 1f);
        emptyHistoryView.setPadding(dp(6), dp(28), dp(6), dp(20));
        card.addView(emptyHistoryView, matchWrap());
        return card;
    }

    private void renderWeekend() {
        String key = weekendKeyFor(currentDate);
        boolean weekendMode = key != null;
        weekendCard.setVisibility(weekendMode ? View.VISIBLE : View.GONE);
        weekendSpacer.setVisibility(weekendMode ? View.VISIBLE : View.GONE);
        viewModeView.setText(!weekendMode ? "平日记录"
                : currentDate.equals(key) ? "周五任务"
                : currentDate.equals(addDays(key, 1)) ? "周六按计划完成" : "周日按计划完成");
        if (!weekendMode) return;

        JSONObject weekend = weekendForDate(currentDate, false);
        if (weekend == null) weekend = new JSONObject();
        String saturday = addDays(key, 1);
        String sunday = addDays(key, 2);
        weekendRangeView.setText(formatShortDate(key) + "（周五）— " + formatShortDate(sunday) + "（周日）");
        boolean confirmed = weekend.optBoolean("confirmed", false);
        styleWeekendCheck(weekendConfirmedCard, weekendConfirmedCheck, confirmed);
        weekendConfirmedStatus.setText(confirmed
                ? fallbackTime(weekend, "confirmedAt") + " 确认全部作业" : "已核对钉钉和成长记录册");
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
                message = "成长记录册已确认，自动" + kind + " " + amountText(result.amount);
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
                    if (activity.equals(stored.optString(index))) {
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
                toast("请先确认成长记录册已经补全");
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
        recordDateButton.setText(formatLongDate(currentDate));
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
                ? "今天也一起加油吧！" : formatShortDate(currentDate) + "的记录");
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
        boolean choresDone = record.optBoolean("choresDone", false);
        stylePrep(readingCard, readingCheckView, readingDone);
        stylePrep(choresCard, choresCheckView, choresDone);
        readingStatusView.setText(readingDone
                ? fallbackTime(record, "readingAt") + " 完成阅读" : "完成阅读后打卡");
        choresStatusView.setText(choresDone
                ? fallbackTime(record, "choresAt") + " 完成家务" : "做完家务后打卡");
        stylePrep(ledgerCard, ledgerCheckView, record.optBoolean("ledgerConfirmed", false));
        String weekendKey = weekendKeyFor(currentDate);
        ledgerCard.setVisibility(weekendKey != null && !currentDate.equals(weekendKey) ? View.GONE : View.VISIBLE);
        ledgerStatusView.setText(record.optBoolean("ledgerConfirmed", false)
                ? fallbackTime(record, "ledgerAt") + " 完成核对，可以录入清单" : "先确定今天全部作业，再录入清单");

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
        periodView.setText("从 " + formatShortDate(startDate) + " 开始记录成长");
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
            selectDate(date);
            toast("已打开这一天的记录");
        });
        Button delete = textButton("删除");
        delete.setTextColor(RED);
        delete.setOnClickListener(v -> confirmDelete(date));
        actions.addView(view);
        actions.addView(delete);
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
            selectDate(target);
            toast("已打开本周末计划");
        });
        Button delete = textButton("删除");
        delete.setTextColor(RED);
        delete.setOnClickListener(v -> confirmDeleteWeekend(key));
        actions.addView(view);
        actions.addView(delete);
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
        if (record.optBoolean("readingDone") && record.optBoolean("choresDone")) return "阅读和家务已打卡";
        if (record.optBoolean("readingDone")) return "阅读已打卡";
        if (record.optBoolean("choresDone")) return "家务已打卡";
        if (!sportActivities(record).isEmpty()) return "运动已打卡 " + sportActivities(record).size() + " 项";
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
                toast("请先确认成长记录册已经补全");
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

    private void showStartDatePicker() {
        Calendar calendar = calendarFromIso(startDate);
        DatePickerDialog dialog = new DatePickerDialog(this, (view, year, month, day) -> {
            startDate = isoFromParts(year, month, day);
            preferences.edit().putString(KEY_START_DATE, startDate).apply();
            if (currentDate.compareTo(startDate) < 0) currentDate = startDate;
            renderAll();
            toast("开始日期已更新");
        }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH));
        dialog.getDatePicker().setMaxDate(calendarFromIso(todayIso()).getTimeInMillis());
        dialog.setTitle("设置统计开始日期");
        dialog.show();
    }

    private void showRecordDatePicker() {
        Calendar calendar = calendarFromIso(currentDate);
        DatePickerDialog dialog = new DatePickerDialog(this, (view, year, month, day) -> {
            selectDate(isoFromParts(year, month, day));
        }, calendar.get(Calendar.YEAR), calendar.get(Calendar.MONTH), calendar.get(Calendar.DAY_OF_MONTH));
        dialog.getDatePicker().setMinDate(calendarFromIso(startDate).getTimeInMillis());
        dialog.setTitle("选择记录日期");
        dialog.show();
    }

    private void selectDate(String date) {
        dismissTaskFocusDialog();
        taskListExpanded = false;
        completedTasksExpanded = false;
        currentDate = date;
        renderAll();
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
            if (date.compareTo(startDate) >= 0 && isMeaningful(records.optJSONObject(date))) dates.add(date);
        }
        Collections.sort(dates, Collections.reverseOrder());
        return dates;
    }

    private List<String> activeWeekendKeys() {
        List<String> keysList = new ArrayList<>();
        Iterator<String> keys = weekends.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            if (addDays(key, 2).compareTo(startDate) >= 0 && isWeekendMeaningful(weekends.optJSONObject(key))) {
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
