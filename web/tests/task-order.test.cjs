// Run with: node web/tests/task-order.test.cjs
// In-memory DOM/storage harness: exercises production rendering and bound events.
// This is not a browser layout or native Android runtime test.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
const androidSource = fs.readFileSync(path.join(__dirname, '../../android/app/src/main/java/com/homework/ledger/MainActivity.java'), 'utf8');
const androidStrings = fs.readFileSync(path.join(__dirname, '../../android/app/src/main/res/values/strings.xml'), 'utf8');
const androidManifest = fs.readFileSync(path.join(__dirname, '../../android/app/src/main/AndroidManifest.xml'), 'utf8');
assert(html.includes('<title>作业小计划</title>') && html.includes('<h1>作业小计划</h1>'), 'web page and browser title use the new app name');
assert(androidStrings.includes('<string name="app_name">作业小计划</string>') && androidManifest.includes('android:label="@string/app_name"'), 'Android launcher uses the new app name');
assert(androidSource.includes('text("🌟 作业小计划",'), 'native home uses the same app name');
assert(source.includes('作业小计划备份-') && androidSource.includes('作业小计划备份-'), 'backup filenames use the new name on both platforms');
assert(source.includes('const STORAGE_KEY = "homework-ledger-v1"') && source.includes('format: "homework-ledger-backup"'), 'renaming leaves existing storage and backup compatibility intact');
const dailyMarkup = html.split('<section class="daily-checkins"')[1].split('</section>')[0];
assert(dailyMarkup.includes('>习惯打卡</h2>'), 'habit heading uses the chosen name');
assert(html.indexOf('class="daily-checkins"') < html.indexOf('id="taskPanel"'), 'habits appear before homework');
assert.deepEqual([...dailyMarkup.matchAll(/class="daily-required-card" id="([^"]+)"/g)].map(match => match[1]),
  ['sportCard', 'readingButton', 'mathThinkingButton', 'englishReadingButton'], 'four habits are visible in the requested order');
assert.equal((dailyMarkup.match(/\bhidden\b/g) || []).length, 6, 'only sports options are hidden (plus the five decorative aria-hidden marks)');
assert(/id="sportOptions"[^>]* hidden/.test(dailyMarkup));
assert(!/dailyCheckinsToggle|dailyCheckinsBody|dailyCheckinsExpanded|我做完作业再来打卡/.test(html + source + androidSource), 'whole-section folding and misleading postponement copy are removed');
assert(/\.daily-checkins-grid\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/.test(styles), 'compact habits retain two columns');
assert(androidSource.indexOf('card.addView(buildDailyCheckins()') < androidSource.indexOf('taskPanel = buildTasksPanel()'), 'native habits also appear above homework');
const nativeHabitCompletion = androidSource.split('private void addDailyCompletion(')[1].split('private void renderPendingTaskGroups(')[0];
assert(nativeHabitCompletion.includes('pendingDailyRequirements(currentRecord(false))') && nativeHabitCompletion.includes('if (!pending.isEmpty())') && nativeHabitCompletion.indexOf('return;') < nativeHabitCompletion.indexOf('text("🎉"'), 'native celebration waits for daily habits');
assert(androidSource.includes('sportOptionsPanel.setVisibility(sportOptionsExpanded ? View.VISIBLE : View.GONE)'), 'native only folds sports details');
assert(androidSource.includes('if (!currentDate.equals(sportOptionsDate))'), 'native sports details reset when switching dates');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const settingsMarkup = html.split('id="settingsPage"')[1].split('id="keywordSettingsPage"')[0];
assert(settingsMarkup.includes('id="openKeywordSettingsButton"') && !/keywordSettingsSubjects|keywordSettingsList|keywordSettingsInput/.test(settingsMarkup), 'settings only contains the keyword entry, not the editor');
const keywordPageMarkup = html.split('id="keywordSettingsPage"')[1].split('id="taskEntryPage"')[0];
assert(keywordPageMarkup.includes('id="keywordSettingsList"') && keywordPageMarkup.includes('aria-label="返回设置"'), 'keyword management is on its own page with a return-to-settings action');
const nativeSettings = androidSource.split('private View buildSettingsPage(')[1].split('private View buildTaskKeywordSettingsPage(')[0];
assert(!nativeSettings.includes('buildTaskKeywordSettingsCard()') && nativeSettings.includes('showTaskKeywordSettingsPage()'), 'native settings contains only the keyword launcher');
const nativeKeywordPage = androidSource.split('private View buildTaskKeywordSettingsPage(')[1].split('private LinearLayout buildTaskKeywordSettingsCard(')[0];
assert(nativeKeywordPage.includes('buildTaskKeywordSettingsCard()') && !nativeKeywordPage.includes('AlertDialog'), 'native keyword controls move into a full page');
assert(nativeKeywordPage.includes('settingsPageView.setVisibility(View.VISIBLE)') && nativeKeywordPage.includes('hideSoftInputFromWindow'), 'native keyword back returns to settings and dismisses the keyboard');
assert(/taskKeywordSettingsPageView\.getVisibility\(\) == View\.VISIBLE\) \{\s+closeTaskKeywordSettingsPage\(\);/.test(androidSource), 'native system back respects the settings hierarchy');
assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');
for (const [, id] of source.matchAll(/\$\("#([^"\)]+)"\)/g)) {
  assert(ids.includes(id), `Missing bound element: ${id}`);
}
for (const [, value] of html.matchAll(/aria-(?:describedby|labelledby)="([^"]+)"/g)) {
  for (const id of value.split(/\s+/)) assert(ids.includes(id), `Missing accessibility element: ${id}`);
}
assert(!/voiceTaskButton|voiceStatus|SpeechRecognition|toggleVoiceInput/.test(html + source), 'homework speech entry is removed');
assert(/id="taskEntryEstimate"[^>]*><\/select>\s*<button[^>]*id="addTasksButton"/.test(html), 'estimate sits to the left of the wider add button');
assert(/\.task-entry-composer\s*\{[^}]*width: 100%/.test(styles), 'composer returns to full page width');
assert(/\.task-keyword-suggestions\s*\{[^}]*overflow-x: auto/.test(styles), 'keywords return to a horizontal strip');
assert(!androidSource.includes('Math.min(View.MeasureSpec.getSize(widthMeasureSpec), dp(640))'), 'native composer no longer has the compact width cap');
assert(androidSource.indexOf('taskEntryActions.addView(taskEntryEstimateButton,') < androidSource.indexOf('taskEntryActions.addView(taskEntryAddButton,'), 'native estimate is left of add');
assert(androidSource.includes('new android.widget.HorizontalScrollView(this)') && androidSource.includes('dp(compactTaskEntry ? 80 : 112)'), 'native restores horizontal keywords and widens add on both phone and tablet');
assert(androidSource.includes('IME_FLAG_NO_EXTRACT_UI'), 'native landscape keyboard keeps the entry page visible');
assert(source.includes('function toggleDictationWordRecording('), 'dictation recordings remain available');
assert(source.includes('function toggleAlarmRecording('), 'custom alarm recordings remain available');
const entryActionbar = html.match(/<div class="task-entry-actionbar">([\s\S]*?)<\/div>/)?.[1];
const entryPageTag = html.match(/<section[^>]*id="taskEntryPage"[^>]*>/)?.[0];
assert(entryPageTag && !/role="dialog"|aria-modal/.test(entryPageTag), 'homework entry is a secondary page, not a modal');
assert(html.includes('aria-label="返回今日任务">‹</button>'), 'entry has a back action instead of a modal close');
const entryPageRule = styles.match(/\.task-entry-page \{([^}]+)\}/)?.[1];
assert(entryPageRule && /height:\s*100dvh/.test(entryPageRule) && !/backdrop-filter|rgba|position:\s*fixed/.test(entryPageRule), 'entry uses the full viewport without a modal backdrop');
assert(!/taskEntryModal|taskEntryDialog|showTaskEntryDialog|dismissTaskEntryDialog/.test(html + source + androidSource), 'old entry modal is removed on both platforms');
const nativeEntryPage = androidSource.split('private void showTaskEntryPage(')[1].split('private LinearLayout buildWeekendTaskPlanEntry(')[0];
assert(!/AlertDialog|entryHeight|\.isShowing\(|\.dismiss\(/.test(nativeEntryPage), 'native entry uses the page container, with no dialog size limit');
assert(nativeEntryPage.includes('mainPageView.setVisibility(View.GONE)') && nativeEntryPage.includes('taskEntryPageView.setVisibility(View.VISIBLE)'), 'native navigation switches pages');
assert(nativeEntryPage.includes('SOFT_INPUT_ADJUST_RESIZE'), 'native page allows the keyboard to resize its content');
assert(androidSource.includes('if (isTaskEntrySorting()) returnToTaskEntry(); else closeTaskEntryPage();'), 'native back returns from sorting before leaving entry');
assert(entryActionbar, 'entry actions have one compact row above the task list');
assert.deepEqual([...entryActionbar.matchAll(/<button[^>]*id="([^"]+)"/g)].map(match => match[1]),
  ['taskEntryCloseButton', 'taskEntryOrderButton', 'taskEntryConfirmButton'], 'confirm is the rightmost entry action');
assert(/id="taskEntryConfirmButton"[^>]*>确定<\/button>/.test(entryActionbar));
assert(!/taskEntryStickyFooter|task-plan-toolbar|taskEntryPendingTitle|taskEntryPendingSummary/.test(html + source), 'old heading, count row and footer are removed');
assert(!/taskOrderProgress|我的顺序/.test(html + source), 'sorting preview has no redundant heading or count row');
const orderActions = html.match(/<div class="order-secondary-actions">([\s\S]*?)<\/div>/)?.[1];
assert(orderActions?.includes('id="taskOrderCloseButton"'), 'return to entry is among the bottom actions');
assert(html.indexOf('id="taskOrderCloseButton"') > html.indexOf('id="taskOrderChoices"'), 'return follows the task list');
for (const selector of ['.task-item', '.pending-task-row', '.weekend-plan-row[data-subject]']) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = styles.match(new RegExp('(?:^|\\n)' + escaped + ' \\{([^}]+)\\}'))?.[1];
  assert(rule, `Missing card style: ${selector}`);
  assert(/padding:\s*0\s*;/.test(rule), `${selector} has no inset before its subject label`);
  assert(/box-shadow:\s*none\s*;/.test(rule), `${selector} has no decorative shadow`);
  assert(!/border-left|linear-gradient/.test(rule), `${selector} has no left accent or shaded gradient`);
}
assert.equal((androidSource.match(/addView\(taskSubjectLabel\(/g) || []).length, 4, 'all four native task-list renderers use the shared edge label');
assert.equal((androidSource.match(/addView\(taskEstimateView\(/g) || []).length, 4, 'all four native task-list renderers use a separate estimate');
assert(!androidSource.includes('TextView subjectBadge'), 'native inline subject badges are removed');
assert(!/\.order-choice-row\.is-picked\s*\{/.test(styles), 'selected task cards retain the same subject background and text styles');
assert(androidSource.includes('card.setBackground(rounded(taskSubjectSoftColor(subject), 13, LINE, 1));'), 'native sorting always uses the original subject background');
assert(!androidSource.includes('selectedWhileSorting'), 'native selection no longer changes the background');
const startChoiceMarkup = html.split('id="startPlanModal"')[1].split('id="startPlanCountdownPanel"')[0];
assert(/id="startPlanFiveMinutesButton"[^>]*>5分钟后<\/button>/.test(startChoiceMarkup));
assert(/id="startPlanTenMinutesButton"[^>]*>10分钟后<\/button>/.test(startChoiceMarkup));
assert(!/scheduled-task|startPlanTaskCard/.test(startChoiceMarkup), 'start task is displayed as plain text');
assert(/id="startPlanTime" type="time"/.test(startChoiceMarkup), 'the exact time picker remains');
assert.deepEqual([...startChoiceMarkup.matchAll(/<button[^>]*id="([^"]+)"/g)].map(match => match[1]),
  ['startPlanCloseButton', 'startPlanFiveMinutesButton', 'startPlanTenMinutesButton', 'saveStartPlanButton'], 'start choice has exactly two compact shortcuts plus close and confirm');
const nativeStartChoice = androidSource.split('private void showTaskStartChoice(')[1].split('private void scheduleTaskStart(')[0];
assert(!/nowButton|fifteenButton|taskCard/.test(nativeStartChoice), 'native does not add redundant now/15-minute buttons or a task card');
assert(nativeStartChoice.includes('int[] shortcutMinutes = {5, 10};'), 'native uses the same two quick choices');
assert(nativeStartChoice.includes('quickStartAt[0] = System.currentTimeMillis() + minutes * 60000L;'), 'native shortcuts calculate from click time, including seconds and day rollover');
assert(nativeStartChoice.includes('scheduleTaskStart(taskId, planDate, quickStartAt[0], nextTask);'), 'native saves the selected shortcut only when confirmed');
assert(nativeStartChoice.includes('quickStartAt[0] = 0L;') && nativeStartChoice.includes('defaultTimeUntouched[0] = false;'), 'native manual edits clear shortcut/default intent');
assert(nativeStartChoice.includes('new TimePickerDialog(') && nativeStartChoice.includes('.setPositiveButton(resuming ? "继续这项" : "确定", null)'), 'native start choice keeps the system time picker, with a resume-specific confirmation label');
assert(nativeStartChoice.includes('resuming ? "继续刚才的作业"') && nativeStartChoice.includes('resuming ? taskResumeTimeLabel(task)'), 'native resume reuses the title and label for prior work time');
const nativeStartCountdown = androidSource.split('private void renderStartPlanTimerDialog(')[1].split('private void startTaskFromStartPlan(')[0];
assert(nativeStartCountdown.includes('resuming ? taskResumeTimeLabel(task)') && nativeStartCountdown.includes('"提前继续这项" : "继续这项"'), 'native countdown preserves the resume-specific time and action');
const nativeResumeTimeLabel = androidSource.split('private String taskResumeTimeLabel(')[1].split('private void showTaskStartChoice(')[0];
assert(nativeResumeTimeLabel.includes('task.optLong("elapsedMs", 0L)') && nativeResumeTimeLabel.includes('return "之前已做 " + duration;'), 'native previous time is based on saved work, not time spent paused');
assert(!nativeStartChoice.includes('suggested.add('), 'all native start choices default to the current time');
assert(nativeStartChoice.includes('if (unchangedDefault || currentMinute)'), 'native confirms the current-time choice for first, next and resumed work');
assert(!/startPlanTaskView\.setBackground/.test(androidSource), 'native countdown also uses plain task text');
const startTaskTextRule = styles.match(/\.start-plan-task\s*\{([^}]+)\}/)?.[1];
assert(startTaskTextRule && /text-align:\s*center/.test(startTaskTextRule), 'start task text is centered');
assert(!/background|border|box-shadow/.test(startTaskTextRule), 'start task text has no card decoration');
assert(/\.start-plan-task > strong\s*\{[^}]*color:\s*var\(--subject-color, #756f65\)/.test(styles), 'start task content uses its subject color with a fallback');
for (const subject of ['语文', '数学', '英语', '科学']) {
  assert(styles.includes(`#startPlanTask[data-subject="${subject}"]`), `${subject} start text shares the subject palette`);
}
assert(nativeStartChoice.includes('taskLabel.setGravity(Gravity.CENTER)') && nativeStartChoice.includes('taskText.setGravity(Gravity.CENTER)'), 'native choice centers the label and homework');
assert(nativeStartChoice.includes('taskSubjectColor(task.optString("subject", "其他"))'), 'native choice highlights homework in its subject color');
assert(androidSource.includes('startPlanTaskView.setGravity(Gravity.CENTER)') && androidSource.includes('startPlanTaskView.setTextColor(taskSubjectColor(subject))'), 'native countdown preserves centered colored homework');
assert(!/quest-progress|quest-time-summary/.test(html + source + styles), 'homework progress bar and its old caption are removed');
assert(!/taskQuestProgressBar|taskQuestProgressPanel|taskQuestPhaseView/.test(androidSource), 'native homework progress widgets are removed');
const focusMarkup = html.split('id="focusModal"')[1].split('id="startPlanModal"')[0];
const nativeFocusDialog = androidSource.split('private void showTaskFocusDialog(')[1].split('private void dismissTaskFocusDialog(')[0];
assert(!/已用时间|我先做好这一项，完成后再去下一关！/.test(focusMarkup + nativeFocusDialog), 'unnecessary focus captions are removed on both platforms');
for (const id of ['focusModalElapsed', 'focusModalEstimate', 'focusModalComparison', 'focusModalStartedAt', 'focusPauseButton', 'focusCompleteButton', 'focusOverallDone', 'focusOverallRemaining', 'focusOverallTime']) {
  assert(focusMarkup.includes(`id="${id}"`), `Focus timer and controls remain: ${id}`);
}
assert(!/focusCloseButton|暂时收起专注卡/.test(html + source), 'focus has no close button or binding');
assert(focusMarkup.includes('id="focusSkipButton"') && focusMarkup.includes('跳过，开始下一项'), 'focus offers an explicit skip action');
assert(nativeFocusDialog.includes('dialog.setCancelable(false)') && nativeFocusDialog.includes('dialog.setCanceledOnTouchOutside(false)'), 'native focus cannot be canceled by back or backdrop');
assert(!/暂时收起|setNegativeButton/.test(nativeFocusDialog), 'native focus no longer offers dismissal');
for (const action of ['pause', 'complete', 'skip']) {
  assert(nativeFocusDialog.includes(`performTaskAction("${action}", taskIndex)`), `native focus binds ${action}`);
}
assert(nativeFocusDialog.includes('skip.setEnabled(nextIndex >= 0)'), 'native skip is disabled if no other task can run today');
assert(/\.focus-header\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*space-between/.test(styles), 'focus header places the progress on the right without absolute-position overlaps');
assert(/\.focus-overall-progress\s*\{[^}]*text-align:\s*right/.test(styles));
assert(nativeFocusDialog.includes('header.addView(progress, weightedWrap(1))') && nativeFocusDialog.includes('progress.setGravity(Gravity.END)'), 'native overall progress uses the right side of the header');
assert(nativeFocusDialog.includes('updateTaskFocusProgress();'), 'native progress is populated when focus opens');
const nativeFocusTick = androidSource.split('private final Runnable taskFocusTick')[1].split('protected void onCreate')[0];
assert(nativeFocusTick.includes('updateTaskFocusProgress();'), 'native progress refreshes with the running clock');
assert(androidSource.includes('List<Integer> indexes = dailyProgressTaskIndexes(tasks);') && androidSource.includes('questMode ? dailyProgressTaskIndexes(tasks)'), 'native home and focus share today/weekend scope');
assert(source.includes('const todayTasks = dailyProgressTasks();') && source.includes('questMode ? dailyProgressTasks(tasks, date)'), 'web home and focus share today/weekend scope');
const nativeSkipSelector = androidSource.split('private int nextTaskIndexAfter(')[1].split('private int taskIndexById(')[0];
assert(nativeSkipSelector.includes('offset < tasks.length()') && nativeSkipSelector.includes('(currentIndex + offset) % tasks.length()'), 'native skip excludes the current task and preserves circular plan order');
assert(nativeSkipSelector.includes('taskCanRunToday(task)') && nativeSkipSelector.includes('!"done".equals'), 'native skip respects task completion and planned dates');
assert(androidSource.includes('if (skipping) stopTaskClock(task, "paused");'), 'native active and paused skips both preserve elapsed time without completing the task');
assert(/id="skipPausedTaskButton"[^>]*hidden>跳过，开始下一项<\/button>/.test(html), 'resume-only skip is hidden by default');
assert(nativeStartChoice.includes('addStartPlanSkipAction(content, task, taskIndex);'), 'native resume choice includes the skip action');
const nativeStartTimer = androidSource.split('private void showStartPlanTimerDialog(')[1].split('private void renderStartPlanTimerDialog(')[0];
assert(nativeStartTimer.includes('addStartPlanSkipAction(content, task, taskIndex);'), 'native resume countdown also includes the skip action');
const nativeResumeSkip = androidSource.split('private void updateStartPlanSkipAction(')[1].split('private void showTaskStartChoice(')[0];
assert(nativeResumeSkip.includes('setVisibility(resuming ? View.VISIBLE : View.GONE)') && nativeResumeSkip.includes('nextTaskIndexAfter(taskIndex) >= 0'), 'native only shows skip for resumed work with availability checked');
assert(nativeResumeSkip.includes('performTaskAction("skip-paused", taskIndexById(taskId))'), 'native resume skip uses a guarded paused-task action');
assert(androidSource.includes('if (active != null) showTaskFocusDialog(active, taskIndexById(active.optString("id")));'), 'native restores focus after recreating the activity');
assert(source.includes('else restoreActiveFocus();'), 'web restores active focus after reloading');
const breakChoiceMarkup = html.split('id="breakChoiceModal"')[1].split('id="breakTimerModal"')[0];
assert(!/scheduled-task|breakChoiceTaskCard|primary-button/.test(breakChoiceMarkup), 'rest choice has no nested task card or oversized primary action');
assert(!source.includes('breakChoiceTaskCard'), 'removed rest-card bindings are cleaned up');
assert.deepEqual([...breakChoiceMarkup.matchAll(/data-break-minutes="(\d+)"/g)].map(match => Number(match[1])), [5, 10, 15]);
assert(breakChoiceMarkup.includes('for="breakReturnTime">回来时间</label>'));
assert(/id="startTimedBreakButton"[^>]*>确定<\/button>/.test(breakChoiceMarkup), 'custom return time keeps a short confirm label');
const breakTaskRule = styles.match(/\.break-choice-task\s*\{([^}]+)\}/)?.[1];
assert(breakTaskRule && /text-align:\s*center/.test(breakTaskRule));
assert(!/background|border|box-shadow/.test(breakTaskRule), 'rest homework is plain centered text');
assert(/\.break-quick-actions button\s*\{[^}]*min-height:\s*44px/.test(styles), 'compact time buttons retain a usable touch target');
const breakTimeRowRule = styles.match(/\.break-return-row\s*\{([^}]+)\}/)?.[1];
assert(/grid-template-columns:\s*auto minmax\(0, 1fr\) auto/.test(breakTimeRowRule), 'return label, picker and confirm stay on one row');
assert(!/background|border|padding/.test(breakTimeRowRule), 'return controls have no outer card');
assert.equal((styles.match(/\.break-return-row\s*\{/g) || []).length, 1, 'mobile no longer adds a separate label row');
const nativeBreakChoice = androidSource.split('private void showBreakChoiceDialog(')[1].split('private void startBreakSession(')[0];
const nativeBreakTask = androidSource.split('private void updateBreakChoiceTask(')[1].split('private void showBreakChoiceDialog(')[0];
assert(nativeBreakChoice.includes('next.setGravity(Gravity.CENTER)') && !nativeBreakChoice.includes('next.setBackground('));
assert(nativeBreakTask.includes('nextTaskView.setTextColor(taskSubjectColor(subject))') && !nativeBreakTask.includes('setBackground('), 'native homework shares the subject color without a card');
assert(!/setPositiveButton|setNegativeButton|去吃饭/.test(nativeBreakChoice), 'native rest choice removes the bulky standard footer and meal button');
assert(nativeBreakChoice.includes('textButton(fromPause ? "不休息，继续这项" : "不休息，开始下一项")'));
assert(nativeBreakChoice.includes('confirmTime.setOnClickListener') && nativeBreakChoice.includes('startBreakSession(breakChoiceTaskIndex, end.getTimeInMillis(), "meal")'), 'native exact time starts on confirmation');
assert(nativeBreakChoice.includes('timeButton.setTextSize(14)') && nativeBreakChoice.includes('matchFixed(dp(44))'), 'native compact time controls retain touch height');
assert(!/我提前回来了，开始下一项|我回来了，开始下一项/.test(html + source + androidSource), 'the long rest-return button label is removed on both platforms');
assert(/id="startNextTaskButton"[^>]*>现在开始<\/button>/.test(html), 'rest timer initially shows the short start label');
assert(androidSource.includes('start.setText(remaining > 0 ? "现在开始" : "开始下一项")'), 'native countdown uses the same short early-start label');
assert(html.includes('距离回来还有'), 'the rest countdown label is unaffected');
assert(!/预计剩余/.test(source + androidSource), 'both platforms use the revised remaining-time wording');
assert(androidSource.includes('String prefix = "预计还需 ";'), 'native overview uses the same wording');
assert(/\.task-remaining-time strong\s*\{[^}]*color:\s*#345f9e;[^}]*font-weight:\s*800/.test(styles), 'remaining value and unit share a bold highlight');
const nativeRemainingLabel = androidSource.split('private SpannableString remainingTimeLabel(')[1].split('private void updateTaskRemainingTime(')[0];
assert(nativeRemainingLabel.includes('new SpannableString(prefix + minutes + " 分钟")'), 'native highlight groups the value and unit');
assert(nativeRemainingLabel.includes('int start = prefix.length(), end = label.length();'), 'native highlight excludes the prefix and includes the minutes unit');
assert(nativeRemainingLabel.includes('new StyleSpan(Typeface.BOLD)') && nativeRemainingLabel.includes('new ForegroundColorSpan(Color.rgb(52, 95, 158))'), 'native time value uses the same bold blue highlight');
assert(androidSource.includes('dictationProgressBar.setProgress(percent)'), 'dictation progress is unaffected');
assert(/\.task-panel-heading\[hidden\]\s*\{\s*display:\s*none/.test(styles), 'the old heading and duplicate count take no space while doing homework');
const launchRule = styles.match(/\.task-launch-button\s*\{([^}]+)\}/)?.[1];
assert(launchRule && /align-self:\s*stretch/.test(launchRule) && /min-height:\s*84px/.test(launchRule), 'the launch button stretches to the full card height');
assert(/flex:\s*0 0 84px/.test(launchRule) && /border-radius:\s*0/.test(launchRule), 'launch is a fixed-width edge action, not an inset pill');
assert(/#623b0b/.test(launchRule) && /#ffd16c, #ffb33c/.test(launchRule), 'launch uses dark text on a warm gold-orange background');
assert(/\.task-launch-button:focus-visible\s*\{[^}]*outline:/.test(styles), 'keyboard focus remains visible');
assert(/\.task-item\.has-launch-action > \.task-main-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/.test(styles), 'launch cards leave a flexible text column on narrow screens');
const nativeLaunch = androidSource.split('private Button createTaskLaunchButton(')[1].split('private void addTaskCard(')[0];
assert(nativeLaunch.includes('"▶\\n开始挑战"') && nativeLaunch.includes('button.setContentDescription("开始挑战："'), 'native launch has matching text and an accessible task name');
assert(nativeLaunch.includes('button.setOnClickListener(v -> action.run())'), 'native launch keeps its own click action');
assert(androidSource.includes('boolean hasLaunchAction = confirmed && canDoToday && allowActions && "pending".equals(status);'), 'native preview and non-pending cards do not get a launch action');
assert(/item\.addView\(createTaskLaunchButton\(task, \(\) -> performTaskAction\("start", taskIndex\)\),\s*fixed\(dp\(84\), LinearLayout.LayoutParams.MATCH_PARENT\)\)/.test(androidSource), 'native launch is a full-height right-edge child of the card');

function harness(seed, date = '2026-09-08', savedStorage, fixedNow) {
  function node() {
    const handlers = new Map();
    return {
      hidden: true, value: '', textContent: '', innerHTML: '', dataset: {}, style: {}, scrollTop: 0, scrollHeight: 42,
      classList: { add() {}, remove() {}, toggle() {} },
      focus() { document.activeElement = this; }, attributes: {},
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name]; }, setSelectionRange() {},
      querySelector() { return node(); }, querySelectorAll() { return []; }, contains() { return false; },
      addEventListener(type, fn) {
        if (!handlers.has(type)) handlers.set(type, []);
        handlers.get(type).push(fn);
      },
      emit(type, event = {}) { for (const fn of handlers.get(type) || []) fn(event); },
      click() { this.emit('click', { target: this }); }
    };
  }
  const nodes = new Map(ids.map(id => ['#' + id, node()]));
  const storage = savedStorage || new Map();
  const document = {
    ...node(), body: node(), querySelector: selector => nodes.get(selector) || null,
    createElement() {
      return { textContent: '', get innerHTML() {
        return this.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      } };
    }
  };
  let clockNow = fixedNow;
  const signals = { toasts: [], alarms: [] };
  const windowEvents = node();
  const context = {
    document, console, navigator: {}, testSignals: signals,
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    addEventListener: windowEvents.addEventListener, setTimeout() { return 1; }, clearTimeout() {},
    setInterval() { return 1; }, clearInterval() {}, requestAnimationFrame: fn => fn()
  };
  if (fixedNow !== undefined) context.Date = class extends Date {
    constructor(...args) { super(...(args.length ? args : [clockNow])); }
    static now() { return clockNow; }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../holiday-plans.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../holiday-ui.js'), 'utf8'), context);
  const start = source.lastIndexOf('  elements.recordDate.value = todayIso();');
  assert(start > 0);
  vm.runInContext(source.slice(0, start) + `
    render = () => { renderWeekend(); renderTasks(); renderDailyCheckins(); };
    showToast = message => testSignals.toasts.push(message);
    playAlarm = count => testSignals.alarms.push(count);
    stopAlarmPlayback = () => {};
    globalThis.api = { renderTasks, taskOrderDraft, chooseTaskOrder, openTaskOrderModal,
      toggleTaskListConfirmation, saveWeekendTaskPlan,
      confirmTaskOrderSelection, performTaskAction, toggleTaskOrder, selectTaskSubject,
      openTaskEntryPage, confirmTaskPlan, selectWeekendTaskDay, renderWeekend,
      openStartPlanChoice, openStartPlanTimer, renderStartPlanTimer,
      nextTaskAfter, restoreActiveFocus, updateFocusModal, taskElapsedMs, persist,
      openBreakChoice, openBreakTimer, renderBreakTimer,
      renderDailyCheckins, currentRecord, pendingDailyRequirements, toggleSport, resultFor,
      restSession: () => breakSession,
      startSession: () => startPlanSession,
      estimateOptions: ESTIMATE_OPTIONS,
      setState(value, date) { if (value) state = value; elements.recordDate.value = date; },
      tasks: () => tasksForDate(), owner: () => taskOwnerForDate() };
  })();`, context);
  const api = context.api, el = id => nodes.get('#' + id);
  el('taskEntryEstimate').value = '15';
  api.setState(seed, date);
  api.renderTasks();
  api.renderDailyCheckins();
  const delegate = (element, type, selector, dataset, value) => el(element).emit(type, {
    target: { closest: match => match === selector ? { dataset, value } : null }
  });
  return {
    api, el, storage, signals, setClock: value => { clockNow = value; },
    emitWindow: windowEvents.emit, activeElement: () => document.activeElement,
    add: (title, minutes) => {
      el('taskDraft').value = title;
      if (minutes !== undefined) el('taskEntryEstimate').value = String(minutes);
      el('addTasksButton').click();
    },
    pick: id => delegate('taskOrderChoices', 'click', 'button[data-order-pick]', { orderPick: id }),
    day: day => delegate('taskOrderDays', 'click', 'button[data-order-day]', { orderDay: day }),
    cardIds: () => [...el('taskOrderChoices').innerHTML.matchAll(/data-order-pick="([^"]+)"/g)].map(match => match[1]),
    selected: () => Array.from(api.taskOrderDraft().selectedIds),
    original: () => Array.from(api.tasks(), task => task.id)
  };
}
const task = (id, plannedDay) => ({ id, subject: '数学', title: `作业${id}`, status: 'pending', estimatedMinutes: 15,
  breakAfter: true, ...(plannedDay ? { plannedDay } : {}) });
const owner = tasks => ({ tasks, tasksConfirmed: true, confirmed: true, ledgerConfirmed: true, planSaved: true,
  orderSaved: false, mealAfterTaskId: tasks[0]?.id });
const dailyState = () => ({ records: { '2026-09-08': owner([task('a'), { ...task('b'), estimatedMinutes: 60 }, task('c')]) }, weekends: {} });

function assertReadOnlyEstimates(markup) {
  const cards = [...markup.matchAll(/<article class="task-item order-choice-row[^>]*>([\s\S]*?)<\/article>/g)];
  assert(cards.length > 0);
  for (const [, content] of cards) {
    const subject = content.match(/<span class="task-subject-label"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/);
    assert(subject, 'subject label must have two text rows');
    assert(content.indexOf('task-subject-label') < content.indexOf('order-number'), 'subject label is left of the sequence number');
    assert(!content.includes('class="subject-badge"'), 'do not repeat the subject beside the title');
    assert.equal([...content.matchAll(/class="task-estimate"/g)].length, 1);
    assert(/>预计 \d+ 分钟<\/span>/.test(content));
    assert(!content.includes('<select'), 'sorting shows the estimate without a picker');
    assert(!content.includes('data-order-estimate='));
  }
}

function assertUnifiedTaskCards(markup, expectedCount) {
  const labels = [...markup.matchAll(/<span class="task-subject-label"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g)];
  assert.equal(labels.length, expectedCount, 'one two-row subject label per task');
  assert.equal([...markup.matchAll(/class="task-estimate"/g)].length, expectedCount, 'one separate estimate per task');
  for (const match of labels) assert(match[1] && match[2], 'each subject uses two populated rows');
  assert(!markup.includes('class="subject-badge"'), 'old inline pill labels are removed');
}

function assertOrderSelectionState(h, expectedSelectedIds, preview = false) {
  const cards = [...h.el('taskOrderChoices').innerHTML.matchAll(/<article class="([^"]*order-choice-row[^"]*)"[^>]*>([\s\S]*?)<\/article>/g)];
  assert(cards.length > 0);
  const selectedIds = [];
  for (const [, className, content] of cards) {
    const selected = className.split(/\s+/).includes('is-picked');
    if (preview) {
      assert(!selected, 'final preview is not in selection mode');
      assert(!content.includes('data-order-pick='));
    } else {
      const id = content.match(/data-order-pick="([^"]+)"/)?.[1];
      assert(id);
      if (selected) selectedIds.push(id);
      assert.equal(content.includes('aria-pressed="true"'), selected, 'selection state remains available without a background change');
      if (selected) assert(/class="order-number"[^>]*>\d+<\/span>/.test(content), 'selected tasks retain their sequence numbers');
    }
  }
  assert.deepEqual(selectedIds.sort(), [...expectedSelectedIds].sort());
}

function assertTaskOverview(h, completed, total, minutes) {
  const markup = h.el('taskList').innerHTML;
  assert.equal(h.el('taskPanelHeading').hidden, true, 'only the new summary row is shown during execution');
  assert.equal((markup.match(/class="task-overview"/g) || []).length, 1);
  assert(markup.includes(`已做 <b>${completed} / ${total}</b>`));
  assert(markup.includes(`预计还需 <strong>${minutes} 分钟</strong>`));
  assert(!/role="progressbar"|今日计划/.test(markup));
}

function assertFocusProgress(h, completed, remaining, minutes) {
  assert.equal(h.el('focusModal').hidden, false);
  assert.equal(h.el('focusOverallDone').textContent, String(completed));
  assert.equal(h.el('focusOverallRemaining').textContent, String(remaining));
  assert.equal(h.el('focusOverallTime').textContent, `${minutes} 分钟`);
  h.api.renderTasks();
  assertTaskOverview(h, completed, completed + remaining, minutes);
}

let h = harness(dailyState());
h.api.openTaskEntryPage();
assert.equal(h.el('taskEntryPage').hidden, false);
assert.equal(h.el('taskOrderModal').hidden, true, 'sorting is optional');
assert.equal(h.el('taskEntryConfirmButton').textContent, '确定');
assert.equal(h.el('taskEntryConfirmButton').disabled, false);
assert.equal(h.el('taskOrderButton').hidden, true, 'no separate sorting entry on the home page');
assert(h.el('taskEntryPendingList').innerHTML.indexOf('作业a') < h.el('taskEntryPendingList').innerHTML.indexOf('作业b'));
h.el('taskEntryConfirmButton').click();
assert.equal(h.api.owner().tasksConfirmed, true);
assert.equal(h.api.owner().orderSaved, true);
assert.equal(h.el('taskEntryPage').hidden, true);
assert.equal(h.el('startPlanModal').dataset.taskId, 'a');
assert(h.api.tasks().every(item => item.status === 'pending'), 'confirmation schedules rather than starts');
assertTaskOverview(h, 0, 3, 90);

h = harness(dailyState());
h.api.openTaskEntryPage();
h.el('taskEntryOrderButton').click();
assert.equal(h.el('taskEntryPage').hidden, false, 'same dialog stays open');
assert.equal(h.el('taskOrderModal').hidden, false);
assert.equal(h.el('taskEntryComposer').hidden, true);
assert.equal(h.el('taskOrderTitle').textContent, '第 1 项，我选……');
assert.equal(h.el('taskOrderTitle').hidden, false, 'selection still indicates which task to choose');
assertReadOnlyEstimates(h.el('taskOrderChoices').innerHTML);
assert.deepEqual(h.cardIds(), ['a', 'b', 'c']);
assertOrderSelectionState(h, []);
h.el('taskOrderChoices').scrollTop = 120;
h.pick('c'); h.pick('c');
assert.deepEqual(h.selected(), ['c']);
assertOrderSelectionState(h, ['c']);
assert.deepEqual(h.original(), ['a', 'b', 'c']);
assert.deepEqual(h.cardIds(), ['a', 'b', 'c']);
assert.equal(h.el('taskOrderChoices').scrollTop, 120);
assert.equal(h.el('taskEntryConfirmButton').disabled, true);
h.el('taskEntryConfirmButton').click();
assert(!h.api.owner().orderSaved, 'partial selection cannot confirm');
h.pick('a');
h.el('taskEntryCloseButton').click();
assert.equal(h.el('taskEntryPage').hidden, true);
h = harness(null, '2026-09-08', h.storage);
h.api.openTaskEntryPage();
assert.equal(h.el('taskOrderModal').hidden, false, 'draft resumes in the same dialog after reload');
assert.deepEqual(h.selected(), ['c', 'a']);
assertOrderSelectionState(h, ['c', 'a']);
h.pick('b');
assertOrderSelectionState(h, [], true);
assert.equal(h.el('taskOrderTitle').hidden, true, 'completed sorting leaves no heading row');
assert.equal(h.el('taskOrderTitle').textContent, '');
assert.equal(h.el('taskOrderCloseButton').textContent, '返回录入');
assertReadOnlyEstimates(h.el('taskOrderChoices').innerHTML);
assert.equal(h.el('taskOrderConfirmButton').hidden, true, 'only the common confirmation button remains');
assert.equal(h.el('taskEntryConfirmButton').disabled, false);
assert(!h.api.owner().orderSaved);
h.el('taskOrderUndoButton').click();
assert.deepEqual(h.selected(), ['c', 'a']);
assertOrderSelectionState(h, ['c', 'a']);
assert.equal(h.el('taskOrderTitle').hidden, false, 'undo restores the current selection cue');
assert.equal(h.el('taskOrderCloseButton').textContent, '取消调整');
h.el('taskOrderResetButton').click();
assert.deepEqual(h.selected(), []);
assertOrderSelectionState(h, []);
h.pick('b'); h.pick('c'); h.pick('a');
h.el('taskEntryConfirmButton').click();
assert.deepEqual(h.original(), ['b', 'c', 'a']);
assert.equal(h.api.owner().orderSaved, true);
assert.equal(h.api.owner().tasksConfirmed, true);
assert.equal(h.el('startPlanModal').dataset.taskId, 'b');
assert.equal(h.api.tasks()[0].estimatedMinutes, 60);
h.api.performTaskAction('start', 'b');
h.el('focusCompleteButton').click();
assert.equal(h.el('startPlanModal').dataset.taskId, 'c');
h.api.openTaskEntryPage();
assert.equal(h.el('taskEntryPage').hidden, true, 'execution locks plan edits');

// Return from optional sorting without another confirmation; appending keeps the chosen sequence.
h = harness(dailyState());
h.api.openTaskEntryPage();
h.el('taskEntryOrderButton').click();
h.pick('c');
h.el('taskOrderCloseButton').click();
assert.deepEqual(h.original(), ['a', 'b', 'c'], 'cancel an incomplete adjustment keeps the original sequence');
assert.equal(h.el('taskOrderModal').hidden, true);
assert.equal(h.el('taskEntryComposer').hidden, false);
h.el('taskEntryOrderButton').click();
h.pick('c'); h.pick('b'); h.pick('a');
h.el('taskOrderCloseButton').click();
assert.deepEqual(h.original(), ['c', 'b', 'a'], 'completed adjustment is previewed in the entry list');
h.add('新补充的作业', 35);
assert.deepEqual(h.original().slice(0, 3), ['c', 'b', 'a']);
assert.equal(h.api.tasks()[3].title, '新补充的作业');
h.api.performTaskAction('delete', 'b');
assert.deepEqual(h.original().slice(0, 2), ['c', 'a']);
h.el('taskEntryUndoDeleteButton').click();
assert.deepEqual(h.original().slice(0, 3), ['c', 'b', 'a'], 'undo restores the original position');
h.el('taskEntryConfirmButton').click();
assert.deepEqual(h.original().slice(0, 3), ['c', 'b', 'a']);
assert.equal(h.api.owner().orderSaved, true);

// Default order follows entry, not subject ranking. Existing orders survive opening and confirming.
const subjects = ['英语', '语文', '科学', '数学', '其他'];
const subjectTasks = subjects.map((subject, index) => ({ ...task('subject-' + index), subject }));
h = harness({ records: { '2026-09-08': owner(subjectTasks) }, weekends: {} });
h.api.openTaskEntryPage();
assert.deepEqual(Array.from(h.api.tasks(), item => item.subject), subjects);
const entryMarkup = h.el('taskEntryPendingList').innerHTML;
assertUnifiedTaskCards(entryMarkup, subjects.length);
assert(/class="task-plan-actions"><div class="task-plan-schedule"><span class="task-estimate"/.test(entryMarkup), 'entry estimate is in the right-side schedule row');
assert(!entryMarkup.includes('task-plan-number'), 'entry task titles have no redundant sequence numbers');
const nativeEntryRow = androidSource.split('private void addPendingTaskRow(')[1].split('private void showPendingTaskEditDialog(')[0];
assert(!nativeEntryRow.includes('String.valueOf(number)'), 'native entry has no sequence numbers');
assert(nativeEntryRow.includes('LinearLayout schedule = horizontal()') && nativeEntryRow.indexOf('schedule.addView(taskEstimateView(task)') < nativeEntryRow.indexOf('schedule.addView(day,'), 'native estimate appears before the date on the same row');
for (const subject of subjects) assert(entryMarkup.includes('data-subject="' + subject + '"'));
h.el('taskEntryOrderButton').click();
assertReadOnlyEstimates(h.el('taskOrderChoices').innerHTML);
for (let index = 0; index < subjectTasks.length; index++) {
  h.pick(subjectTasks[index].id);
  const preview = index === subjectTasks.length - 1;
  assertOrderSelectionState(h, preview ? [] : subjectTasks.slice(0, index + 1).map(item => item.id), preview);
}
assertReadOnlyEstimates(h.el('taskOrderChoices').innerHTML);
h.el('taskEntryConfirmButton').click();
assert.deepEqual(Array.from(h.api.tasks(), item => item.subject), subjects);
assertUnifiedTaskCards(h.el('taskList').innerHTML, 3);
assert(/class="task-card-aside"><span class="task-estimate"/.test(h.el('taskList').innerHTML), 'home estimate is in the right-side column');

// Current, paused, completed, long-title and escaped-content cards share the same layout.
const statusTasks = [
  { ...task('running'), status: 'active', subject: '语文', title: '朗读很长的课文标题，并完成课后的练习和订正', startedAt: '18:00' },
  { ...task('resting'), status: 'paused', subject: '英语' },
  { ...task('finished'), status: 'done', subject: '科学', title: '<script>不要执行</script>', completedAt: '18:10', completedDate: '2026-09-08' }
];
h = harness({ records: { '2026-09-08': { ...owner(statusTasks), orderSaved: true } }, weekends: {} });
h.el('taskList').emit('click', { target: { closest: selector => selector === 'button[data-list-toggle]' ? { dataset: { listToggle: 'completed' } } : null } });
const statusMarkup = h.el('taskList').innerHTML;
assertUnifiedTaskCards(statusMarkup, 3);
assert(statusMarkup.includes('已用 ') && statusMarkup.includes('实际 '), 'actual elapsed time and completion details remain');
assert(statusMarkup.includes('&lt;script&gt;') && !statusMarkup.includes('<script>'), 'task content remains escaped');
for (const [, content] of statusMarkup.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g)) {
  assert(/^\s*<span class="task-subject-label">/.test(content), 'subject is the first child, flush to the card edge');
  assert(content.indexOf('task-estimate') > content.indexOf('task-copy'), 'estimate follows the flexible text column');
}

// Friday dates and all three daily orders are saved atomically.
const weekendTasks = [task('f1', 'friday'), task('s1', 'saturday'), task('u1', 'sunday'), task('f2', 'friday'), task('s2', 'saturday')];
h = harness({ records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: { '2026-09-11': owner(weekendTasks) } }, '2026-09-11');
h.api.openTaskEntryPage();
assert.equal(h.el('taskEntryDays').hidden, false);
assertUnifiedTaskCards(h.el('taskEntryPendingList').innerHTML, weekendTasks.length);
assert(h.el('taskEntryPendingList').innerHTML.includes('data-entry-plan-day='));
h.api.selectWeekendTaskDay('s1', 'friday');
assert.equal(h.api.tasks().find(item => item.id === 's1').plannedDay, 'friday');
assert(!h.api.owner().confirmed && !h.api.owner().planSaved);
h.api.selectWeekendTaskDay('s1', 'saturday');
h.el('taskEntryOrderButton').click();
assert.deepEqual(h.cardIds(), ['f1', 'f2']);
h.pick('s1');
assert.deepEqual(h.selected(), [], 'cannot select from another day');
h.pick('f2'); h.pick('f1');
assertOrderSelectionState(h, ['f1', 'f2']);
assert.equal(h.el('taskOrderConfirmButton').textContent, '选择周六');
h.el('taskOrderConfirmButton').click();
assert.deepEqual(h.cardIds(), ['s1', 's2']);
assertOrderSelectionState(h, []);
h.pick('s2');
assertOrderSelectionState(h, ['s2']);
h.day('sunday'); h.pick('u1');
h.el('taskOrderUndoButton').click();
assert.deepEqual(h.cardIds(), ['u1']);
h.pick('u1'); h.day('saturday'); h.pick('s1');
assertOrderSelectionState(h, [], true);
assert(!h.api.owner().confirmed && !h.api.owner().planSaved && !h.api.owner().orderSaved);
h.el('taskEntryConfirmButton').click();
assert.deepEqual(h.original(), ['f2', 'f1', 's2', 's1', 'u1']);
assert(h.api.owner().confirmed && h.api.owner().planSaved && h.api.owner().orderSaved);
assertUnifiedTaskCards(h.el('weekendTaskPlanList').innerHTML, weekendTasks.length);
assert.equal(h.el('startPlanModal').dataset.taskId, 'f2');
assertTaskOverview(h, 0, 2, 30);
const weekendStorage = h.storage;
h = harness(null, '2026-09-12', weekendStorage);
assertTaskOverview(h, 0, 4, 60);
h.api.openTaskEntryPage();
assert.equal(h.el('taskEntryComposer').hidden, true, 'Saturday is read-only');
assert.equal(h.el('taskEntryOrderButton').hidden, true);
assert.equal(h.el('taskEntryConfirmButton').hidden, true, 'read-only plan has no confirmation action');
assertUnifiedTaskCards(h.el('taskEntryPendingList').innerHTML, weekendTasks.length);
assert(!h.el('taskEntryPendingList').innerHTML.includes('data-entry-plan-day='));
assert(!h.el('taskEntryPendingList').innerHTML.includes('data-task-action='));
h.api.selectWeekendTaskDay('s1', 'sunday');
assert.equal(h.api.tasks().find(item => item.id === 's1').plannedDay, 'saturday');
h.api.performTaskAction('delete', 'f2');
assert.equal(h.api.tasks().length, 5);
assert(h.api.owner().confirmed && h.api.owner().planSaved && h.api.owner().orderSaved);
assert.deepEqual(h.original(), ['f2', 'f1', 's2', 's1', 'u1']);
h.api.toggleTaskOrder();
assert.equal(h.el('taskOrderModal').hidden, true);

h = harness({ records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: { '2026-09-11': owner([task('sat', 'saturday')]) } }, '2026-09-11');
h.api.openTaskEntryPage();
h.el('taskEntryConfirmButton').click();
assert(h.api.owner().planSaved && h.api.owner().orderSaved);
assert.equal(h.el('startPlanModal').hidden, true, 'Friday never schedules Saturday-only work');

// Empty lists, unfinished input and missing ledger check cannot be confirmed.
h = harness({ records: { '2026-09-08': { ledgerConfirmed: true, tasks: [] } }, weekends: {} });
h.api.openTaskEntryPage();
assert.equal(h.el('taskEntryConfirmButton').hidden, false, 'empty editable list keeps the top action in place');
assert.equal(h.el('taskEntryConfirmButton').disabled, true);
h.el('taskEntryConfirmButton').click();
assert(!h.api.owner().orderSaved);
h.add('作文', 40);
h.el('taskDraft').value = '还没加进去';
h.el('taskEntryConfirmButton').click();
assert.equal(h.el('taskDraftError').hidden, false);
assert(!h.api.owner().orderSaved);
h.el('taskEntryOrderButton').click();
assert.equal(h.el('taskOrderModal').hidden, true);
h = harness({ records: { '2026-09-08': { tasks: [task('a')] } }, weekends: {} });
h.api.openTaskEntryPage();
assert.equal(h.el('taskEntryPage').hidden, true);
h.el('taskEntryConfirmButton').click();
assert(!h.api.owner().orderSaved);

// Editing an old selected membership invalidates only the selection draft, not task order.
h = harness(dailyState());
h.api.openTaskEntryPage(); h.el('taskEntryOrderButton').click(); h.pick('a');
h.api.tasks().push(task('d'));
assert.deepEqual(h.selected(), []);
assert.deepEqual(h.original(), ['a', 'b', 'c', 'd']);
// Enter estimates while adding individual homework items, with no speech input.
const emptyEntry = () => ({ records: { '2026-09-08': { ledgerConfirmed: true, tasks: [] } }, weekends: {} });
h = harness(emptyEntry());
assert.deepEqual(Array.from(h.api.estimateOptions), [5, 10, 15, 20, 30, 35, 40, 45, 50, 60]);
assert.equal(h.el('taskEntryEstimate').value, '15');
h.add('   ', 40);
assert.equal(h.api.tasks().length, 0);
assert.equal(h.el('taskDraftError').hidden, false);
assert.equal(h.el('taskDraftError').textContent, '请先输入作业内容');
assert.equal(h.el('taskEntryEstimate').value, '40', 'validation failure preserves the chosen time');
h.add('背诵第3课');
assert.equal(h.api.tasks()[0].estimatedMinutes, 40);
assert.equal(h.el('taskDraft').value, '');
assert.equal(h.el('taskDraftError').hidden, true);
assert.equal(h.el('taskEntryEstimate').value, '15', 'successful add resets to 15 minutes');
h.api.selectTaskSubject('数学');
for (const minutes of h.api.estimateOptions) {
  h.add('口算' + minutes + '题', minutes);
  const added = h.api.tasks().find(item => item.title === '口算' + minutes + '题');
  assert(added);
  assert.equal(added.subject, '数学');
  assert.equal(added.estimatedMinutes, minutes);
  assert.equal(h.el('taskEntryEstimate').value, '15');
}
h.el('taskDraft').value = '课作本第8页';
h.el('taskEntryEstimate').value = '50';
let prevented = false;
h.el('taskDraft').emit('keydown', { key: 'Enter', isComposing: true, preventDefault() { prevented = true; } });
assert(!prevented, 'IME composition is not submitted');
h.el('taskDraft').emit('keydown', { key: 'Enter', preventDefault() { prevented = true; } });
assert(prevented);
assert.equal(h.api.tasks().find(item => item.title === '课作本第8页').estimatedMinutes, 50);
assert.equal(h.el('taskEntryEstimate').value, '15');
h.add('书本练习');
assert.equal(h.api.tasks().find(item => item.title === '书本练习').estimatedMinutes, 15);
h.add('小练习', 999);
assert.equal(h.api.tasks().find(item => item.title === '小练习').estimatedMinutes, 15, 'invalid imported UI value falls back safely');
const savedEstimates = Array.from(h.api.tasks(), item => [item.subject, item.title, item.estimatedMinutes]);
h = harness(null, '2026-09-08', h.storage);
assert.deepEqual(Array.from(h.api.tasks(), item => [item.subject, item.title, item.estimatedMinutes]), savedEstimates, 'saved estimates survive reload');
h = harness({ records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: {} }, '2026-09-11');
h.add('1.作文。写一件事 2.小古文', 45);
assert.equal(h.api.tasks().length, 2, 'numbered entry still works without splitting sentences');
assert(h.api.tasks().every(item => item.estimatedMinutes === 45 && item.plannedDay === 'saturday'));
assert.equal(h.el('taskEntryEstimate').value, '15');
h = harness(null, '2026-09-12', h.storage);
assert.equal(h.api.tasks().length, 2);
h.add('不能重复录入', 60);
assert.equal(h.api.tasks().length, 2, 'Saturday continues to use Friday entries');
assert.equal(h.el('taskEntryEstimate').value, '60', 'blocked add does not reset chosen estimate');
// The single time picker still validates, saves, resumes and starts the chosen task.
const planNow = new Date(2026, 8, 8, 18, 0, 0).getTime();
const planState = dailyState();
planState.records['2026-09-08'].orderSaved = true;
h = harness(planState, '2026-09-08', undefined, planNow);
h.api.openTaskEntryPage();
h.el('taskEntryConfirmButton').click();
assert.equal(h.el('startPlanTaskLabel').textContent, '第一项作业');
assert.equal(h.el('startPlanTask').textContent, '数学 · 作业a');
assert.equal(h.el('startPlanTask').dataset.subject, '数学');
assert.equal(h.el('startPlanTime').value, '18:00', 'the first-task suggested time is now');
h.el('startPlanTime').value = '';
h.el('saveStartPlanButton').click();
assert.equal(h.signals.toasts.at(-1), '先选好准备开始的时间');
assert(!h.api.startSession());
h.el('startPlanTime').value = '17:59';
h.el('saveStartPlanButton').click();
assert.equal(h.signals.toasts.at(-1), '请选择晚于现在的时间');
assert(!h.api.startSession());
h.el('startPlanTime').value = '18:10';
h.el('saveStartPlanButton').click();
assert.equal(h.api.startSession().startAt, planNow + 10 * 60000);
assert.equal(h.api.startSession().taskId, 'a');
assert.equal(h.api.startSession().kind, 'first');
assert.equal(h.el('startPlanOptions').hidden, true);
assert.equal(h.el('startPlanCountdownPanel').hidden, false);
assert.equal(h.api.tasks()[0].status, 'pending', 'confirmation schedules without auto-starting');
h = harness(null, '2026-09-08', h.storage, planNow + 60000);
h.api.openStartPlanTimer();
assert.equal(h.el('startPlanTask').textContent, '数学 · 作业a');
assert.equal(h.api.startSession().startAt, planNow + 10 * 60000, 'schedule survives reload');
assert.equal(h.el('startPlanTask').dataset.subject, '数学', 'restored countdown retains the task color');
h.setClock(planNow + 10 * 60000);
h.api.renderStartPlanTimer();
assert.equal(h.el('startPlanCountdown').textContent, '时间到');
assert.deepEqual(h.signals.alarms, [2]);
assert.equal(h.api.tasks()[0].status, 'pending');
h.setClock(planNow + 15 * 60000);
h.api.renderStartPlanTimer();
assert.deepEqual(h.signals.alarms, [2, 1], 'five-minute follow-up reminder remains');
h.el('adjustStartPlanButton').click();
assert(!h.api.startSession());
assert.equal(h.el('startPlanOptions').hidden, false);
h.el('startPlanTime').value = '18:20';
h.el('saveStartPlanButton').click();
h.el('startPlannedTaskButton').click();
assert.equal(h.api.tasks()[0].status, 'active');
h.el('focusCompleteButton').click();
assert.equal(h.el('startPlanTaskLabel').textContent, '下一项作业');
assert.equal(h.el('startPlanTask').textContent, '数学 · 作业b');
assert.equal(h.el('startPlanTime').value, '18:15', 'completion offers the next task at the current time');
h.el('startPlanTime').value = '18:25';
h.el('saveStartPlanButton').click();
assert.equal(h.api.startSession().kind, 'next');
assert.equal(h.api.startSession().taskId, 'b');
assert.equal(h.api.startSession().startAt, planNow + 25 * 60000);
// Remaining time stays based on the day's tasks and never becomes negative.
const summaryState = dailyState();
summaryState.records['2026-09-08'].orderSaved = true;
h = harness(summaryState, '2026-09-08', undefined, planNow);
assertTaskOverview(h, 0, 3, 90);
h.api.performTaskAction('start', 'a');
assertFocusProgress(h, 0, 3, 90);
h.setClock(planNow + 5 * 60000);
h.api.updateFocusModal();
assertFocusProgress(h, 0, 3, 85);
h.api.renderTasks();
assertTaskOverview(h, 0, 3, 85);
h.setClock(planNow + 20 * 60000);
h.api.updateFocusModal();
assertFocusProgress(h, 0, 3, 75);
h.api.renderTasks();
assertTaskOverview(h, 0, 3, 75);
h.el('focusCompleteButton').click();
assertTaskOverview(h, 1, 3, 75);
h.api.performTaskAction('start', 'b');
assertFocusProgress(h, 1, 2, 75);
h.el('focusCompleteButton').click();
assertTaskOverview(h, 2, 3, 15);
h.api.performTaskAction('start', 'c');
assertFocusProgress(h, 2, 1, 15);
h.setClock(planNow + 40 * 60000);
h.api.updateFocusModal();
assertFocusProgress(h, 2, 1, 0);
h.el('focusCompleteButton').click();
assertTaskOverview(h, 3, 3, 0);
h.api.performTaskAction('undo', 'c');
assertTaskOverview(h, 2, 3, 15);
h = harness(emptyEntry());
assert.equal(h.el('taskPanelHeading').hidden, false, 'entry state retains its normal heading');
assert(!h.el('taskList').innerHTML.includes('task-overview'), 'unconfirmed tasks do not display an execution summary');
// Subject highlighting follows the task in both the first/next choice and countdown.
const coloredStartTasks = subjects.map((subject, index) => ({ ...task('color-' + index), subject,
  title: '一段需要换行的长作业内容，<b>仍然只显示文字</b>' }));
h = harness({ records: { '2026-09-08': { ...owner(coloredStartTasks), orderSaved: true } }, weekends: {} }, '2026-09-08', undefined, planNow);
for (let index = 0; index < coloredStartTasks.length; index++) {
  const item = coloredStartTasks[index];
  h.api.openStartPlanChoice(item.id, '2026-09-08', index === 0 ? 'first' : 'next');
  assert.equal(h.el('startPlanTask').dataset.subject, item.subject);
  assert.equal(h.el('startPlanTask').textContent, `${item.subject} · ${item.title}`);
  assert.equal(h.el('startPlanTask').innerHTML, '', 'task content is assigned as text, never interpreted as HTML');
  h.el('startPlanTime').value = '18:30';
  h.el('saveStartPlanButton').click();
  assert.equal(h.el('startPlanCountdownPanel').hidden, false);
  assert.equal(h.el('startPlanTask').dataset.subject, item.subject);
}
// A next-task choice defaults to now, but opening it never starts the timer itself.
const nextTaskState = () => {
  const state = dailyState();
  state.records['2026-09-08'].orderSaved = true;
  state.records['2026-09-08'].tasks[0].status = 'done';
  return state;
};
h = harness(nextTaskState(), '2026-09-08', undefined, planNow + 42000);
h.api.openStartPlanChoice('b', '2026-09-08', 'next');
assert.equal(h.el('startPlanTime').value, '18:00');
assert.equal(h.api.tasks()[1].status, 'pending');
assert(!h.api.startSession());
h.el('saveStartPlanButton').click();
assert.equal(h.api.tasks()[1].status, 'active', 'the current minute starts on confirmation');
assert.equal(h.api.tasks()[1].activeSince, planNow + 42000);
assert(!h.api.startSession(), 'starting now does not create an expired countdown');
assert.equal(h.el('focusModal').hidden, false);
assert.deepEqual(h.signals.alarms, []);

h = harness(nextTaskState(), '2026-09-08', undefined, planNow + 59000);
h.api.openStartPlanChoice('b', '2026-09-08', 'next');
h.setClock(planNow + 2 * 60000);
h.el('saveStartPlanButton').click();
assert.equal(h.api.tasks()[1].status, 'active', 'unchanged default still starts now after a minute boundary');
assert.equal(h.api.tasks()[1].activeSince, planNow + 2 * 60000);

h = harness(nextTaskState(), '2026-09-08', undefined, planNow);
h.api.openStartPlanChoice('b', '2026-09-08', 'next');
h.el('startPlanTime').value = '17:59';
h.el('saveStartPlanButton').click();
assert.equal(h.api.tasks()[1].status, 'pending');
assert.equal(h.signals.toasts.at(-1), '请选择晚于现在的时间', 'an explicitly selected earlier time remains invalid');
h.el('startPlanTime').value = '18:10';
h.el('saveStartPlanButton').click();
assert.equal(h.api.startSession().kind, 'next');
assert.equal(h.api.startSession().startAt, planNow + 10 * 60000);
assert.equal(h.api.tasks()[1].status, 'pending', 'future choices still schedule a countdown');
h.setClock(planNow + 3 * 60000);
h.el('adjustStartPlanButton').click();
assert.equal(h.el('startPlanTime').value, '18:03', 'adjusting a next-task schedule defaults to the new current time');
h.el('startPlanTime').value = '18:04';
h.setClock(planNow + 4 * 60000 + 30000);
h.el('saveStartPlanButton').click();
assert.equal(h.api.tasks()[1].status, 'active', 'a manually chosen current minute also starts immediately');
// The homepage has one full-height launch action; previews stay quiet.
const launchState = dailyState();
launchState.records['2026-09-08'].orderSaved = true;
launchState.records['2026-09-08'].tasks.push(task('d'));
launchState.records['2026-09-08'].tasks[0].title = '课作本第3页，<认真完成>，再检查一遍';
h = harness(launchState, '2026-09-08', undefined, planNow);
function assertLaunchTask(h, id) {
  const markup = h.el('taskList').innerHTML;
  const launches = [...markup.matchAll(/<button class="task-launch-button"[^>]*data-task-id="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)];
  assert.deepEqual(launches.map(match => match[1]), id ? [id] : []);
  if (id) {
    assert(launches[0][0].includes('data-task-action="start"'));
    assert(launches[0][0].includes('aria-label="开始挑战：'));
    assert(launches[0][2].includes('aria-hidden="true">▶</span><span>开始挑战</span>'));
    assert(/<\/div>\s*<\/div>\s*<button class="task-launch-button"[^>]*>[\s\S]*?<\/button>\s*<\/article>/.test(markup), 'launch stays outside the padded body, at the right card edge');
  }
}
assertLaunchTask(h, 'a');
assert(h.el('taskList').innerHTML.includes('&lt;认真完成&gt;'), 'long task content stays escaped');
h.el('taskList').emit('click', { target: { closest: selector => selector === 'button[data-list-toggle]' ? { dataset: { listToggle: 'later' } } : null } });
assertUnifiedTaskCards(h.el('taskList').innerHTML, 4);
assertLaunchTask(h, 'a');
const launchClick = () => h.el('taskList').emit('click', { target: { closest: selector => {
  if (selector === 'button[data-task-action]') return { dataset: { taskAction: 'start', taskId: 'a' } };
  if (selector === '[data-edit-task-id]') assert.fail('a nested launch icon/label click must not open the task editor');
  return null;
} } });
launchClick();
assert.equal(h.api.tasks()[0].status, 'active');
assert.equal(h.el('focusModal').hidden, false);
assertLaunchTask(h, null);
assert(h.el('taskList').innerHTML.includes('data-task-action="pause"'), 'active task keeps its rest action');
assert(h.el('taskList').innerHTML.includes('data-task-action="complete"'), 'active task keeps completion');
h.el('focusPauseButton').click();
assert.equal(h.api.tasks()[0].status, 'paused');
assertLaunchTask(h, null);
assert(/data-task-action="start"[^>]*>继续<\/button>/.test(h.el('taskList').innerHTML), 'paused work retains the separate resume action');
launchClick();
h.el('focusCompleteButton').click();
assertLaunchTask(h, 'b');
assert.equal(h.el('startPlanTask').textContent, '数学 · 作业b', 'completion still offers the next-task schedule');
h.el('taskList').emit('click', { target: { closest: selector => selector === 'button[data-list-toggle]' ? { dataset: { listToggle: 'completed' } } : null } });
assertLaunchTask(h, 'b');
assert(h.el('taskList').innerHTML.includes('data-task-action="undo"'), 'completed cards retain undo, not launch');
h = harness({ records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: {
  '2026-09-11': { ...owner([task('sat', 'saturday')]), orderSaved: true }
} }, '2026-09-11');
assertLaunchTask(h, null);
// Focus cannot be dismissed; skipping atomically pauses one timer and starts another.
const focusState = dailyState();
focusState.records['2026-09-08'].orderSaved = true;
focusState.records['2026-09-08'].tasks[0].elapsedMs = 30000;
h = harness(focusState, '2026-09-08', undefined, planNow);
h.api.performTaskAction('start', 'a');
assert.equal(h.el('mainPage').inert, true, 'background controls are not interactive during focus');
assert.equal(h.activeElement(), h.el('focusModalTitle'), 'opening focus moves keyboard focus inside');
let focusEscapePrevented = false;
h.emitWindow('keydown', { key: 'Escape', preventDefault() { focusEscapePrevented = true; } });
assert(focusEscapePrevented);
h.el('focusModal').emit('click', { target: h.el('focusModal') });
assert.equal(h.el('focusModal').hidden, false, 'Escape and backdrop leave focus open');
assert.equal(h.api.tasks()[0].status, 'active');
const focusTab = shiftKey => h.emitWindow('keydown', { key: 'Tab', shiftKey, preventDefault() {} });
focusTab(false); assert.equal(h.activeElement(), h.el('focusPauseButton'));
focusTab(false); assert.equal(h.activeElement(), h.el('focusCompleteButton'));
focusTab(false); assert.equal(h.activeElement(), h.el('focusSkipButton'));
focusTab(false); assert.equal(h.activeElement(), h.el('focusPauseButton'), 'Tab stays within focus actions');
focusTab(true); assert.equal(h.activeElement(), h.el('focusSkipButton'), 'Shift+Tab also stays inside');
h.setClock(planNow + 2 * 60000);
h.el('focusSkipButton').click();
assert.deepEqual(Array.from(h.api.tasks(), item => item.status), ['paused', 'active', 'pending']);
assert.deepEqual(h.original(), ['a', 'b', 'c'], 'skipping does not rewrite the saved plan');
assert.equal(h.api.tasks()[0].elapsedMs, 150000);
assert(!h.api.tasks()[0].activeSince && !h.api.tasks()[0].completedAt, 'the skipped timer stops without marking complete');
assert.equal(h.api.tasks()[1].activeSince, planNow + 2 * 60000);
assert.equal(h.el('focusModalTitle').textContent, '作业b');
assert.equal(h.el('focusModal').hidden, false);
assertFocusProgress(h, 0, 3, 90); // Paused work stays unfinished and keeps its original estimate.
assert.equal(h.el('startPlanModal').hidden, true, 'skip starts directly without another scheduling step');
assert.equal(h.el('breakChoiceModal').hidden, true, 'skip never opens a rest choice');
assert.equal(h.api.owner().breaks?.length || 0, 0, 'skip adds no rest record');
assert(!h.api.owner().finishTime && !h.api.owner().tasksFinishedAt, 'skip never triggers settlement');
h.el('focusSkipButton').emit('click', { detail: 2 });
assert.equal(h.el('focusModalTitle').textContent, '作业b', 'a double-click does not skip a second task');
h.api.performTaskAction('skip', 'a');
assert.equal(h.api.tasks()[1].status, 'active', 'a stale skip action cannot pause a different active task');
const focusStorage = h.storage;
h = harness(null, '2026-09-08', focusStorage, planNow + 3 * 60000);
h.api.restoreActiveFocus();
assert.equal(h.el('focusModalTitle').textContent, '作业b');
assert.equal(h.el('focusModal').hidden, false);
assert.equal(h.el('mainPage').inert, true);
assert.equal(h.api.tasks()[0].elapsedMs, 150000);
assert.equal(h.api.taskElapsedMs(h.api.tasks()[1]), 60000, 'reload keeps the active timer running');
assertFocusProgress(h, 0, 3, 89);
h.el('focusSkipButton').click();
assert.equal(h.el('focusModalTitle').textContent, '作业c', 'repeated skips follow the planned order');
h.setClock(planNow + 4 * 60000);
h.el('focusSkipButton').click();
assert.equal(h.el('focusModalTitle').textContent, '作业a', 'the last task can return to earlier paused work');
assert.equal(h.api.tasks()[0].elapsedMs, 150000, 'resuming retains the skipped task time');
h.setClock(planNow + 5 * 60000);
h.el('focusCompleteButton').click();
assert.equal(h.api.tasks()[0].elapsedMs, 210000, 'skipped time is counted once, with only resumed work added');
assert.equal(h.api.tasks()[0].status, 'done');
assert.equal(h.el('focusModal').hidden, true, 'completion may exit focus');
assert.equal(h.el('mainPage').inert, false);
assert.equal(h.el('startPlanTask').textContent, '数学 · 作业b', 'earlier skipped work remains in the plan');
h.el('saveStartPlanButton').click();
h.el('focusPauseButton').click();
assert.equal(h.api.tasks()[1].status, 'paused');
assert.equal(h.el('focusModal').hidden, true, 'rest may exit focus');
assert.equal(h.el('breakChoiceModal').hidden, false, 'rest retains its planning flow');

// No next task: keep the active task unchanged, and never pick work from a later day.
const singleFocusState = { records: { '2026-09-08': { ...owner([task('only')]), orderSaved: true } }, weekends: {} };
h = harness(singleFocusState, '2026-09-08', undefined, planNow);
h.api.performTaskAction('start', 'only');
assert.equal(h.el('focusSkipButton').disabled, true);
assert.equal(h.el('focusSkipButton').textContent, '没有其他可做项');
h.el('focusSkipButton').click();
h.api.performTaskAction('skip', 'only');
assert.equal(h.api.tasks()[0].status, 'active');
assert.equal(h.api.tasks()[0].activeSince, planNow);
assert.equal(h.el('focusModal').hidden, false);
h.el('focusCompleteButton').focus(); focusTab(false);
assert.equal(h.activeElement(), h.el('focusPauseButton'), 'Tab omits the disabled skip action');
const weekendFocusState = { records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: {
  '2026-09-11': { ...owner([task('fri-a', 'friday'), task('sun', 'sunday'),
    { ...task('fri-done', 'friday'), status: 'done' }, task('fri-b', 'friday'), task('sat', 'saturday')]), orderSaved: true }
} };
h = harness(weekendFocusState, '2026-09-11', undefined, planNow);
h.api.performTaskAction('start', 'fri-a'); h.el('focusSkipButton').click();
assert.equal(h.el('focusModalTitle').textContent, '作业fri-b', 'Friday skip ignores completed work and later-day tasks');
assertFocusProgress(h, 1, 2, 30);
assert.equal(h.api.tasks().find(item => item.id === 'sun').status, 'pending');
assert.equal(h.api.tasks().find(item => item.id === 'sat').status, 'pending');
h.api.performTaskAction('complete', 'fri-b');
h.api.performTaskAction('start', 'fri-a');
assert.equal(h.el('focusSkipButton').disabled, true, 'future assignments do not count as another available task');
h = harness({ records: {}, weekends: { '2026-09-11': {
  ...owner([task('overdue', 'friday'), task('sun', 'sunday'), task('sat', 'saturday')]), orderSaved: true
} } }, '2026-09-12', undefined, planNow);
h.api.performTaskAction('start', 'overdue'); h.el('focusSkipButton').click();
assert.equal(h.el('focusModalTitle').textContent, '作业sat', 'Saturday can skip overdue Friday work to Saturday work, not Sunday');
assertFocusProgress(h, 0, 2, 30);

// Overall focus progress includes today's carryover completions, not earlier completions or future work.
for (const [date, tasks, done, remaining] of [
  ['2026-09-12', [
    { ...task('old', 'friday'), status: 'done', completedDate: '2026-09-11' },
    { ...task('carried-done', 'friday'), status: 'done', completedDate: '2026-09-12' },
    task('carried', 'friday'),
    { ...task('today-done', 'saturday'), status: 'done', completedDate: '2026-09-12' },
    task('current', 'saturday'), task('future', 'sunday')
  ], 2, 2],
  ['2026-09-13', [
    { ...task('old-fri', 'friday'), status: 'done', completedDate: '2026-09-12' },
    { ...task('carried-fri-done', 'friday'), status: 'done', completedDate: '2026-09-13' },
    { ...task('carried-fri', 'friday'), status: 'paused', elapsedMs: 60000 },
    { ...task('old-sat', 'saturday'), status: 'done', completedDate: '2026-09-12' },
    { ...task('carried-sat-done', 'saturday'), status: 'done', completedDate: '2026-09-13' },
    task('current', 'saturday'), task('today', 'sunday')
  ], 2, 3]
]) {
  h = harness({ records: {}, weekends: { '2026-09-11': { ...owner(tasks), orderSaved: true } } }, date, undefined, planNow);
  h.api.performTaskAction('start', 'current');
  assertFocusProgress(h, done, remaining, remaining * 15);
  h.setClock(planNow + 60000);
  h.api.updateFocusModal();
  assertFocusProgress(h, done, remaining, remaining * 15 - 1);
}
// Returning to skipped work uses resume copy while preserving its timer and the plan.
const resumeCopyState = dailyState();
resumeCopyState.records['2026-09-08'].orderSaved = true;
h = harness(resumeCopyState, '2026-09-08', undefined, planNow);
h.api.performTaskAction('start', 'a');
h.setClock(planNow + 2 * 60000); h.el('focusSkipButton').click();
h.setClock(planNow + 3 * 60000); h.el('focusCompleteButton').click();
assert.equal(h.el('startPlanTitle').textContent, '继续刚才的作业');
assert.equal(h.el('startPlanTask').textContent, '数学 · 作业a');
assert.equal(h.el('startPlanTaskLabel').textContent, '之前已做 2 分钟');
assert.equal(h.el('saveStartPlanButton').textContent, '继续这项');
assert.equal(h.el('startPlanTime').value, '18:03', 'resume retains the current-time default');
assert.equal(h.api.tasks()[0].status, 'paused', 'showing the new copy does not restart work');
assert.equal(h.api.tasks()[0].elapsedMs, 120000);
h.el('saveStartPlanButton').click();
assert.equal(h.api.tasks()[0].status, 'active');
assert.equal(h.api.tasks()[0].activeSince, planNow + 3 * 60000);
assert.equal(h.api.tasks()[0].elapsedMs, 120000, 'confirmation resumes instead of clearing previous time');
h.setClock(planNow + 4 * 60000); h.el('focusCompleteButton').click();
assert.equal(h.api.tasks()[0].elapsedMs, 180000);
assert.equal(h.el('startPlanTitle').textContent, '我准备什么时候开始下一项？');
assert.equal(h.el('startPlanTaskLabel').textContent, '下一项作业');
assert.equal(h.el('saveStartPlanButton').textContent, '确定', 'new work does not inherit resume copy');

const pausedPlanState = elapsedMs => ({ records: { '2026-09-08': {
  ...owner([{ ...task('resume'), status: 'paused', elapsedMs, startedAt: '17:45' }, task('fresh')]), orderSaved: true
} }, weekends: {} });
for (const [elapsedMs, expected] of [[0, '0 分钟'], [30000, '30 秒'], [60000, '1 分钟'], [450000, '7 分钟 30 秒']]) {
  h = harness(pausedPlanState(elapsedMs), '2026-09-08', undefined, planNow);
  h.api.openStartPlanChoice('resume', '2026-09-08', 'next');
  assert.equal(h.el('startPlanTaskLabel').textContent, '之前已做 ' + expected);
}
h.api.persist(); // Save the seeded paused work before exercising a real reload.
h.el('startPlanTime').value = '18:10'; h.el('saveStartPlanButton').click();
assert.equal(h.api.startSession().startAt, planNow + 10 * 60000);
assert.equal(h.el('startPlanTitle').textContent, '继续刚才的作业');
assert.equal(h.el('startPlanTaskLabel').textContent, '之前已做 7 分钟 30 秒');
assert.equal(h.el('startPlanScheduledTime').textContent, '我计划 18:10 继续');
assert.equal(h.el('startPlannedTaskButton').textContent, '提前继续这项');
h = harness(null, '2026-09-08', h.storage, planNow + 60000);
h.api.openStartPlanTimer();
assert.equal(h.el('startPlanTaskLabel').textContent, '之前已做 7 分钟 30 秒', 'reload restores the saved work label');
assert.equal(h.el('startPlanTitle').textContent, '继续刚才的作业');
assert.equal(h.el('startPlannedTaskButton').textContent, '提前继续这项');
h.setClock(planNow + 10 * 60000); h.api.renderStartPlanTimer();
assert.equal(h.el('startPlanTitle').textContent, '我计划的继续时间到了');
assert.equal(h.el('startPlannedTaskButton').textContent, '继续这项');
assert.equal(h.el('startPlanTaskLabel').textContent, '之前已做 7 分钟 30 秒', 'countdown time is never added to prior work');
assert.deepEqual(h.signals.alarms, [2]);
h.setClock(planNow + 15 * 60000); h.api.renderStartPlanTimer();
assert.deepEqual(h.signals.alarms, [2, 1], 'resume keeps the five-minute reminder');
h.el('startPlannedTaskButton').click();
assert.equal(h.api.tasks()[0].status, 'active');
assert.equal(h.api.tasks()[0].elapsedMs, 450000);
assert.equal(h.api.tasks()[0].startedAt, '17:45', 'resuming keeps the original start record');

h = harness(pausedPlanState(120000), '2026-09-08', undefined, planNow);
h.api.openStartPlanChoice('resume', '2026-09-08', 'next');
h.el('startPlanTime').value = '18:10'; h.el('saveStartPlanButton').click();
h.setClock(planNow + 60000); h.el('adjustStartPlanButton').click();
assert.equal(h.el('startPlanTitle').textContent, '继续刚才的作业');
assert.equal(h.el('saveStartPlanButton').textContent, '继续这项');
assert.equal(h.el('startPlanTime').value, '18:01');
h.api.openStartPlanChoice('fresh', '2026-09-08', 'first');
assert.equal(h.el('startPlanTitle').textContent, '我准备什么时候开始？');
assert.equal(h.el('startPlanTaskLabel').textContent, '第一项作业');
assert.equal(h.el('saveStartPlanButton').textContent, '确定');
assert.equal(h.el('startPlanTime').value, '18:01', 'ordinary first-task scheduling also defaults to now');
h.el('startPlanTime').value = '18:10'; h.el('saveStartPlanButton').click();
assert.equal(h.el('startPlanTitle').textContent, '我按计划准备开始');
assert.equal(h.el('startPlanTaskLabel').textContent, '第一项作业');
assert.equal(h.el('startPlannedTaskButton').textContent, '我准备好了，提前开始');
// Compact rest choice keeps the same timer, validation and return logging behavior.
const restChoiceState = () => ({ records: { '2026-09-08': {
  ...owner([{ ...task('rest'), subject: '语文', title: '背诵第3课，<保留文字>' }, task('next')]), orderSaved: true
} }, weekends: {} });
function openRestChoice() {
  h = harness(restChoiceState(), '2026-09-08', undefined, planNow);
  h.api.performTaskAction('start', 'rest');
  h.setClock(planNow + 120000);
  h.el('focusPauseButton').click();
}
for (const minutes of [5, 10, 15]) {
  openRestChoice();
  assert.equal(h.el('breakChoiceModal').hidden, false);
  assert.equal(h.el('breakChoiceNextTask').textContent, '语文 · 背诵第3课，<保留文字>');
  assert.equal(h.el('breakChoiceNextTask').innerHTML, '', 'rest homework is assigned as text');
  assert.equal(h.el('breakChoiceNextTask').dataset.subject, '语文');
  assert.equal(h.el('startNextTaskNowButton').textContent, '不休息，继续这项');
  assert.equal(h.el('breakReturnTime').value, '18:32', 'custom return suggestion stays 30 minutes ahead');
  h.el('breakChoiceModal').emit('click', { target: { closest: selector => selector === 'button[data-break-minutes]'
    ? { dataset: { breakKind: 'break', breakMinutes: String(minutes) } } : null } });
  assert.equal(h.el('breakChoiceModal').hidden, true);
  assert.equal(h.el('breakTimerModal').hidden, false);
  assert.equal(h.el('startNextTaskButton').textContent, '现在开始');
  assert.equal(h.api.restSession().endAt, planNow + (minutes + 2) * 60000);
  assert.equal(h.api.restSession().taskId, 'rest');
  assert.equal(h.api.owner().breaks[0].plannedMinutes, minutes);
  assert.equal(h.api.owner().breaks[0].sourceTaskId, 'rest');
  assert.equal(h.api.owner().breaks[0].trigger, 'pause');
  h.setClock(planNow + (minutes + 2) * 60000); h.api.renderBreakTimer();
  assert.equal(h.el('startNextTaskButton').textContent, '开始下一项', 'the time-up label remains unchanged');
  assert.deepEqual(h.signals.alarms, [2]);
  h.el('startNextTaskButton').click();
  assert.equal(h.api.tasks()[0].status, 'active');
  assert.equal(h.api.tasks()[0].elapsedMs, 120000, 'rest time is not added to homework');
  assert.equal(h.api.owner().breaks[0].actualMinutes, minutes);
  assert.equal(h.api.owner().breaks[0].status, 'returned');
}
openRestChoice();
h.el('breakReturnTime').value = ''; h.el('startTimedBreakButton').click();
assert.equal(h.signals.toasts.at(-1), '先选择准备回来的时间');
h.el('breakReturnTime').value = '18:01'; h.el('startTimedBreakButton').click();
assert.equal(h.signals.toasts.at(-1), '请选择晚于现在的时间');
assert(!h.api.restSession());
assert.equal(h.api.owner().breaks?.length || 0, 0);
h.el('breakReturnTime').value = '18:12'; h.el('startTimedBreakButton').click();
assert.equal(h.api.restSession().endAt, planNow + 12 * 60000);
assert.equal(h.api.restSession().kind, 'meal', 'existing exact-time records retain their data category');
assert.equal(h.api.owner().breaks[0].plannedReturnAt, '18:12');
const restStorage = h.storage;
h = harness(null, '2026-09-08', restStorage, planNow + 4 * 60000);
h.api.openBreakTimer();
assert.equal(h.api.restSession().endAt, planNow + 12 * 60000, 'rest still restores after reload');
h.el('extendBreakButton').click();
assert.equal(h.api.restSession().endAt, planNow + 15 * 60000);
h.el('extendBreakButton').click();
assert.equal(h.api.restSession().endAt, planNow + 15 * 60000, 'rest can still only be extended once');
h.setClock(planNow + 15 * 60000); h.api.renderBreakTimer();
h.setClock(planNow + 20 * 60000); h.api.renderBreakTimer();
assert.deepEqual(h.signals.alarms, [2, 1], 'five-minute overdue reminders are unchanged');
h.el('startNextTaskButton').click();
assert.equal(h.api.owner().breaks[0].actualReturnAt, '18:20');
assert.equal(h.api.owner().breaks[0].actualMinutes, 18);
openRestChoice();
h.el('startNextTaskNowButton').click();
assert.equal(h.api.tasks()[0].status, 'active', 'quiet no-rest action still resumes immediately');
assert.equal(h.api.owner().breaks?.length || 0, 0, 'no rest means no rest log');
openRestChoice();
h.el('breakChoiceCloseButton').click();
assert.equal(h.el('breakChoiceModal').hidden, true);
assert.equal(h.api.tasks()[0].status, 'paused', 'closing only the arrangement does not mark homework done');
assert(!h.api.restSession());
// Resume offers another skip without briefly starting or charging time to paused work.
const skipAgainState = dailyState();
skipAgainState.records['2026-09-08'].orderSaved = true;
h = harness(skipAgainState, '2026-09-08', undefined, planNow);
h.api.performTaskAction('start', 'a');
h.setClock(planNow + 2 * 60000); h.el('focusSkipButton').click();
h.setClock(planNow + 3 * 60000); h.el('focusCompleteButton').click();
assert.equal(h.el('startPlanTitle').textContent, '继续刚才的作业');
assert.equal(h.el('skipPausedTaskButton').hidden, false);
assert.equal(h.el('skipPausedTaskButton').disabled, false);
h.el('startPlanTime').value = '19:00'; // Skipping is immediate, independent of this task's planned time.
h.el('skipPausedTaskButton').click();
assert.deepEqual(Array.from(h.api.tasks(), item => item.status), ['paused', 'done', 'active']);
assert.equal(h.api.tasks()[0].elapsedMs, 120000);
assert(!h.api.tasks()[0].activeSince && !h.api.tasks()[0].completedAt);
assert.equal(h.api.tasks()[2].activeSince, planNow + 3 * 60000);
assert.deepEqual(h.original(), ['a', 'b', 'c']);
assert.equal(h.el('startPlanModal').hidden, true);
assert.equal(h.el('focusModal').hidden, false);
assert.equal(h.el('focusModalTitle').textContent, '作业c');
assert(!h.api.startSession() && !h.api.restSession());
assert.equal(h.api.owner().breaks?.length || 0, 0);
h.el('skipPausedTaskButton').click();
assert.equal(h.api.tasks()[2].activeSince, planNow + 3 * 60000, 'a second click after closing does not change timers');
h.el('focusCompleteButton').click();
assert.equal(h.el('startPlanTitle').textContent, '继续刚才的作业');
assert.equal(h.el('skipPausedTaskButton').disabled, true, 'only the skipped task remains');
h.el('skipPausedTaskButton').click();
h.api.performTaskAction('skip-paused', 'a');
assert.equal(h.el('startPlanModal').hidden, false, 'failed skip leaves the resume choice open');
assert.equal(h.api.tasks()[0].status, 'paused');
assert(!h.api.owner().finishTime && !h.api.owner().tasksFinishedAt, 'paused work still prevents settlement');
h.el('saveStartPlanButton').click();
assert.equal(h.api.tasks()[0].status, 'active', 'regular resume is still available when skipping is disabled');
assert.equal(h.api.tasks()[0].elapsedMs, 120000);

for (const afterDeadline of [false, true]) {
  h = harness(pausedPlanState(450000), '2026-09-08', undefined, planNow);
  h.api.openStartPlanChoice('resume', '2026-09-08', 'next');
  h.api.persist();
  h.el('startPlanTime').value = '18:10'; h.el('saveStartPlanButton').click();
  h = harness(null, '2026-09-08', h.storage, planNow + (afterDeadline ? 11 : 1) * 60000);
  h.api.openStartPlanTimer();
  assert.equal(h.el('skipPausedTaskButton').hidden, false);
  assert.equal(h.el('skipPausedTaskButton').disabled, false);
  h.el('skipPausedTaskButton').click();
  assert.equal(h.api.tasks()[0].status, 'paused');
  assert.equal(h.api.tasks()[0].elapsedMs, 450000);
  assert.equal(h.api.tasks()[1].status, 'active');
  assert.equal(h.el('focusModal').hidden, false);
  assert(!h.api.startSession(), 'skipping cancels the original resume countdown');
  const reminderCount = h.signals.alarms.length;
  h.setClock(planNow + 30 * 60000); h.api.renderStartPlanTimer();
  assert.equal(h.signals.alarms.length, reminderCount, 'the skipped countdown no longer rings');
  h = harness(null, '2026-09-08', h.storage, planNow + 30 * 60000);
  assert(!h.api.startSession(), 'the canceled countdown stays canceled after reload');
}
h = harness(pausedPlanState(120000), '2026-09-08', undefined, planNow);
h.api.openStartPlanChoice('resume', '2026-09-08', 'next');
for (const kind of ['first', 'next']) {
  h.api.openStartPlanChoice('fresh', '2026-09-08', kind);
  assert.equal(h.el('skipPausedTaskButton').hidden, true, 'ordinary new work has no resume-only skip');
  h.el('skipPausedTaskButton').click();
  assert.equal(h.api.tasks()[1].status, 'pending');
}
h.api.performTaskAction('start', 'fresh');
const activeSinceBeforeSkip = h.api.tasks()[1].activeSince;
h.api.performTaskAction('skip-paused', 'resume');
assert.equal(h.api.tasks()[0].elapsedMs, 120000);
assert.equal(h.api.tasks()[1].activeSince, activeSinceBeforeSkip, 'another active task blocks a stale resume skip');

const fridayResumeTasks = [{ ...task('fri-resume', 'friday'), status: 'paused', elapsedMs: 60000 },
  task('sat-future', 'saturday'), { ...task('fri-done', 'friday'), status: 'done' }, task('fri-next', 'friday')];
h = harness({ records: { '2026-09-11': { ledgerConfirmed: true } }, weekends: {
  '2026-09-11': { ...owner(fridayResumeTasks), orderSaved: true }
} }, '2026-09-11', undefined, planNow);
h.api.openStartPlanChoice('fri-resume', '2026-09-11', 'next');
h.el('skipPausedTaskButton').click();
assert.equal(h.api.tasks()[1].status, 'pending', 'resume skip does not start a future-day assignment');
assert.equal(h.api.tasks()[3].status, 'active');
assert.equal(h.api.tasks()[0].elapsedMs, 60000);
// Current-time defaults and quick delays work for first, next and resumed tasks.
const startShortcutState = () => ({ records: { '2026-09-08': { ...owner([task('first'), task('second')]), orderSaved: true } }, weekends: {} });
for (const kind of ['first', 'next']) {
  h = harness(startShortcutState(), '2026-09-08', undefined, planNow + 42000);
  h.api.openStartPlanChoice('first', '2026-09-08', kind);
  assert.equal(h.el('startPlanTime').value, '18:00');
  assert.equal(h.api.tasks()[0].status, 'pending', 'opening a current-time default never auto-starts');
  assert(!h.api.startSession());
  h.setClock(planNow + 2 * 60000); h.el('saveStartPlanButton').click();
  assert.equal(h.api.tasks()[0].activeSince, planNow + 2 * 60000, 'untouched current-time default starts on confirmation even after a minute rolls over');
}
for (const [buttonId, minutes] of [['startPlanFiveMinutesButton', 5], ['startPlanTenMinutesButton', 10]]) {
  h = harness(startShortcutState(), '2026-09-08', undefined, planNow + 42000);
  h.api.openStartPlanChoice('first', '2026-09-08', 'first');
  h.api.persist();
  h.el(buttonId).click();
  assert.equal(h.el('startPlanTime').value, minutes === 5 ? '18:05' : '18:10');
  assert.equal(h.el(buttonId).getAttribute('aria-pressed'), 'true');
  assert(!h.api.startSession(), 'shortcut only fills the time; it does not save a countdown');
  assert.equal(h.api.tasks()[0].status, 'pending');
  h.setClock(planNow + 50000); h.el('saveStartPlanButton').click();
  assert.equal(h.api.startSession().startAt, planNow + 42000 + minutes * 60000, 'delay preserves the exact click-time target rather than rounding away seconds');
  h = harness(null, '2026-09-08', h.storage, planNow + 60000);
  h.api.openStartPlanTimer();
  assert.equal(h.api.startSession().startAt, planNow + 42000 + minutes * 60000, 'confirmed shortcut survives reload');
}
h = harness(startShortcutState(), '2026-09-08', undefined, planNow);
h.api.openStartPlanChoice('first', '2026-09-08', 'first');
h.el('startPlanFiveMinutesButton').click();
h.setClock(planNow + 60000); h.el('startPlanTenMinutesButton').click();
assert.equal(h.el('startPlanTime').value, '18:11', 'switching shortcuts calculates from now, not from the previous choice');
assert.equal(h.el('startPlanFiveMinutesButton').getAttribute('aria-pressed'), 'false');
assert.equal(h.el('startPlanTenMinutesButton').getAttribute('aria-pressed'), 'true');
h.el('startPlanTime').value = '18:20'; h.el('startPlanTime').emit('input'); h.el('startPlanTime').emit('change');
assert.equal(h.el('startPlanTenMinutesButton').getAttribute('aria-pressed'), 'false');
h.el('saveStartPlanButton').click();
assert.equal(h.api.startSession().startAt, planNow + 20 * 60000, 'manual time replaces the shortcut');
h.el('adjustStartPlanButton').click();
assert.equal(h.el('startPlanTime').value, '18:01');
assert(!h.el('startPlanModal').dataset.quickStartAt, 'reopening the choice resets stale shortcut state');
h.setClock(planNow + 2 * 60000);
h.el('startPlanTime').value = '18:01'; h.el('startPlanTime').emit('input'); h.el('saveStartPlanButton').click();
assert.equal(h.signals.toasts.at(-1), '请选择晚于现在的时间', 'manually choosing an old default is not mistaken for start now');
assert.equal(h.api.tasks()[0].status, 'pending');
h.el('startPlanTime').value = '18:02'; h.el('startPlanTime').emit('change'); h.el('saveStartPlanButton').click();
assert.equal(h.api.tasks()[0].status, 'active', 'explicitly choosing the current minute also starts immediately');

h = harness(pausedPlanState(120000), '2026-09-08', undefined, planNow);
h.api.openStartPlanChoice('resume', '2026-09-08', 'next');
h.el('startPlanFiveMinutesButton').click();
assert.equal(h.el('saveStartPlanButton').textContent, '继续这项');
h.setClock(planNow + 5 * 60000); h.el('saveStartPlanButton').click();
assert.equal(h.api.tasks()[0].status, 'paused');
assert(!h.api.startSession());
assert.equal(h.signals.toasts.at(-1), '请选择晚于现在的时间', 'an expired quick choice is not silently treated as the current-time default');
h.el('startPlanTenMinutesButton').click(); h.el('saveStartPlanButton').click();
assert.equal(h.api.startSession().startAt, planNow + 15 * 60000);
assert.equal(h.api.tasks()[0].elapsedMs, 120000);
assert.equal(h.el('startPlanTitle').textContent, '继续刚才的作业');

const beforeMidnight = new Date(2026, 8, 8, 23, 58, 37).getTime();
h = harness(startShortcutState(), '2026-09-08', undefined, beforeMidnight);
h.api.openStartPlanChoice('first', '2026-09-08', 'first');
h.el('startPlanFiveMinutesButton').click();
assert.equal(h.el('startPlanTime').value, '00:03');
h.el('saveStartPlanButton').click();
assert.equal(h.api.startSession().startAt, beforeMidnight + 5 * 60000, 'quick delay handles crossing midnight');
assert.equal(h.api.startSession().date, '2026-09-08', 'midnight delay retains the homework record date');
// Habits stay visible and independent from the homework list, with only sports details folding.
h = harness({ records: {}, weekends: {} }, '2026-09-08', undefined, planNow);
assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 0 / 4');
assert.equal(h.el('sportOptions').hidden, true);
assert.equal(h.el('sportCard').getAttribute('aria-expanded'), 'false');
h.el('sportCard').click();
assert.equal(h.el('sportOptions').hidden, false);
assert.equal(h.api.currentRecord(), null, 'opening sports details never creates a check-in');
assert.equal(h.api.tasks().length, 0, 'habits need no duplicate homework entry');
h.el('sportOptions').emit('click', { target: { closest: selector => selector === 'button[data-sport]' ? { dataset: { sport: '跳绳' } } : null } });
assert.equal(h.el('sportStatus').textContent, '已完成');
assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 1 / 4');
assert.equal(h.el('sportOptions').hidden, false, 'recording one sport keeps other sport choices available');
assert(h.api.currentRecord().sportAt);
h.api.toggleSport('踢毽子');
assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 1 / 4', 'multiple sports count as one habit');
h.api.toggleSport('跳绳'); h.api.toggleSport('踢毽子');
assert.equal(h.el('sportStatus').textContent, '待完成');
assert(!h.api.currentRecord()?.sportAt, 'removing the last sport clears its completion timestamp');
for (const [buttonId, field, statusId] of [
  ['readingButton', 'readingDone', 'readingStatus'],
  ['mathThinkingButton', 'mathThinkingDone', 'mathThinkingStatus'],
  ['englishReadingButton', 'englishReadingDone', 'englishReadingStatus']
]) {
  h.el(buttonId).click();
  assert.equal(h.api.currentRecord()[field], true);
  assert.equal(h.el(buttonId).getAttribute('aria-pressed'), 'true');
  assert.equal(h.el(statusId).textContent, '已完成');
  assert(h.el(buttonId).getAttribute('aria-label').includes('点击撤销打卡'));
}
h.api.toggleSport('50米');
assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 4 / 4');
const habitStorage = h.storage;
h = harness(null, '2026-09-08', habitStorage, planNow);
assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 4 / 4', 'check-ins survive a reload');
assert.equal(h.el('sportOptions').hidden, true, 'reload restores completion without expanding details');
assert(!h.el('taskList').innerHTML.includes('quest-victory'), 'habits alone cannot celebrate unknown/unconfirmed homework');
h.el('sportCard').click();
h.api.setState(null, '2026-09-09'); h.api.renderDailyCheckins();
assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 0 / 4');
assert.equal(h.el('sportOptions').hidden, true, 'switching dates resets the sports expander');
h.el('readingButton').click();
h.api.setState(null, '2026-09-08'); h.api.renderDailyCheckins();
assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 4 / 4', 'the previous day remains intact');

// Legacy sports records remain recognized without rewriting them on render.
for (const legacySport of [{ ropeDone: true, ropeAt: '17:00' }, { sportActivities: ['50米跑'], sportAt: '17:00' }]) {
  h = harness({ records: { '2026-09-08': legacySport }, weekends: {} });
  assert.equal(h.el('sportStatus').textContent, '已完成');
  assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 1 / 4');
  assert.equal(JSON.stringify(h.api.currentRecord()), JSON.stringify(legacySport));
}

const completeHomeworkState = { records: { '2026-09-08': {
  ...owner([{ ...task('only'), status: 'done', completedDate: '2026-09-08' }]),
  orderSaved: true, finishTime: '20:20', tasksFinishedAt: '20:20'
} }, weekends: {} };
h = harness(completeHomeworkState, '2026-09-08', undefined, planNow);
const originalSettlement = JSON.stringify(h.api.resultFor(h.api.currentRecord()));
assert(h.el('taskList').innerHTML.includes('作业已完成，习惯打卡还剩 4 项'));
assert(h.el('taskList').innerHTML.includes('运动打卡、中文阅读、数学思维、英文阅读'));
assert(!h.el('taskList').innerHTML.includes('quest-victory'));
h.api.toggleSport('跳绳'); h.el('mathThinkingButton').click(); h.el('englishReadingButton').click();
assert(h.el('taskList').innerHTML.includes('习惯打卡还剩 1 项'));
assert(h.el('taskList').innerHTML.includes('<small>中文阅读</small>'));
h.el('readingButton').click();
assert(h.el('taskList').innerHTML.includes('今天的任务都完成啦！'));
assert(h.el('taskList').innerHTML.includes('class="quest-victory"'));
h.el('readingButton').click();
assert(!h.el('taskList').innerHTML.includes('quest-victory'), 'undoing a habit removes the overall victory');
assert(!h.api.currentRecord().readingAt);
assert.equal(h.api.currentRecord().finishTime, '20:20');
assert.equal(JSON.stringify(h.api.resultFor(h.api.currentRecord())), originalSettlement, 'habit checks do not change homework settlement');
h.el('readingButton').click();
h.api.performTaskAction('undo', 'only');
assert(!h.el('taskList').innerHTML.includes('quest-victory'), 'undoing homework also removes the overall victory');

// Weekend habits come from each calendar date, never the shared Friday assignment record.
h = harness({ records: { '2026-09-11': {
  readingDone: true, mathThinkingDone: true, englishReadingDone: true, sportActivities: ['跳绳']
} }, weekends: { '2026-09-11': { ...owner([
  { ...task('fri', 'friday'), status: 'done', completedDate: '2026-09-11' },
  { ...task('sat', 'saturday'), status: 'done', completedDate: '2026-09-12' },
  task('sun', 'sunday')
]), orderSaved: true } } }, '2026-09-12', undefined, planNow);
assert(h.el('taskList').innerHTML.includes('作业已完成，习惯打卡还剩 4 项'));
h.api.toggleSport('跳绳');
for (const button of ['readingButton', 'mathThinkingButton', 'englishReadingButton']) h.el(button).click();
assert(h.el('taskList').innerHTML.includes('今天的任务都完成啦！'), 'Saturday can finish without doing Sunday assignments');
h.api.setState(null, '2026-09-13'); h.api.renderTasks(); h.api.renderDailyCheckins();
assert.equal(h.el('dailyCheckinsSummary').textContent, '已完成 0 / 4');
assert(!h.el('taskList').innerHTML.includes('quest-victory'));

// Holiday completion is per date and never rewrites a pre-existing settlement.
const holidayExecution = {records:{'2026-09-08':{
  tasks:[{...task('holiday'),holidayId:'h',status:'done',completedDate:'2026-09-08'}],
  holidayDaily:true,tasksConfirmed:true,orderSaved:true,finishTime:'20:20',ruleId:'legacy'
}},weekends:{}};
h=harness(holidayExecution,'2026-09-08',undefined,planNow);
h.api.performTaskAction('undo','holiday');
assert.equal(h.api.currentRecord().finishTime,'20:20');
assert.equal(h.api.currentRecord().ruleId,'legacy');
h.api.performTaskAction('start','holiday');h.api.performTaskAction('complete','holiday');
assert.equal(h.api.currentRecord().finishTime,'20:20');
assert.equal(h.el('taskConfirmHint').hidden,true,'holiday completion does not show a monetary settlement hint');
assert(h.api.currentRecord().tasksFinishedAt,'holiday completion records its actual finish time');
delete holidayExecution.records['2026-09-08'].finishTime;delete holidayExecution.records['2026-09-08'].ruleId;
h=harness(holidayExecution,'2026-09-08',undefined,planNow);h.api.performTaskAction('undo','holiday');h.api.performTaskAction('start','holiday');h.api.performTaskAction('complete','holiday');
assert.equal(h.api.currentRecord().finishTime,undefined,'new holiday tasks do not automatically apply weekday rewards');

console.log('PASS: bindings, accessible labels, daily habits and completion states, task cards, focus/skip/resume, rest/logs, current-time defaults and 5/10-minute shortcuts, scheduling/reminders, weekend boundaries, holiday execution and legacy records.');
