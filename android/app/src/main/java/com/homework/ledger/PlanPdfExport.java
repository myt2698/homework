package com.homework.ledger;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.pdf.PdfDocument;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.OperationCanceledException;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.print.pdf.PrintedPdfDocument;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/** Read-only native A4 sheets, saved through the system picker or sent to Android printing. */
final class PlanPdfExport {
    private static final int REQUEST = 303, WIDTH = 595, HEIGHT = 842, TOP = 168, BOTTOM = 762, LINE = 18;
    private static final int INK = Color.rgb(36,50,74), MUTED = Color.rgb(102,112,133), GREEN = Color.rgb(40,107,88);
    private static final AtomicBoolean SAVING = new AtomicBoolean(false);

    private static final class Task {
        final String title, subject, status; final int minutes;
        Task(JSONObject t) {
            title = value(t, "title", "未命名作业"); subject = value(t, "subject", "其他"); status = value(t, "status", "pending");
            minutes = t.optInt("estimatedMinutes", 15) > 0 ? t.optInt("estimatedMinutes", 15) : 15;
        }
    }
    private static final class Day {
        final String date; final List<Task> tasks = new ArrayList<>();
        Day(String date) { this.date = date; }
    }
    private static final class Row {
        Task task; int index, y, height; boolean continued; List<String> title, subject;
    }
    private static final class Sheet {
        Day day; boolean continued; final List<Row> rows = new ArrayList<>();
        Sheet(Day day, boolean continued) { this.day = day; this.continued = continued; }
    }
    private static String value(JSONObject t, String key, String fallback) {
        String value = t.optString(key, fallback); return value.isEmpty() ? fallback : value;
    }
    private static void toast(Activity activity, String text) {
        if (!activity.isDestroyed() && !activity.isFinishing()) Toast.makeText(activity, text, Toast.LENGTH_LONG).show();
    }
    private static List<Day> snapshot(JSONObject state, List<String> dates) {
        List<Day> result = new ArrayList<>(); JSONObject records = state.optJSONObject("records");
        for (String date : dates) {
            Day day = new Day(date); result.add(day);
            JSONObject record = records == null ? null : records.optJSONObject(date);
            JSONArray tasks = record == null ? null : record.optJSONArray("tasks");
            if (tasks != null) for (int i = 0; i < tasks.length(); i++) {
                JSONObject task = tasks.optJSONObject(i); if (task != null) day.tasks.add(new Task(task));
            }
        }
        return result;
    }
    private static String filename(List<Day> days) {
        String start = days.get(0).date, end = days.get(days.size() - 1).date;
        return "作业计划_" + start + (start.equals(end) ? "" : "_" + end) + ".pdf";
    }
    static void show(Activity activity, JSONObject state, String current, String start, String end) {
        if (SAVING.get()) { toast(activity, "正在生成 PDF，请稍候"); return; }
        List<Day> day = snapshot(state, Collections.singletonList(current));
        List<Day> range = snapshot(state, StudyPlans.days(start, end));
        int[] selected = {0};
        String[] choices = start.equals(end) ? new String[]{"当前一天 · " + current + " · " + count(day) + " 项作业"}
                : new String[]{"当前一天 · " + current + " · " + count(day) + " 项作业", "整个计划范围 · " + start + " 至 " + end + "\n" + range.size() + " 天 · " + count(range) + " 项作业"};
        new AlertDialog.Builder(activity).setTitle("下载 / 打印计划（A4）")
                .setSingleChoiceItems(choices, 0, (dialog, index) -> selected[0] = index)
                .setPositiveButton("下载 PDF", (dialog, which) -> download(activity, selected[0] == 0 ? day : range))
                .setNeutralButton("打印", (dialog, which) -> print(activity, selected[0] == 0 ? day : range))
                .setNegativeButton("关闭", null).show();
    }
    private static int count(List<Day> days) { int count = 0; for (Day day : days) count += day.tasks.size(); return count; }
    // A stable private cache file survives Activity recreation while the system picker is open.
    private static File pendingFile(Activity activity) { return new File(activity.getCacheDir(), "plan-export-pending.pdf"); }
    private static void download(Activity activity, List<Day> days) {
        if (!SAVING.compareAndSet(false, true)) { toast(activity, "正在生成 PDF，请稍候"); return; }
        toast(activity, "正在生成 PDF…");
        new Thread(() -> {
            File file = pendingFile(activity);
            try {
                List<Sheet> pages = layout(days, new CancellationSignal());
                PdfDocument doc = new PdfDocument();
                try (OutputStream out = new FileOutputStream(file)) {
                    for (int i = 0; i < pages.size(); i++) {
                        PdfDocument.Page page = doc.startPage(new PdfDocument.PageInfo.Builder(WIDTH, HEIGHT, i + 1).create());
                        try { draw(pages.get(i), i + 1, pages.size(), page.getCanvas()); } finally { doc.finishPage(page); }
                    }
                    doc.writeTo(out);
                } finally { doc.close(); }
                activity.runOnUiThread(() -> {
                    if (activity.isDestroyed() || activity.isFinishing()) { file.delete(); SAVING.set(false); return; }
                    try {
                        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("application/pdf");
                        intent.putExtra(Intent.EXTRA_TITLE, filename(days)); activity.startActivityForResult(intent, REQUEST);
                        // Remain locked until the picker returns, so the pending file cannot be replaced.
                    } catch (RuntimeException error) { file.delete(); SAVING.set(false); toast(activity, "无法打开保存位置，请重试或使用打印中的另存为 PDF"); }
                });
            } catch (Exception error) {
                file.delete(); SAVING.set(false); activity.runOnUiThread(() -> toast(activity, "PDF 生成失败，请检查存储空间后重试"));
            }
        }, "plan-pdf-generate").start();
    }
    static boolean onActivityResult(Activity activity, int request, int result, Intent data) {
        if (request != REQUEST) return false;
        File file = pendingFile(activity);
        if (result != Activity.RESULT_OK || data == null || data.getData() == null) { file.delete(); SAVING.set(false); return true; }
        SAVING.set(true);
        new Thread(() -> {
            try {
                if (!file.isFile()) throw new IOException("The pending PDF is unavailable");
                try (FileInputStream in = new FileInputStream(file); OutputStream out = activity.getContentResolver().openOutputStream(data.getData(), "wt")) {
                    if (out == null) throw new IOException("No output stream");
                    byte[] buffer = new byte[32768]; int length;
                    while ((length = in.read(buffer)) != -1) out.write(buffer, 0, length);
                }
                activity.runOnUiThread(() -> toast(activity, "PDF 已保存到所选位置"));
            } catch (Exception error) { activity.runOnUiThread(() -> toast(activity, "PDF 保存失败，请重新下载并选择保存位置")); }
            finally { file.delete(); SAVING.set(false); }
        }, "plan-pdf-save").start();
        return true;
    }
    private static void print(Activity activity, List<Day> days) {
        try {
            PrintManager manager = (PrintManager) activity.getSystemService(Activity.PRINT_SERVICE);
            if (manager == null) { toast(activity, "当前设备无法打印，请下载 PDF 后打印"); return; }
            manager.print(filename(days), new Adapter(activity, days), new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4).setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                    .setColorMode(PrintAttributes.COLOR_MODE_COLOR).build());
        } catch (RuntimeException error) { toast(activity, "无法打开打印，请下载 PDF 后打印"); }
    }
    // https://developer.android.com/training/printing/custom-docs
    private static final class Adapter extends PrintDocumentAdapter {
        private final Activity activity; private final List<Day> days;
        private List<Sheet> sheets; private PrintAttributes attributes;
        Adapter(Activity activity, List<Day> days) { this.activity = activity; this.days = days; }
        @Override public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes, CancellationSignal signal, LayoutResultCallback callback, Bundle extras) {
            attributes = newAttributes;
            new Thread(() -> {
                try {
                    List<Sheet> result = layout(days, signal); signal.throwIfCanceled();
                    activity.runOnUiThread(() -> {
                        if (signal.isCanceled()) { callback.onLayoutCancelled(); return; }
                        sheets = result;
                        callback.onLayoutFinished(new PrintDocumentInfo.Builder(filename(days)).setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(result.size()).build(), !newAttributes.equals(oldAttributes));
                    });
                } catch (OperationCanceledException error) { activity.runOnUiThread(callback::onLayoutCancelled); }
                catch (Exception error) { activity.runOnUiThread(() -> callback.onLayoutFailed("无法准备计划，请重试")); }
            }, "plan-print-layout").start();
        }
        @Override public void onWrite(PageRange[] requested, ParcelFileDescriptor destination, CancellationSignal signal, WriteResultCallback callback) {
            final List<Sheet> pages = sheets; final PrintAttributes options = attributes;
            new Thread(() -> {
                List<PageRange> written = new ArrayList<>();
                try (OutputStream out = new ParcelFileDescriptor.AutoCloseOutputStream(destination)) {
                    PrintedPdfDocument doc = new PrintedPdfDocument(activity, options);
                    try {
                        for (int i = 0; i < pages.size(); i++) {
                            signal.throwIfCanceled(); if (!contains(requested, i)) continue;
                            PdfDocument.Page page = doc.startPage(i + 1);
                            try {
                                Canvas canvas = page.getCanvas(); Rect area = doc.getPageContentRect();
                                float scale = Math.min(area.width() / (float) WIDTH, area.height() / (float) HEIGHT);
                                canvas.save(); canvas.translate(area.left + (area.width() - WIDTH * scale) / 2f, area.top + (area.height() - HEIGHT * scale) / 2f);
                                canvas.scale(scale, scale); draw(pages.get(i), i + 1, pages.size(), canvas); canvas.restore();
                            } finally { doc.finishPage(page); }
                            written.add(new PageRange(i, i));
                        }
                        signal.throwIfCanceled();
                        if (written.isEmpty()) throw new IOException("No requested pages");
                        doc.writeTo(out); signal.throwIfCanceled();
                    } finally { doc.close(); }
                } catch (OperationCanceledException error) { activity.runOnUiThread(callback::onWriteCancelled); return; }
                catch (Exception error) { activity.runOnUiThread(() -> callback.onWriteFailed("打印文件生成失败，请重试")); return; }
                activity.runOnUiThread(() -> { if (signal.isCanceled()) callback.onWriteCancelled(); else callback.onWriteFinished(written.toArray(new PageRange[0])); });
            }, "plan-print-write").start();
        }
        private boolean contains(PageRange[] ranges, int page) {
            for (PageRange range : ranges) if (page >= range.getStart() && page <= range.getEnd()) return true;
            return false;
        }
    }
    private static Paint paint(int size, int color, boolean bold) {
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG); paint.setTextSize(size); paint.setColor(color);
        paint.setTypeface(Typeface.create("sans-serif", bold ? Typeface.BOLD : Typeface.NORMAL)); return paint;
    }
    private static List<String> wrap(String value, int width, Paint paint) {
        List<String> lines = new ArrayList<>();
        for (String paragraph : value.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1)) {
            String line = "";
            for (int offset = 0; offset < paragraph.length();) {
                int next = offset + Character.charCount(paragraph.codePointAt(offset)); String character = paragraph.substring(offset, next);
                if (!line.isEmpty() && paint.measureText(line + character) > width) { lines.add(line); line = ""; }
                line += character; offset = next;
            }
            lines.add(line);
        }
        return lines;
    }
    private static List<Sheet> layout(List<Day> days, CancellationSignal signal) {
        List<Sheet> pages = new ArrayList<>(); Paint measure = paint(11, INK, false);
        for (Day day : days) {
            signal.throwIfCanceled(); Sheet page = new Sheet(day, false); pages.add(page); int y = TOP;
            for (int i = 0; i < day.tasks.size(); i++) {
                signal.throwIfCanceled(); Task task = day.tasks.get(i);
                List<String> title = wrap(task.title, 292, measure), subject = wrap(task.subject, 40, measure);
                int count = Math.max(title.size(), subject.size()), height = count * LINE + 24;
                if (height <= BOTTOM - TOP && y + height > BOTTOM) { page = new Sheet(day, true); pages.add(page); y = TOP; }
                int offset = 0;
                while (offset < count) {
                    signal.throwIfCanceled(); int available = (BOTTOM - y - 24) / LINE;
                    if (available < 1) { page = new Sheet(day, true); pages.add(page); y = TOP; available = (BOTTOM - y - 24) / LINE; }
                    int take = Math.min(count - offset, available); Row row = new Row();
                    row.task = task; row.index = i; row.y = y; row.height = take * LINE + 24; row.continued = offset > 0;
                    row.title = new ArrayList<>(title.subList(Math.min(offset, title.size()), Math.min(offset + take, title.size())));
                    row.subject = new ArrayList<>(subject.subList(Math.min(offset, subject.size()), Math.min(offset + take, subject.size())));
                    page.rows.add(row); y += row.height; offset += take;
                    if (offset < count) { page = new Sheet(day, true); pages.add(page); y = TOP; }
                }
            }
        }
        return pages;
    }
    private static void text(Canvas canvas, String value, int x, int y, int size, int color, boolean bold) {
        Paint paint = paint(size, color, bold); canvas.drawText(value, x, y - paint.ascent(), paint);
    }
    private static void rule(Canvas canvas, int y) {
        Paint paint = paint(1, Color.rgb(217,223,229), false); paint.setStrokeWidth(.6f); canvas.drawLine(36, y, 559, y, paint);
    }
    private static String status(String status) {
        return "done".equals(status) ? "已完成" : "active".equals(status) ? "进行中" : "paused".equals(status) ? "已暂停" : "待完成";
    }
    private static void draw(Sheet page, int number, int count, Canvas canvas) {
        canvas.drawColor(Color.WHITE);
        text(canvas, "作业小计划", 36, 30, 10, GREEN, true); text(canvas, "我的作业计划", 36, 51, 25, INK, true);
        String weekday = "";
        try { java.util.Calendar calendar = java.util.Calendar.getInstance(); calendar.setTime(new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).parse(page.day.date)); weekday = "周" + "日一二三四五六".charAt(calendar.get(java.util.Calendar.DAY_OF_WEEK) - 1); } catch (java.text.ParseException ignored) { }
        text(canvas, page.day.date + "  " + weekday + (page.continued ? " · 续页" : ""), 36, 96, 15, INK, true);
        int minutes = 0, done = 0; for (Task task : page.day.tasks) { minutes += task.minutes; if ("done".equals(task.status)) done++; }
        text(canvas, page.day.tasks.size() + " 项作业   ·   预计 " + minutes + " 分钟   ·   已完成 " + done + " 项", 36, 123, 10, MUTED, false);
        canvas.drawRect(36,146,559,168,paint(1,Color.rgb(237,244,241),false));
        String[] labels = {"序号", "科目", "作业内容", "预计用时", "完成状态"}; int[] columns = {40,72,120,426,499};
        for (int i = 0; i < labels.length; i++) text(canvas, labels[i], columns[i], 152, 9, GREEN, true);
        for (Row row : page.rows) {
            int y = row.y + 12;
            text(canvas, row.continued ? "续" : String.valueOf(row.index + 1), 42, y, 10, MUTED, false);
            for (int i = 0; i < row.subject.size(); i++) text(canvas, row.subject.get(i), 72, y + i * LINE, 11, INK, false);
            for (int i = 0; i < row.title.size(); i++) text(canvas, row.title.get(i), 120, y + i * LINE, 11, INK, false);
            text(canvas, row.task.minutes + " 分钟", 426, y, 10, INK, false);
            Paint check = paint(1,GREEN,false); check.setStyle(Paint.Style.STROKE); check.setStrokeWidth(.8f); canvas.drawRect(486,y+1,495,y+10,check);
            if ("done".equals(row.task.status)) { canvas.drawLine(488,y+5,490,y+8,check); canvas.drawLine(490,y+8,494,y+2,check); }
            text(canvas, status(row.task.status), 499, y, 10, MUTED, false); rule(canvas, row.y + row.height);
        }
        if (page.day.tasks.isEmpty()) text(canvas, "这一天还没有安排作业", 36, 190, 12, MUTED, false);
        int end = page.rows.isEmpty() ? 224 : page.rows.get(page.rows.size()-1).y + page.rows.get(page.rows.size()-1).height;
        if (end < 662) { text(canvas,"备注",36,end+28,10,MUTED,false); rule(canvas,end+70); rule(canvas,end+104); }
        rule(canvas,788); text(canvas,"按顺序完成，做完一项打个勾。",36,803,9,MUTED,false); text(canvas,number + " / " + count,516,803,9,MUTED,false);
    }
}
