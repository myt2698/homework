package com.homework.ledger;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Shared-format holiday configuration and dated task instances; no automatic regeneration. */
final class HolidayPlans {
    static final class Ref {
        final String date;
        final JSONObject task;
        Ref(String date, JSONObject task) { this.date = date; this.task = task; }
    }
    static void put(JSONObject o, String key, Object value) {
        try { o.put(key, value); } catch (JSONException e) { throw new IllegalArgumentException(e); }
    }
    static JSONObject object(JSONObject o, String key) {
        JSONObject value = o.optJSONObject(key);
        if (value == null) { value = new JSONObject(); put(o, key, value); }
        return value;
    }
    static boolean iso(String value) {
        if (value == null || !value.matches("\\d{4}-\\d{2}-\\d{2}")) return false;
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US); f.setLenient(false);
        try { return value.equals(f.format(f.parse(value))); } catch (Exception e) { return false; }
    }
    static String plus(String date, int days) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar c = Calendar.getInstance();
        try { c.setTime(f.parse(date)); } catch (Exception e) { throw new IllegalArgumentException("日期无效"); }
        c.add(Calendar.DAY_OF_MONTH, days); return f.format(c.getTime());
    }
    static List<String> days(String start, String end) {
        List<String> result = new ArrayList<>();
        for (String d = start; d.compareTo(end) <= 0 && result.size() <= 366; d = plus(d, 1)) result.add(d);
        return result;
    }
    static List<JSONObject> configs(JSONObject state) {
        List<JSONObject> result = new ArrayList<>(); JSONObject holidays = object(state, "holidays");
        Iterator<String> it = holidays.keys();
        while (it.hasNext()) { JSONObject h = holidays.optJSONObject(it.next()); if (h != null && iso(h.optString("start")) && iso(h.optString("end")) && iso(h.optString("planDate"))) result.add(h); }
        Collections.sort(result, (a, b) -> a.optString("start").compareTo(b.optString("start"))); return result;
    }
    static JSONObject find(JSONObject state, String date) {
        for (JSONObject h : configs(state)) if (h.optString("planDate").compareTo(date) <= 0 && date.compareTo(h.optString("end")) <= 0) return h;
        return null;
    }
    static JSONObject record(JSONObject state, String date) { return object(object(state, "records"), date); }
    static JSONArray tasks(JSONObject state, String date) {
        JSONObject r = object(state, "records").optJSONObject(date);
        return r != null && r.optJSONArray("tasks") != null ? r.optJSONArray("tasks") : new JSONArray();
    }
    static List<Ref> refs(JSONObject state, String id) {
        List<Ref> result = new ArrayList<>(); JSONObject records = object(state, "records"); Iterator<String> it = records.keys();
        while (it.hasNext()) { String date = it.next(); if (!iso(date)) continue; JSONArray tasks = tasks(state, date);
            for (int i = 0; i < tasks.length(); i++) { JSONObject t = tasks.optJSONObject(i); if (t != null && !t.optString("holidayId").isEmpty() && (id == null || id.equals(t.optString("holidayId")))) result.add(new Ref(date, t)); }
        }
        Collections.sort(result, (a, b) -> a.date.compareTo(b.date)); return result;
    }
    static boolean pending(JSONObject task) { return task != null && "pending".equals(task.optString("status", "pending")) && task.optString("startedAt").isEmpty() && task.optLong("elapsedMs") == 0; }
    static void mark(JSONObject state, String date) {
        JSONObject r = record(state, date); put(r, "holidayDaily", true); r.remove("orderDraft"); boolean untouched = true;
        JSONArray tasks = tasks(state, date); for (int i = 0; i < tasks.length(); i++) if (!pending(tasks.optJSONObject(i))) untouched = false;
        if (untouched) { put(r, "tasksConfirmed", false); put(r, "orderSaved", false); } r.remove("tasksFinishedAt");
    }
    static void save(JSONObject state, JSONObject h) {
        String start = h.optString("start"), end = h.optString("end"), plan = h.optString("planDate"), id = h.optString("id");
        if (h.optString("name").trim().isEmpty()) throw new IllegalArgumentException("请填写假期名称");
        if (!iso(start) || !iso(end) || !iso(plan) || start.compareTo(end) > 0 || plan.compareTo(start) > 0) throw new IllegalArgumentException("请检查日期：安排日期不能晚于假期开始日期");
        if (days(plan, end).size() > 366) throw new IllegalArgumentException("一次假期计划最多设置 366 天");
        for (JSONObject other : configs(state)) if (!id.equals(other.optString("id")) && other.optString("planDate").compareTo(end) <= 0 && plan.compareTo(other.optString("end")) <= 0) throw new IllegalArgumentException("日期与另一个假期计划重叠，请调整日期");
        JSONObject old = object(state, "holidays").optJSONObject(id);
        if (old != null && !refs(state, id).isEmpty()) for (String key : new String[]{"start", "end", "planDate"}) if (!old.optString(key).equals(h.optString(key))) throw new IllegalArgumentException("已有作业的假期保留原日期；可以修改名称或调整具体作业日期");
        JSONObject weekends = object(state, "weekends"); Iterator<String> it = weekends.keys();
        while (it.hasNext()) { String date = it.next(); JSONObject w = weekends.optJSONObject(date); if (w != null && date.compareTo(end) <= 0 && plus(date, 2).compareTo(plan) >= 0 && meaningfulWeekend(w)) throw new IllegalArgumentException("这些日期已有周末计划，请先处理原计划，避免覆盖已有记录"); }
        if (old != null && (!old.optString("start").equals(start) || !old.optString("end").equals(end) || !old.optString("planDate").equals(plan))) clearEmptyHolidayMarkers(state, old);
        put(h, "name", h.optString("name").trim()); put(object(state, "holidays"), id, h);
    }
    static boolean meaningfulWeekend(JSONObject w) { return w.optJSONArray("tasks") != null && w.optJSONArray("tasks").length() > 0 || w.optBoolean("confirmed") || w.optBoolean("planSaved") || w.optBoolean("dailySeparated") || w.optBoolean("specialSeparated") || w.optBoolean("fridayDone") || w.optBoolean("saturdayMorningDone") || !w.optString("allDoneDate").isEmpty() || w.optBoolean("penaltyConfirmed"); }
    static void clearEmptyHolidayMarkers(JSONObject state, JSONObject h) {
        if (h == null) return;
        for (String date : days(h.optString("planDate"), h.optString("end"))) {
            JSONObject r = object(state, "records").optJSONObject(date);
            if (r == null || !r.optBoolean("holidayDaily")) continue;
            JSONArray list = tasks(state, date); boolean hasHolidayTask = false;
            for (int i = 0; i < list.length(); i++) { JSONObject t = list.optJSONObject(i); if (t != null && !t.optString("holidayId").isEmpty()) hasHolidayTask = true; }
            if (hasHolidayTask) continue;
            r.remove("holidayDaily");
            if (list.length() == 0) { r.remove("tasksConfirmed"); r.remove("orderSaved"); r.remove("orderDraft"); }
        }
    }
    static void removeHoliday(JSONObject state, String id) { if (!refs(state, id).isEmpty()) throw new IllegalArgumentException("假期已有作业，不能删除；请保留以便查看记录"); clearEmptyHolidayMarkers(state, object(state, "holidays").optJSONObject(id)); object(state, "holidays").remove(id); }
    static void add(JSONObject state, JSONObject h, String subject, String title, int minutes, boolean repeat, List<String> dates) {
        if (title.trim().isEmpty() || dates.isEmpty()) throw new IllegalArgumentException("请填写作业，并选择至少一天");
        for (String date : dates) if (!iso(date) || date.compareTo(h.optString(repeat ? "start" : "planDate")) < 0 || date.compareTo(h.optString("end")) > 0) throw new IllegalArgumentException("作业日期应在计划范围内");
        String series = UUID.randomUUID().toString(); int sequence = 0;
        for (String date : new java.util.LinkedHashSet<>(dates)) {
            JSONObject t = new JSONObject(); put(t, "id", "holiday-" + series + "-" + sequence); put(t, "holidayId", h.optString("id"));
            put(t, "holidaySeriesId", repeat ? series : ""); put(t, "holidayOriginalDate", date); put(t, "title", title.trim()); put(t, "subject", subject); put(t, "estimatedMinutes", minutes);
            put(t, "status", "pending"); put(t, "elapsedMs", 0); put(t, "addedAt", System.currentTimeMillis()); put(t, "addedSequence", sequence++);
            JSONArray list = tasks(state, date); list.put(t); put(record(state, date), "tasks", list); mark(state, date);
        }
    }
    static void edit(JSONObject state, Ref ref, String title, int minutes, boolean series, String today) {
        if (!pending(ref.task)) throw new IllegalArgumentException("已开始或已完成的作业保留原记录");
        if (title.trim().isEmpty()) throw new IllegalArgumentException("作业内容不能为空");
        List<Ref> targets = new ArrayList<>(); String group = ref.task.optString("holidaySeriesId");
        if (series && !group.isEmpty()) { for (Ref r : refs(state, ref.task.optString("holidayId"))) if (group.equals(r.task.optString("holidaySeriesId")) && r.date.compareTo(ref.date) >= 0 && r.date.compareTo(today) >= 0 && pending(r.task)) targets.add(r); }
        else targets.add(ref);
        if (targets.isEmpty()) throw new IllegalArgumentException("没有可修改的未来作业，可取消批量修改后单独修改这一项");
        for (Ref r : targets) { put(r.task, "title", title.trim()); put(r.task, "estimatedMinutes", minutes); }
    }
    static void detach(JSONObject state, Ref ref) { JSONArray result = new JSONArray(), list = tasks(state, ref.date); for (int i = 0; i < list.length(); i++) if (!ref.task.optString("id").equals(list.optJSONObject(i).optString("id"))) result.put(list.optJSONObject(i)); put(record(state, ref.date), "tasks", result); }
    static void removeTask(JSONObject state, Ref ref) { if (!pending(ref.task)) throw new IllegalArgumentException("已开始或已完成的作业保留原记录"); detach(state, ref); mark(state, ref.date); }
    static void move(JSONObject state, Ref ref, String date) {
        if (!iso(date)) throw new IllegalArgumentException("请选择有效日期");
        if ("done".equals(ref.task.optString("status")) || "active".equals(ref.task.optString("status"))) throw new IllegalArgumentException("请先暂停作业；已完成的记录不能改期");
        if (date.equals(ref.date)) return;
        if (find(state, date) == null && tasks(state, date).length() > 0 && !record(state, date).optBoolean("tasksConfirmed")) throw new IllegalArgumentException("请先确认目标日期已有的作业清单，再安排补做");
        JSONObject weekends = object(state, "weekends"); Iterator<String> it = weekends.keys();
        while (it.hasNext()) { String key = it.next(); JSONObject w = weekends.optJSONObject(key); if (w != null && key.compareTo(date) <= 0 && plus(key, 2).compareTo(date) >= 0 && meaningfulWeekend(w)) throw new IllegalArgumentException("所选日期已有周末计划，请选择其他日期，避免覆盖原计划"); }
        boolean confirmed = record(state, date).optBoolean("tasksConfirmed"); detach(state, ref); JSONArray list = tasks(state, date); list.put(ref.task); put(record(state, date), "tasks", list);
        mark(state, ref.date); mark(state, date); if (confirmed || find(state, date) == null) { put(record(state, date), "tasksConfirmed", true); put(record(state, date), "orderSaved", true); }
    }
    static void confirm(JSONObject state, JSONObject h) { for (String date : days(h.optString("planDate"), h.optString("end"))) { JSONObject r = record(state, date); put(r, "tasks", tasks(state, date)); put(r, "holidayDaily", true); put(r, "tasksConfirmed", true); put(r, "orderSaved", true); r.remove("orderDraft"); } put(h, "confirmed", true); }
    static void order(JSONObject state, String date, List<String> ids) {
        JSONArray list = tasks(state, date); List<JSONObject> available = new ArrayList<>(), selected = new ArrayList<>();
        for (int i = 0; i < list.length(); i++) if (pending(list.optJSONObject(i))) available.add(list.optJSONObject(i));
        if (new HashSet<>(ids).size() != ids.size() || ids.size() != available.size()) throw new IllegalArgumentException("请按顺序选完当天未开始的作业");
        for (String id : ids) { JSONObject match = null; for (JSONObject t : available) if (id.equals(t.optString("id"))) match = t; if (match == null) throw new IllegalArgumentException("作业清单有变化，请重新选择"); selected.add(match); }
        JSONArray result = new JSONArray(); int next = 0;
        for (int i = 0; i < list.length(); i++) result.put(pending(list.optJSONObject(i)) ? selected.get(next++) : list.optJSONObject(i));
        put(record(state, date), "tasks", result); put(record(state, date), "orderSaved", true);
    }
}
