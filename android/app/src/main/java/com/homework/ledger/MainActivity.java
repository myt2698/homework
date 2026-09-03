package com.homework.ledger;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognizerIntent;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
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

    private static final int PAGE = Color.rgb(247, 244, 237);
    private static final int SURFACE = Color.rgb(255, 253, 249);
    private static final int INK = Color.rgb(37, 39, 33);
    private static final int MUTED = Color.rgb(115, 117, 104);
    private static final int LINE = Color.rgb(231, 225, 214);
    private static final int GREEN = Color.rgb(47, 109, 85);
    private static final int GREEN_DARK = Color.rgb(39, 95, 75);
    private static final int GREEN_SOFT = Color.rgb(232, 242, 235);
    private static final int AMBER = Color.rgb(155, 100, 42);
    private static final int AMBER_SOFT = Color.rgb(248, 236, 217);
    private static final int RED = Color.rgb(169, 70, 63);
    private static final int RED_SOFT = Color.rgb(248, 231, 228);

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
    private LinearLayout ledgerCard;
    private TextView ledgerCheckView;
    private TextView ledgerStatusView;

    private LinearLayout taskEntryPanel;
    private EditText taskDraftInput;
    private TextView taskSummaryView;
    private LinearLayout activeTaskPanel;
    private TextView activeTaskTitleView;
    private TextView activeTaskTimeView;
    private LinearLayout taskListContainer;
    private TextView emptyTaskView;
    private TextView taskConfirmHintView;
    private Button taskConfirmButton;
    private LinearLayout taskSettlementPanel;
    private TextView taskSettlementLabel;
    private TextView taskSettlementAmount;
    private final List<Button> subjectTabButtons = new ArrayList<>();
    private String selectedTaskSubject = "语文";

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
        content.addView(weekendCard, matchWrap());
        weekendSpacer = space(14);
        content.addView(weekendSpacer);
        content.addView(buildProcessCard());
        content.addView(space(14));
        content.addView(buildHistoryCard());
        content.addView(space(16));

        TextView footer = text("数据只保存在这台手机中，不会上传。", 11, MUTED, false);
        footer.setGravity(Gravity.CENTER);
        content.addView(footer, matchWrap());
        return scrollView;
    }

    private View buildHeader() {
        LinearLayout row = horizontal();
        row.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout titles = vertical();
        TextView eyebrow = text("HOMEWORK LEDGER", 10, GREEN, true);
        eyebrow.setLetterSpacing(0.12f);
        titles.addView(eyebrow);
        titles.addView(text("作业小账本", 28, INK, true));
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
        row.setBackground(rounded(SURFACE, 15, LINE, 1));
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
        card.setBackground(rounded(GREEN_DARK, 24, GREEN_DARK, 0));
        card.addView(text("当前累计", 14, Color.argb(195, 255, 255, 255), false));
        balanceView = text("¥ 0.00", 44, Color.WHITE, true);
        card.addView(balanceView);
        periodView = text("从今天开始", 12, Color.argb(170, 255, 255, 255), false);
        card.addView(periodView);
        card.addView(space(24));

        LinearLayout stats = horizontal();
        completedDaysView = addStat(stats, "0", "完成天数");
        rewardDaysView = addStat(stats, "0", "奖励天数");
        deductionView = addStat(stats, "¥0.00", "累计扣款");
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
        TextView kicker = text("今日流程", 10, GREEN, true);
        kicker.setLetterSpacing(0.12f);
        card.addView(kicker);
        recordHeadingView = text("今天进行到哪里了？", 21, INK, true);
        recordHeadingView.setPadding(0, dp(3), 0, dp(10));
        card.addView(recordHeadingView);

        sportCard = buildSportCard();
        card.addView(sportCard, matchWrap());
        card.addView(space(9));
        ledgerCard = prepCard("成长记录册已补全", "已核对钉钉全部作业");
        card.addView(ledgerCard, matchFixed(dp(72)));
        card.addView(space(16));

        card.addView(buildTasksPanel(), matchWrap());
        card.addView(space(16));

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

        card.addView(space(18));
        card.addView(text("备注（选填）", 13, INK, true));
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
        LinearLayout.LayoutParams noteParams = matchWrap();
        noteParams.topMargin = dp(7);
        card.addView(noteInput, noteParams);

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
        copy.addView(text("先收齐，再一项一项做", 17, INK, true));
        TextView tip = text("确认后每次只能进行一项，单项速度不参与奖罚。", 10, MUTED, false);
        tip.setPadding(0, dp(4), 0, 0);
        copy.addView(tip);
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
        voice.setBackground(rounded(GREEN_SOFT, 11, Color.rgb(155, 189, 171), 1));
        voice.setOnClickListener(v -> startVoiceTaskInput());
        taskEntryPanel.addView(voice, matchFixed(dp(46)));
        TextView voiceTip = text("可以连续说：语文……，数学……，英语……", 10, MUTED, false);
        voiceTip.setPadding(0, dp(7), 0, 0);
        taskEntryPanel.addView(voiceTip);

        taskDraftInput = new EditText(this);
        taskDraftInput.setTextSize(14);
        taskDraftInput.setTextColor(INK);
        taskDraftInput.setHintTextColor(Color.rgb(160, 159, 150));
        taskDraftInput.setHint("例如：语文 背诵第3课；数学 口算；英语 朗读课文");
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

        activeTaskPanel = vertical();
        activeTaskPanel.setPadding(dp(14), dp(12), dp(14), dp(12));
        activeTaskPanel.setBackground(rounded(GREEN, 14, GREEN, 0));
        activeTaskPanel.addView(text("现在只做这一项", 10, Color.argb(190, 255, 255, 255), false));
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
        taskConfirmButton = new Button(this);
        taskConfirmButton.setText("确认作业清单");
        taskConfirmButton.setTextSize(12);
        taskConfirmButton.setTextColor(GREEN);
        taskConfirmButton.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        taskConfirmButton.setAllCaps(false);
        taskConfirmButton.setBackground(rounded(GREEN_SOFT, 11, Color.rgb(155, 189, 171), 1));
        taskConfirmButton.setOnClickListener(v -> toggleTaskListConfirmation());
        panel.addView(taskConfirmButton, matchFixed(dp(43)));

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

    private void selectTaskSubject(String subject) {
        selectedTaskSubject = subject;
        for (int index = 0; index < subjectTabButtons.size(); index++) {
            Button button = subjectTabButtons.get(index);
            boolean selected = TASK_SUBJECTS[index].equals(subject);
            button.setTextColor(selected ? Color.WHITE : MUTED);
            button.setBackground(rounded(selected ? GREEN : Color.WHITE, 10, selected ? GREEN : LINE, 1));
        }
        if (taskDraftInput != null) {
            taskDraftInput.setHint("例如：" + subject + " 背诵第3课；练习册第12页");
        }
    }

    private List<JSONObject> parseTaskDraft(String value) {
        List<JSONObject> parsed = new ArrayList<>();
        String normalized = SUBJECT_ANYWHERE_PATTERN.matcher(value).replaceAll("\n$1：");
        String currentSubject = selectedTaskSubject;
        for (String rawPart : normalized.split("[\\n；;。]+")) {
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
            tasks.put(task);
        }
        put(owner, "tasks", tasks);
        if (weekendKeyFor(currentDate) != null) {
            put(owner, "confirmed", false);
            owner.remove("confirmedAt");
        } else {
            put(owner, "tasksConfirmed", false);
            owner.remove("tasksConfirmedAt");
            owner.remove("finishTime");
            owner.remove("tasksFinishedAt");
            owner.remove("ruleId");
        }
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
        TextView reminder = text("现在只做这一项，认真完成后再看下一项。", 11, MUTED, false);
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
        JSONArray tasks = taskArray(false);
        if (tasks.length() == 0) {
            toast("请先录入作业");
            return;
        }
        boolean confirmed = taskListConfirmed();
        if (confirmed && activeTask(false) != null) {
            toast("请先暂停当前作业再修改清单");
            return;
        }
        JSONObject owner = taskOwner(true);
        String field = weekendKeyFor(currentDate) != null ? "confirmed" : "tasksConfirmed";
        String timeField = weekendKeyFor(currentDate) != null ? "confirmedAt" : "tasksConfirmedAt";
        put(owner, field, !confirmed);
        if (!confirmed) put(owner, timeField, currentTime()); else owner.remove(timeField);
        if (weekendKeyFor(currentDate) == null) {
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
        }
        saveTaskData();
        renderAll();
        toast(confirmed ? "可以修改作业清单了" : "清单已确认，共 " + tasks.length() + " 项");
    }

    private void renderTasks() {
        if (taskListContainer == null) return;
        JSONArray tasks = taskArray(false);
        boolean confirmed = taskListConfirmed();
        int done = 0;
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task != null && "done".equals(task.optString("status"))) done++;
        }
        taskSummaryView.setText(tasks.length() == 0 ? "0 项" : done + " / " + tasks.length() + " 项完成");
        taskEntryPanel.setVisibility(confirmed ? View.GONE : View.VISIBLE);
        emptyTaskView.setVisibility(tasks.length() == 0 ? View.VISIBLE : View.GONE);
        taskConfirmButton.setVisibility(tasks.length() == 0 ? View.GONE : View.VISIBLE);
        taskConfirmButton.setText(confirmed ? "修改作业清单" : "确认作业清单");
        JSONObject dailyRecord = currentRecord(false);
        boolean weekendMode = weekendKeyFor(currentDate) != null;
        taskConfirmHintView.setText(confirmed
                ? done == tasks.length() && tasks.length() > 0
                    ? weekendMode ? "清单已全部完成，可进行周末结算。"
                    : dailyRecord != null && hasText(dailyRecord, "finishTime")
                        ? "最后一项完成时已自动结算。" : "清单已完成，确认成长记录册后自动结算。"
                    : "清单已确认；一次只开始一项。"
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
        activeTaskPanel.setVisibility(active == null ? View.GONE : View.VISIBLE);
        if (active != null) {
            activeTaskTitleView.setText(active.optString("subject", "其他") + " · " + active.optString("title", ""));
            activeTaskTimeView.setText("已专注 " + taskDurationLabel(active));
        }

        taskListContainer.removeAllViews();
        for (int index = 0; index < tasks.length(); index++) {
            JSONObject task = tasks.optJSONObject(index);
            if (task == null) continue;
            final int taskIndex = index;
            String status = task.optString("status", "pending");
            LinearLayout item = vertical();
            item.setPadding(dp(12), dp(11), dp(12), dp(11));
            int fill = "active".equals(status) ? GREEN_SOFT : PAGE;
            int stroke = "active".equals(status) ? GREEN : LINE;
            item.setBackground(rounded(fill, 13, stroke, 1));
            TextView title = text(task.optString("subject", "其他") + " · " + task.optString("title", "未命名作业"), 13, INK, true);
            if ("done".equals(status)) title.setAlpha(0.6f);
            item.addView(title);
            String meta = "待开始";
            if ("active".equals(status)) meta = "正在进行 · " + taskDurationLabel(task);
            else if ("paused".equals(status)) meta = "已暂停 · 已用 " + taskDurationLabel(task);
            else if ("done".equals(status)) meta = task.optString("completedAt", "已") + " 完成 · 用时 " + taskDurationLabel(task);
            TextView metaView = text(meta, 10, MUTED, false);
            metaView.setPadding(0, dp(4), 0, dp(8));
            item.addView(metaView);
            LinearLayout actions = horizontal();
            if (!confirmed) {
                addTaskActionButton(actions, "删除", false, true, () -> performTaskAction("delete", taskIndex));
            } else if ("active".equals(status)) {
                addTaskActionButton(actions, "暂停", false, false, () -> performTaskAction("pause", taskIndex));
                addTaskActionButton(actions, "完成", true, false, () -> performTaskAction("complete", taskIndex));
            } else if ("paused".equals(status)) {
                addTaskActionButton(actions, "继续", true, false, () -> performTaskAction("start", taskIndex));
                addTaskActionButton(actions, "完成", false, false, () -> performTaskAction("complete", taskIndex));
            } else if ("done".equals(status)) {
                addTaskActionButton(actions, "撤销完成", false, false, () -> performTaskAction("undo", taskIndex));
            } else {
                addTaskActionButton(actions, "开始", true, false, () -> performTaskAction("start", taskIndex));
            }
            item.addView(actions, matchFixed(dp(39)));
            LinearLayout.LayoutParams itemParams = matchWrap();
            if (taskListContainer.getChildCount() > 0) itemParams.topMargin = dp(8);
            taskListContainer.addView(item, itemParams);
        }
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
        button.setBackground(rounded(fill, 9, primary ? GREEN : LINE, 1));
        button.setOnClickListener(v -> action.run());
        LinearLayout.LayoutParams params = weightedFixed(1, dp(39));
        if (row.getChildCount() > 0) params.leftMargin = dp(6);
        row.addView(button, params);
    }

    private void performTaskAction(String action, int index) {
        JSONArray tasks = taskArray(true);
        JSONObject task = tasks.optJSONObject(index);
        if (task == null) return;
        boolean showFocusAfterRender = false;
        if ("delete".equals(action)) {
            tasks.remove(index);
            if (weekendKeyFor(currentDate) == null) {
                JSONObject owner = taskOwner(true);
                owner.remove("finishTime");
                owner.remove("tasksFinishedAt");
                owner.remove("ruleId");
            }
            cleanupCurrentRecord();
            cleanupWeekend();
            saveTaskData();
            renderAll();
            toast("作业已删除");
            return;
        }
        if (!taskListConfirmed()) {
            toast("请先确认作业清单");
            return;
        }
        JSONObject record = currentRecord(true);
        if (hasText(record, "finishTime") && !"undo".equals(action)) {
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
            boolean completedAll = allTasksDone();
            if (completedAll && weekendKeyFor(currentDate) == null) {
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
            } else {
                toast(completedAll ? "作业清单已全部完成，可进行周末结算" : "完成一项，选择下一项吧");
            }
        } else if ("undo".equals(action)) {
            put(task, "status", "paused");
            task.remove("completedAt");
            if (weekendKeyFor(currentDate) == null) {
                record.remove("finishTime");
                record.remove("tasksFinishedAt");
                record.remove("ruleId");
            }
            toast("已撤销完成，可以继续这项作业");
        }
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
        TextView kicker = text("历史记录", 10, GREEN, true);
        kicker.setLetterSpacing(0.12f);
        card.addView(kicker);
        TextView title = text("最近的表现", 21, INK, true);
        title.setPadding(0, dp(3), 0, dp(8));
        card.addView(title);
        historyList = vertical();
        card.addView(historyList, matchWrap());
        emptyHistoryView = text("✓\n还没有记录\n完成第一份作业清单后会显示在这里。", 13, MUTED, false);
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
        viewModeView.setText(weekendMode ? "周末计划与今日执行" : "平日记录");
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
        else if (result != null) weekendStatusView.setText("本周末已结算");
        else if (currentDate.equals(key)) weekendStatusView.setText("执行周五安排");
        else if (currentDate.equals(saturday)) weekendStatusView.setText("周六完成学校作业");
        else weekendStatusView.setText("周日缓冲与收尾");

        weekendActionContainer.removeAllViews();
        if (weekend.optBoolean("planSaved") && confirmed) {
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
        int stroke = primary ? GREEN : danger ? Color.rgb(219, 175, 169) : Color.rgb(155, 189, 171);
        button.setBackground(rounded(fill, 11, stroke, 1));
        button.setOnClickListener(v -> runnable.run());
        LinearLayout.LayoutParams params = matchFixed(dp(44));
        if (weekendActionContainer.getChildCount() > 0) params.topMargin = dp(7);
        weekendActionContainer.addView(button, params);
    }

    private void styleWeekendCheck(LinearLayout card, TextView check, boolean selected) {
        card.setBackground(rounded(selected ? GREEN_SOFT : Color.WHITE, 14,
                selected ? Color.rgb(155, 189, 171) : LINE, 1));
        check.setTextColor(selected ? Color.WHITE : Color.TRANSPARENT);
        check.setBackground(rounded(selected ? GREEN : PAGE, 18, selected ? GREEN : LINE, 1));
    }

    private void styleMilestone(LinearLayout card, TextView badge, boolean done, boolean failed) {
        int fill = failed ? RED_SOFT : done ? GREEN_SOFT : PAGE;
        int stroke = failed ? Color.rgb(219, 175, 169) : done ? Color.rgb(155, 189, 171) : LINE;
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
                ? "今天的准备与作业" : formatShortDate(currentDate) + "的记录");
        finishLabelView.setText(weekendMode ? "结束今日时段" : "全部完成");
        startLabelView.setText(weekendMode ? "开始本段作业" : "开始饭前作业");
        dinnerLabelView.setText(weekendMode ? "暂停休息" : "吃饭暂停");
        resumeLabelView.setText(weekendMode ? "继续作业" : "饭后继续");

        List<String> selectedSports = sportActivities(record);
        boolean sportDone = !selectedSports.isEmpty();
        sportCard.setBackground(rounded(sportDone ? GREEN_SOFT : Color.WHITE, 15,
                sportDone ? Color.rgb(155, 189, 171) : LINE, 1));
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
        stylePrep(ledgerCard, ledgerCheckView, record.optBoolean("ledgerConfirmed", false));
        ledgerCard.setVisibility(weekendMode ? View.GONE : View.VISIBLE);
        ledgerStatusView.setText(record.optBoolean("ledgerConfirmed", false)
                ? fallbackTime(record, "ledgerAt") + " 确认全部作业" : "已核对钉钉全部作业");

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
        periodView.setText("统计开始于 " + formatShortDate(startDate));
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
        } else if (weekend.optBoolean("fridayDone")) {
            status = "周五安排已完成，周末进行中";
        } else {
            status = "周末计划进行中";
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
        double fridayPart = weekend.optBoolean("fridayDone") ? 0.5 : 0;
        if (weekend.optBoolean("penaltyConfirmed") && !hasText(weekend, "allDoneDate")) {
            return new Result("周日结束仍未完成", fridayPart - 0.5);
        }
        if (!hasText(weekend, "allDoneDate")) return null;
        String saturday = addDays(key, 1);
        String doneDate = weekend.optString("allDoneDate");
        String target = weekend.optString("targetTime", "18:00");
        double finishPart = 0;
        String label = "周日完成";
        if (doneDate.compareTo(saturday) < 0) {
            finishPart = 1;
            label = "周五提前全部完成";
        } else if (doneDate.equals(saturday)) {
            if (weekend.optString("allDoneTime", "23:59").compareTo(target) <= 0) {
                finishPart = 1;
                label = target + " 目标前完成";
            } else {
                finishPart = 0.5;
                label = target + " 目标后完成";
            }
        }
        return new Result(label, fridayPart + finishPart);
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
                || record.optBoolean("ledgerConfirmed")) return true;
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
        card.setBackground(rounded(selected ? GREEN_SOFT : Color.WHITE, 15, selected ? Color.rgb(155, 189, 171) : LINE, 1));
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
        button.setBackground(rounded(primary ? GREEN : GREEN_SOFT, 12, primary ? GREEN : Color.rgb(155, 189, 171), 1));
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
        card.setBackground(rounded(SURFACE, 22, LINE, 1));
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
