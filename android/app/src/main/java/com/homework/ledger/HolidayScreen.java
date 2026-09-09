package com.homework.ledger;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/** Native settings and full-page holiday planner. Uses the existing task timer via daily records. */
final class HolidayScreen {
    interface Host {
        JSONObject state(); String date(); String today(); int subjectColor(String subject); int subjectSoftColor(String subject); JSONArray keywords(String subject);
        void changed(); void show(View page); void back(boolean settings); void goDate(String date); void confirmed();
    }
    private static final int BLUE = Color.rgb(75,130,239), INK = Color.rgb(36,50,74), MUTED = Color.rgb(104,119,146);
    private static final int[] MINUTES = {5,10,15,20,25,30,35,40,45,50,60};
    private final Activity activity; private final Host host;
    private LinearLayout home, taskList, composer, shortDays; private Button sortButton, resetButton, dayButton; private TextView summary;
    private EditText taskInput; private Spinner repeat;
    private Button subject, estimate; private String selectedSubject = "语文"; private int entryMinutes = 15;
    private LinearLayout keywordRow; private HorizontalScrollView keywordScroll;
    private String planId, viewDate; private boolean fromSettings, settingsOpen, overdueExpanded;
    private List<String> orderIds, repeatDates;
    HolidayScreen(Activity activity, Host host) { this.activity = activity; this.host = host; }
    private int dp(int n) { return Math.round(n * activity.getResources().getDisplayMetrics().density); }
    private LinearLayout col() { LinearLayout l = new LinearLayout(activity); l.setOrientation(LinearLayout.VERTICAL); return l; }
    private LinearLayout row() { LinearLayout l = new LinearLayout(activity); l.setGravity(Gravity.CENTER_VERTICAL); return l; }
    private LinearLayout.LayoutParams wrap() { return new LinearLayout.LayoutParams(-1, -2); }
    private LinearLayout.LayoutParams weight() { return new LinearLayout.LayoutParams(0, -2, 1); }
    private TextView text(String value, int size, int color) { TextView t = new TextView(activity); t.setText(value); t.setTextSize(size); t.setTextColor(color); return t; }
    private GradientDrawable bg(int color) { GradientDrawable d = new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(12)); d.setStroke(dp(1), Color.rgb(220,231,245)); return d; }
    private Button button(String label, Runnable action) { Button b = new Button(activity); b.setText(label); b.setTextSize(12); b.setAllCaps(false); b.setTextColor(BLUE); b.setMinHeight(0); b.setMinimumHeight(0); b.setPadding(dp(10), dp(6), dp(10), dp(6)); b.setBackground(bg(Color.WHITE)); b.setOnClickListener(v -> attempt(action)); return b; }
    private EditText input(String hint, int max) { EditText e = new EditText(activity); e.setTextSize(14); e.setTextColor(INK); e.setHint(hint); e.setSingleLine(true); e.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(max)}); e.setPadding(dp(10), dp(10), dp(10), dp(10)); e.setBackground(bg(Color.WHITE)); e.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_DONE | android.view.inputmethod.EditorInfo.IME_FLAG_NO_EXTRACT_UI); return e; }
    private void toast(String value) { Toast.makeText(activity, value, Toast.LENGTH_SHORT).show(); }
    private void attempt(Runnable action) { try { action.run(); } catch (IllegalArgumentException e) { toast(e.getMessage()); } }
    private void persist() { host.changed(); }
    private Spinner spinner(String[] options) { Spinner s = new Spinner(activity); ArrayAdapter<String> a = new ArrayAdapter<>(activity, android.R.layout.simple_spinner_item, options); a.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item); s.setAdapter(a); return s; }
    private Spinner minutes(int value) { String[] labels = new String[MINUTES.length]; int position = 2; for (int i=0;i<MINUTES.length;i++) { labels[i]=MINUTES[i]+" 分钟"; if(MINUTES[i]==value)position=i; } Spinner s=spinner(labels);s.setSelection(position);return s; }
    private void space(LinearLayout l) { View gap = new View(activity); l.addView(gap, new LinearLayout.LayoutParams(1, dp(8))); }
    private interface DateAction { void accept(String date); }
    private void pickDate(String value, String min, String max, DateAction action) {
        String[] parts = value.split("-"); DatePickerDialog d = new DatePickerDialog(activity, (picker,y,m,day) -> attempt(() -> action.accept(String.format(java.util.Locale.US,"%04d-%02d-%02d",y,m+1,day))), Integer.parseInt(parts[0]), Integer.parseInt(parts[1])-1,Integer.parseInt(parts[2]));
        java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US);
        try { if(min!=null)d.getDatePicker().setMinDate(f.parse(min).getTime());if(max!=null)d.getDatePicker().setMaxDate(f.parse(max).getTime()); } catch(Exception ignored) { }
        d.show();
    }
    private void hideKeyboard() { InputMethodManager k=(InputMethodManager)activity.getSystemService(Activity.INPUT_METHOD_SERVICE); View focus=activity.getCurrentFocus();if(k!=null&&focus!=null)k.hideSoftInputFromWindow(focus.getWindowToken(),0); }
    View home() { home = col(); return home; }
    void renderHome() {
        if(home==null)return;home.removeAllViews(); JSONObject h=HolidayPlans.find(host.state(),host.date());
        if(h!=null){ Button entry=button(h.optString("name")+" · "+(host.date().equals(h.optString("planDate"))?"安排假期作业":"查看与调整计划")+"  ›",()->openPlan(h.optString("id"),false)); home.addView(entry,wrap());space(home); }
        List<HolidayPlans.Ref> overdue=new ArrayList<>();for(HolidayPlans.Ref r:HolidayPlans.refs(host.state(),null))if(r.date.compareTo(host.date())<0&&!"done".equals(r.task.optString("status")))overdue.add(r);
        if(!overdue.isEmpty()){ home.addView(button("之前未完成 · "+overdue.size()+" 项",()->{overdueExpanded=!overdueExpanded;renderHome();}),wrap());if(overdueExpanded)for(HolidayPlans.Ref r:overdue)home.addView(taskRow(r,true),wrap()); }
    }
    private LinearLayout header(String title,Runnable back,Runnable confirm) {
        LinearLayout h=row();h.addView(button("返回",back));TextView t=text(title,20,INK);t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);t.setSingleLine(true);t.setEllipsize(android.text.TextUtils.TruncateAt.END);h.addView(t,weight());if(confirm!=null)h.addView(button("确定",confirm));return h;
    }
    void openSettings() { openSettings(null); }
    private void openSettings(JSONObject editing) {
        hideKeyboard();settingsOpen=true;planId=null;orderIds=null;
        ScrollView scroll=new ScrollView(activity);LinearLayout content=col();content.setPadding(dp(16),dp(16),dp(16),dp(24));scroll.addView(content,wrap());
        content.addView(header("假期设置",()->back(),null));space(content);
        for(JSONObject h:HolidayPlans.configs(host.state())){
            LinearLayout item=col();item.setPadding(dp(12),dp(12),dp(12),dp(12));item.setBackground(bg(Color.WHITE));item.addView(text(h.optString("name"),18,INK));item.addView(text(h.optString("start")+" — "+h.optString("end")+"\n"+h.optString("planDate")+" 安排",12,MUTED));
            LinearLayout actions=row();actions.addView(button("安排作业",()->openPlan(h.optString("id"),true)),weight());actions.addView(button("修改",()->openSettings(h)),weight());
            if(HolidayPlans.refs(host.state(),h.optString("id")).isEmpty())actions.addView(button("删除",()->new AlertDialog.Builder(activity).setMessage("删除这个尚未录入作业的假期吗？").setNegativeButton("取消",null).setPositiveButton("删除",(d,w)->attempt(()->{HolidayPlans.removeHoliday(host.state(),h.optString("id"));persist();openSettings();})).show()),weight());
            item.addView(actions);content.addView(item,wrap());space(content);
        }
        content.addView(text(editing==null?"添加假期":"修改假期",18,INK));space(content);
        EditText name=input("例如：寒假",30);name.setText(editing==null?"":editing.optString("name"));content.addView(name,wrap());
        String[] dates={editing==null?HolidayPlans.plus(host.today(),1):editing.optString("start"),editing==null?HolidayPlans.plus(host.today(),7):editing.optString("end"),editing==null?host.today():editing.optString("planDate")};
        String[] labels={"开始日期", "结束日期", "安排日期"};Button[] dateButtons=new Button[3];
        for(int i=0;i<3;i++){final int index=i;dateButtons[i]=button(labels[i]+"  "+dates[i],()->pickDate(dates[index],null,null,date->{dates[index]=date;dateButtons[index].setText(labels[index]+"  "+date);if(index==0){dates[2]=HolidayPlans.plus(date,-1);dateButtons[2].setText(labels[2]+"  "+dates[2]);}}));space(content);content.addView(dateButtons[i],wrap());}
        space(content);content.addView(text("安排日期默认为前一天；已有作业后保留假期日期，具体任务仍可改期。",12,MUTED));space(content);
        content.addView(button("保存",()->{JSONObject h=new JSONObject();HolidayPlans.put(h,"id",editing==null?"holiday-"+UUID.randomUUID():editing.optString("id"));HolidayPlans.put(h,"name",name.getText().toString());HolidayPlans.put(h,"start",dates[0]);HolidayPlans.put(h,"end",dates[1]);HolidayPlans.put(h,"planDate",dates[2]);HolidayPlans.put(h,"confirmed",editing!=null&&editing.optBoolean("confirmed"));HolidayPlans.save(host.state(),h);persist();openSettings();toast("假期已保存");}),wrap());
        if(editing!=null)content.addView(button("取消修改",()->openSettings()),wrap());host.show(scroll);
    }
    private JSONObject holiday() { return HolidayPlans.object(host.state(),"holidays").optJSONObject(planId); }
    private boolean ready() { JSONObject h=holiday();JSONObject r=h==null?null:HolidayPlans.object(host.state(),"records").optJSONObject(h.optString("planDate"));return r!=null&&r.optBoolean("ledgerConfirmed"); }
    void openPlan(String id,boolean origin) {
        JSONObject h=HolidayPlans.object(host.state(),"holidays").optJSONObject(id);if(h==null)return;
        hideKeyboard();planId=id;fromSettings=origin;settingsOpen=false;orderIds=null;
        viewDate=host.date().compareTo(h.optString("planDate"))>=0&&host.date().compareTo(h.optString("end"))<=0?host.date():h.optString("planDate");repeatDates=new ArrayList<>(HolidayPlans.days(h.optString("start"),h.optString("end")));
        LinearLayout page=col();page.setPadding(dp(12),dp(12),dp(12),dp(12));page.setBackgroundColor(Color.WHITE);
        page.addView(header(h.optString("name"),()->back(),()->{if(!ready())throw new IllegalArgumentException("请先核对假期作业");if(!taskInput.getText().toString().trim().isEmpty())throw new IllegalArgumentException("还有未添加的作业，请先点加号");if(orderIds!=null)HolidayPlans.order(host.state(),viewDate,orderIds);boolean firstConfirmation=!holiday().optBoolean("confirmed")&&!fromSettings;HolidayPlans.confirm(host.state(),holiday());persist();back();toast("假期计划已保存，每天按当天清单完成");if(firstConfirmation)host.confirmed();}));space(page);
        LinearLayout toolbar=row();dayButton=button(viewDate,()->pickDate(viewDate,h.optString("planDate"),h.optString("end"),date->{viewDate=date;orderIds=null;renderPlan();}));toolbar.addView(dayButton,weight());
        sortButton=button("调整当天顺序",()->{if(orderIds==null)orderIds=new ArrayList<>();else{HolidayPlans.order(host.state(),viewDate,orderIds);orderIds=null;persist();}renderPlan();});toolbar.addView(sortButton,weight());resetButton=button("清空重选",()->{orderIds=new ArrayList<>();renderPlan();});toolbar.addView(resetButton);page.addView(toolbar);
        summary=text("",13,MUTED);page.addView(summary);shortDays=row();HorizontalScrollView daysScroll=new HorizontalScrollView(activity);daysScroll.addView(shortDays);page.addView(daysScroll,wrap());
        if(!ready()){page.addView(text("先在 "+h.optString("planDate")+" 核对钉钉，补全成长记录册。",13,MUTED));page.addView(button("去核对",()->{host.back(false);host.goDate(h.optString("planDate"));}));}
        ScrollView listScroll=new ScrollView(activity);taskList=col();listScroll.addView(taskList,wrap());page.addView(listScroll,new LinearLayout.LayoutParams(-1,0,1));
        composer=col();LinearLayout options=row();repeat=spinner(new String[]{"只做一次","每天都做"});options.addView(repeat,weight());Button dateOptions=button("选择重复日期",()->{List<String> dates=HolidayPlans.days(h.optString("start"),h.optString("end"));boolean[] selected=new boolean[dates.size()];for(int i=0;i<dates.size();i++)selected[i]=repeatDates.contains(dates.get(i));new AlertDialog.Builder(activity).setTitle("选择重复日期").setMultiChoiceItems(dates.toArray(new String[0]),selected,(d,i,checked)->selected[i]=checked).setNegativeButton("取消",null).setPositiveButton("确定",(d,w)->{repeatDates=new ArrayList<>();for(int i=0;i<dates.size();i++)if(selected[i])repeatDates.add(dates.get(i));}).show();});dateOptions.setVisibility(View.GONE);options.addView(dateOptions,weight());repeat.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){public void onNothingSelected(android.widget.AdapterView<?> p){}public void onItemSelected(android.widget.AdapterView<?> p,View v,int position,long itemId){dateOptions.setVisibility(position==1?View.VISIBLE:View.GONE);}});composer.addView(options);
        keywordRow=row();keywordScroll=new HorizontalScrollView(activity);keywordScroll.setHorizontalScrollBarEnabled(false);keywordScroll.addView(keywordRow);
        LinearLayout.LayoutParams keywordParams=new LinearLayout.LayoutParams(-1,dp(36));keywordParams.bottomMargin=dp(7);composer.addView(keywordScroll,keywordParams);
        LinearLayout entry=row();entry.setGravity(Gravity.BOTTOM);
        subject=button(selectedSubject+"  ▾",()->TaskSubjectPicker.show(activity,selectedSubject,name->{selectedSubject=name;renderSubject();renderKeywords();taskInput.requestFocus();taskInput.setSelection(taskInput.length());}));
        subject.setTypeface(Typeface.DEFAULT,Typeface.BOLD);subject.setPadding(dp(6),0,dp(6),0);entry.addView(subject,new LinearLayout.LayoutParams(dp(76),dp(48)));renderSubject();
        View subjectGap=new View(activity);entry.addView(subjectGap,new LinearLayout.LayoutParams(dp(6),1));
        taskInput=input("请输入一项作业…",120);taskInput.setSingleLine(false);taskInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);taskInput.setHorizontallyScrolling(false);taskInput.setMinLines(1);taskInput.setMaxLines(2);taskInput.setMinHeight(dp(48));taskInput.setMaxHeight(dp(78));taskInput.setPadding(dp(11),dp(9),dp(11),dp(9));taskInput.setGravity(Gravity.TOP|Gravity.START);entry.addView(taskInput,weight());composer.addView(entry,wrap());
        entryMinutes=15;estimate=button("15 分钟",()->{int[] values={5,10,15,20,30,35,40,45,50,60};String[] labels=new String[values.length];for(int i=0;i<values.length;i++)labels[i]=values[i]+" 分钟";new AlertDialog.Builder(activity).setTitle("预计用时").setItems(labels,(d,i)->{entryMinutes=values[i];estimate.setText(labels[i]);}).setNegativeButton("取消",null).show();});estimate.setTextSize(11);estimate.setPadding(dp(5),0,dp(5),0);estimate.setSingleLine(true);estimate.setMinWidth(0);estimate.setMinimumWidth(0);
        Button add=button("＋",()->addTask(listScroll));add.setContentDescription("添加假期作业");add.setTextSize(20);add.setTypeface(Typeface.DEFAULT,Typeface.BOLD);add.setPadding(0,0,0,0);add.setTextColor(Color.WHITE);add.setBackground(bg(BLUE));
        boolean compact=activity.getResources().getConfiguration().screenWidthDp<=420;LinearLayout actions=compact?row():entry;actions.setGravity(Gravity.BOTTOM|Gravity.END);
        if(!compact){View gap=new View(activity);actions.addView(gap,new LinearLayout.LayoutParams(dp(6),1));}actions.addView(estimate,new LinearLayout.LayoutParams(dp(80),dp(48)));View gap=new View(activity);actions.addView(gap,new LinearLayout.LayoutParams(dp(6),1));actions.addView(add,new LinearLayout.LayoutParams(dp(compact?80:112),dp(48)));
        if(compact){LinearLayout.LayoutParams params=wrap();params.topMargin=dp(8);composer.addView(actions,params);}
        taskInput.setOnEditorActionListener((v,action,event)->{boolean enter=event!=null&&event.getKeyCode()==android.view.KeyEvent.KEYCODE_ENTER&&event.getAction()==android.view.KeyEvent.ACTION_DOWN&&!event.isShiftPressed();if(action!=android.view.inputmethod.EditorInfo.IME_ACTION_DONE&&!enter)return false;attempt(()->addTask(listScroll));return true;});page.addView(composer,wrap());renderKeywords();host.show(page);renderPlan();
    }
    private void addTask(ScrollView scroll) {
        if(!ready())throw new IllegalArgumentException("请先核对假期作业");boolean daily=repeat.getSelectedItemPosition()==1;
        HolidayPlans.add(host.state(),holiday(),selectedSubject,taskInput.getText().toString(),entryMinutes,daily,daily?repeatDates:Arrays.asList(viewDate));taskInput.setText("");entryMinutes=15;estimate.setText("15 分钟");persist();renderPlan();scroll.post(()->{scroll.fullScroll(View.FOCUS_DOWN);taskInput.requestFocus();});toast("作业已安排");
    }
    private void renderSubject() { subject.setText(selectedSubject+"  ▾");subject.setTextColor(Color.WHITE);subject.setBackground(bg(host.subjectColor(selectedSubject)));subject.setContentDescription("选择作业科目，当前"+selectedSubject); }
    private void renderKeywords() {
        String name=selectedSubject;JSONArray list=host.keywords(name);keywordRow.removeAllViews();
        for(int i=0;i<list.length();i++){
            JSONObject item=list.optJSONObject(i);if(item==null||!item.optBoolean("visible",true))continue;String label=item.optString("label").trim();if(label.isEmpty())continue;
            Button chip=button(label,()->{String current=taskInput.getText().toString().trim();taskInput.setText((current.isEmpty()?"":current+" ")+label);taskInput.requestFocus();taskInput.setSelection(taskInput.length());});
            chip.setTextColor(host.subjectColor(name));chip.setBackground(bg(host.subjectSoftColor(name)));chip.setMinWidth(0);chip.setMinimumWidth(0);
            chip.setTextSize(11);chip.setTypeface(Typeface.DEFAULT,Typeface.BOLD);chip.setPadding(dp(10),0,dp(10),0);LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-2,dp(32));params.rightMargin=dp(6);keywordRow.addView(chip,params);
        }
        keywordScroll.setVisibility(keywordRow.getChildCount()==0?View.GONE:View.VISIBLE);
    }
    private void renderPlan() {
        JSONObject h=holiday();if(h==null||taskList==null)return;JSONArray list=HolidayPlans.tasks(host.state(),viewDate);int total=0,pending=0;taskList.removeAllViews();
        for(int i=0;i<list.length();i++){JSONObject t=list.optJSONObject(i);if(t==null)continue;total+=t.optInt("estimatedMinutes",15);if(HolidayPlans.pending(t))pending++;taskList.addView(taskRow(new HolidayPlans.Ref(viewDate,t),false),wrap());}
        if(list.length()==0)taskList.addView(text("这一天还没有安排作业",14,MUTED));summary.setText(list.length()+" 项 · 预计 "+total+" 分钟");dayButton.setText(viewDate);sortButton.setText(orderIds==null?"调整当天顺序":"确定顺序 "+orderIds.size()+"/"+pending);sortButton.setEnabled(pending>0);resetButton.setVisibility(orderIds==null?View.GONE:View.VISIBLE);composer.setVisibility(orderIds==null&&ready()?View.VISIBLE:View.GONE);
        shortDays.removeAllViews();List<String> dates=HolidayPlans.days(h.optString("planDate"),h.optString("end"));if(dates.size()<=8)for(String date:dates){Button day=button(date.substring(5),()->{viewDate=date;orderIds=null;renderPlan();});if(date.equals(viewDate))day.setBackground(bg(Color.rgb(225,237,255)));shortDays.addView(day);}
    }
    private View taskRow(HolidayPlans.Ref ref,boolean overdue) {
        JSONObject t=ref.task;String subjectName=t.optString("subject");LinearLayout shell=row();shell.setBackground(bg(host.subjectSoftColor(subjectName)));shell.setClipToOutline(true);
        TextView badge=text(subjectName.length()==2?subjectName.substring(0,1)+"\n"+subjectName.substring(1):subjectName,12,Color.WHITE);badge.setGravity(Gravity.CENTER);badge.setBackgroundColor(host.subjectColor(subjectName));shell.addView(badge,new LinearLayout.LayoutParams(dp(30),-1));
        LinearLayout outer=col();outer.setPadding(dp(10),dp(10),dp(10),dp(10));shell.addView(outer,weight());LinearLayout title=row();TextView copy=text(t.optString("title"),15,INK);copy.setTypeface(Typeface.DEFAULT,Typeface.BOLD);title.addView(copy,weight());title.addView(text("预计 "+t.optInt("estimatedMinutes",15)+" 分钟",11,MUTED));outer.addView(title);
        List<String> details=new ArrayList<>();if(overdue)details.add(ref.date);if(!t.optString("holidaySeriesId").isEmpty())details.add("每天");String status=t.optString("status","pending");if(!"pending".equals(status))details.add("done".equals(status)?"已完成":"active".equals(status)?"进行中":"已暂停");if(!details.isEmpty())outer.addView(text(android.text.TextUtils.join(" · ",details),11,MUTED));
        LinearLayout actions=row();if(orderIds!=null&&!overdue){if(HolidayPlans.pending(t)){int index=orderIds.indexOf(t.optString("id"));Button pick=button(index>=0?"第 "+(index+1)+" 项":"选这项",()->{orderIds.add(t.optString("id"));renderPlan();});pick.setEnabled(index<0);actions.addView(pick,weight());}}
        else{
            if(HolidayPlans.pending(t)&&!overdue){actions.addView(button("修改",()->edit(ref)),weight());actions.addView(button("删除当天",()->new AlertDialog.Builder(activity).setMessage("只删除当天这一项作业，确定吗？").setNegativeButton("取消",null).setPositiveButton("删除",(d,w)->attempt(()->{HolidayPlans.removeTask(host.state(),ref);persist();renderPlan();})).show()),weight());}
            if(!"done".equals(status)&&!"active".equals(status))actions.addView(button(overdue?"安排补做":"改期",()->pickDate(overdue?host.date():ref.date,host.date(),null,date->{HolidayPlans.move(host.state(),ref,date);persist();renderPlan();toast("计划已更新");})),weight());
        }
        outer.addView(actions);LinearLayout wrapper=col();wrapper.addView(shell,wrap());space(wrapper);return wrapper;
    }
    private void edit(HolidayPlans.Ref ref) {
        LinearLayout content=col();content.setPadding(dp(18),dp(12),dp(18),dp(12));EditText name=input("作业内容",120);name.setText(ref.task.optString("title"));content.addView(name,wrap());Spinner mins=minutes(ref.task.optInt("estimatedMinutes",15));content.addView(mins,wrap());CheckBox series=new CheckBox(activity);series.setText("同时修改之后未开始的同类作业");boolean repeated=!ref.task.optString("holidaySeriesId").isEmpty();series.setChecked(repeated);series.setVisibility(repeated?View.VISIBLE:View.GONE);content.addView(series);
        AlertDialog dialog=new AlertDialog.Builder(activity).setTitle("修改作业").setView(content).setNegativeButton("取消",null).setPositiveButton("保存",null).create();dialog.show();dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->attempt(()->{HolidayPlans.edit(host.state(),ref,name.getText().toString(),MINUTES[mins.getSelectedItemPosition()],repeated&&series.isChecked(),host.today());persist();renderPlan();dialog.dismiss();}));
    }
    void back() { hideKeyboard();if(settingsOpen){settingsOpen=false;host.back(true);}else if(fromSettings)openSettings();else{planId=null;host.back(false);} }
}
