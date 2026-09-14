package com.homework.ledger;

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;

/** One task list per actual date. Legacy weekend objects remain settlement archives. */
final class StudyPlans extends HolidayPlans {
    static List<Ref> refs(JSONObject s, String id) {
        List<Ref> result = new ArrayList<>(); Iterator<String> keys = object(s, "records").keys();
        while (keys.hasNext()) { String date = keys.next(); if (!iso(date)) continue; JSONArray list = tasks(s, date);
            for (int i = 0; i < list.length(); i++) { JSONObject t = list.optJSONObject(i); if (t != null && (id == null || id.equals(t.optString("holidayId")))) result.add(new Ref(date, t)); }
        }
        Collections.sort(result, (a,b) -> a.date.compareTo(b.date)); return result;
    }
    static JSONObject find(JSONObject s, String date) {
        JSONObject result = null;
        for (JSONObject h : configs(s)) if (h.optString("planDate").compareTo(date) <= 0 && date.compareTo(h.optString("end")) <= 0
                && (result == null || h.optString("planDate").compareTo(result.optString("planDate")) > 0)) result = h;
        return result;
    }
    static void migrate(JSONObject s, String today, JSONObject... sessions) {
        HashSet<String> known = new HashSet<>(); for (Ref r : refs(s, null)) known.add(r.task.optString("id"));
        JSONObject weekends = object(s, "weekends"); Iterator<String> keys = weekends.keys();
        while (keys.hasNext()) {
            String key = keys.next(); JSONObject w = weekends.optJSONObject(key);
            if (!iso(key) || w == null || w.optBoolean("datedTasksMigrated")) continue;
            for(String d:days(key,plus(key,2))){JSONObject r=object(s,"records").optJSONObject(d);if(r!=null&&(r.has("finishTime")||r.has("ruleId")))put(r,"legacyWeekendSettlement",true);}
            JSONArray list = w.optJSONArray("tasks");
            if (list != null) for (int i = 0; i < list.length(); i++) {
                JSONObject original = list.optJSONObject(i); if (original == null || known.contains(original.optString("id"))) continue;
                String planned = plus(key, "friday".equals(original.optString("plannedDay")) ? 0 : "sunday".equals(original.optString("plannedDay")) ? 2 : 1);
                String date = planned, worked = original.optString("lastWorkedDate");
                if (!iso(worked) && original.optLong("activeSince") > 0) worked = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(new java.util.Date(original.optLong("activeSince")));
                if ("active".equals(original.optString("status")) && iso(worked)) date = worked;
                for (JSONObject session : sessions) if (session != null && iso(session.optString("date")))
                    for (String field : new String[]{"taskId", "sourceTaskId", "nextTaskId"}) if (original.optString("id").equals(session.optString(field))) date = session.optString("date");
                if ("done".equals(original.optString("status")) && iso(original.optString("completedDate"))) date = original.optString("completedDate");
                JSONObject copy;
                try { copy = new JSONObject(original.toString()); } catch (org.json.JSONException e) { throw new IllegalArgumentException(e); }
                put(copy, "legacyPlannedDate", planned); put(copy, "legacyWeekendKey", key);
                JSONObject r = record(s, date); JSONArray target = tasks(s, date); target.put(copy); put(r, "tasks", target); known.add(copy.optString("id"));
                boolean started = !"pending".equals(original.optString("status", "pending"));
                if (w.optBoolean("confirmed") || started) put(r, "tasksConfirmed", true);
                if (w.optBoolean("orderSaved") || w.optBoolean("planSaved") || started) put(r, "orderSaved", true);
            }
            put(w, "datedTasksMigrated", true);
            if (list != null && list.length() > 0) {
                String id = "legacy-weekend-" + key; JSONObject registry = object(s, "holidays");
                if (!registry.has(id)) { JSONObject h = new JSONObject(); put(h,"id",id);put(h,"name","作业计划");put(h,"start",key);put(h,"planDate",key);put(h,"end",plus(key,2));put(h,"confirmed",w.optBoolean("confirmed"));put(h,"legacy",true);put(registry,id,h); }
            }
        }
        for (JSONObject h : configs(s)) if (!h.optBoolean("unified") && !h.optBoolean("legacy")) {
            put(h,"unified",true);
        }
        put(s,"planningVersion",2);
    }
    static JSONObject ensure(JSONObject s, String date) {
        if (!iso(date)) throw new IllegalArgumentException("日期无效");
        String id = "plan-"+date; JSONObject registry = object(s,"holidays"), existing = registry.optJSONObject(id); if(existing!=null)return existing;
        JSONObject old=find(s,date), h=new JSONObject();put(h,"id",id);put(h,"name","作业计划");put(h,"start",date);put(h,"planDate",date);put(h,"end",old==null?date:old.optString("end"));put(h,"unified",true);put(h,"confirmed",record(s,date).optBoolean("tasksConfirmed"));put(registry,id,h);return h;
    }
    static void setRange(JSONObject s, JSONObject h, int count) {
        if(count<1||count>366)throw new IllegalArgumentException("请选择 1 到 366 天，包含开始的这一天");
        put(h,"end",plus(h.optString("planDate"),count-1));put(h,"start",h.optString("planDate"));put(h,"unified",true);
    }
    static void mark(JSONObject s,String date,boolean added) {
        JSONObject r=record(s,date);r.remove("orderDraft");
        if(added){r.remove("tasksFinishedAt");r.remove("finishTime");r.remove("ruleId");r.remove("legacyWeekendSettlement");}
    }
    static void add(JSONObject s,JSONObject h,String subject,String title,int minutes,boolean repeat,List<String> dates) {
        if(title.trim().isEmpty()||dates.isEmpty())throw new IllegalArgumentException("请填写作业，并选择至少一天");
        for(String d:dates)if(!iso(d)||d.compareTo(h.optString("planDate"))<0||d.compareTo(h.optString("end"))>0)throw new IllegalArgumentException("作业日期应在计划范围内");
        String series=UUID.randomUUID().toString();int i=0;
        for(String d:new java.util.LinkedHashSet<>(dates)){
            JSONObject t=new JSONObject();put(t,"id","plan-"+series+"-"+i);put(t,"holidayId",h.optString("id"));put(t,"holidaySeriesId",repeat?series:"");put(t,"holidayOriginalDate",d);put(t,"title",title.trim());put(t,"subject",subject);put(t,"estimatedMinutes",minutes);put(t,"status","pending");put(t,"elapsedMs",0);put(t,"addedAt",System.currentTimeMillis());put(t,"addedSequence",i++);
            JSONArray list=tasks(s,d);list.put(t);put(record(s,d),"tasks",list);mark(s,d,true);
        }
    }
    static void move(JSONObject s,Ref ref,String date) {
        if(!iso(date))throw new IllegalArgumentException("请选择有效日期");
        if("done".equals(ref.task.optString("status"))||"active".equals(ref.task.optString("status")))throw new IllegalArgumentException("请先暂停作业；已完成的记录不能改期");
        if(date.equals(ref.date))return;
        boolean found=false;JSONArray source=tasks(s,ref.date);for(int i=0;i<source.length();i++)if(source.optJSONObject(i)==ref.task)found=true;
        if(!found)throw new IllegalArgumentException("作业清单有变化，请重新打开计划");
        detach(s,ref);JSONArray list=tasks(s,date);boolean empty=list.length()==0;list.put(ref.task);JSONObject target=record(s,date);put(target,"tasks",list);mark(s,ref.date,false);mark(s,date,true);
        if(empty){put(target,"tasksConfirmed",true);put(target,"orderSaved",true);}
    }
    static void removeTask(JSONObject s,Ref ref){if(!pending(ref.task))throw new IllegalArgumentException("已开始或已完成的作业保留原记录");detach(s,ref);mark(s,ref.date,false);}
    static void confirm(JSONObject s,JSONObject h){for(String d:days(h.optString("planDate"),h.optString("end"))){JSONObject r=record(s,d);put(r,"tasks",tasks(s,d));put(r,"tasksConfirmed",true);put(r,"orderSaved",true);r.remove("orderDraft");}put(h,"confirmed",true);}
}
