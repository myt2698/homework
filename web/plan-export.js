/* Offline, read-only plan sheets. PDF pages embed local canvas text for reliable Chinese fonts. */
(function (root) {
  "use strict";
  const WIDTH = 595, HEIGHT = 842, TOP = 168, BOTTOM = 762, LINE = 18;
  const FONT = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
  const INK = "#24324a", MUTED = "#667085", GREEN = "#286b58";
  const statusLabel = status => ({ done: "已完成", active: "进行中", paused: "已暂停" }[status] || "待完成");
  function snapshot(state, dates) {
    return dates.map(date => ({ date, tasks: (state.records?.[date]?.tasks || []).filter(Boolean).map(task => ({
      title: String(task.title || "未命名作业"), subject: String(task.subject || "其他"),
      minutes: Number.isFinite(Number(task.estimatedMinutes)) && Number(task.estimatedMinutes) > 0 ? Number(task.estimatedMinutes) : 15,
      status: String(task.status || "pending")
    })) }));
  }
  function filename(days) {
    const start = days[0].date, end = days[days.length - 1].date;
    return `作业计划_${start}${start === end ? "" : `_${end}`}.pdf`;
  }
  function wrap(value, width, measure) {
    const lines = [];
    for (const paragraph of String(value).replace(/\r\n?/g, "\n").split("\n")) {
      let line = "";
      for (const char of Array.from(paragraph)) {
        if (line && measure(line + char) > width) { lines.push(line); line = ""; }
        line += char;
      }
      lines.push(line);
    }
    return lines;
  }
  function layout(days, measure) {
    const pages = [];
    for (const day of days) {
      let page, y;
      const next = () => { page = { day, continued: pages.length > 0 && pages[pages.length - 1].day === day, rows: [] }; pages.push(page); y = TOP; };
      next();
      day.tasks.forEach((task, index) => {
        const title = wrap(task.title, 292, measure), subject = wrap(task.subject, 40, measure);
        const count = Math.max(title.length, subject.length);
        // Keep ordinary rows together; exceptionally long imported text continues on another sheet.
        const height = count * LINE + 24;
        if (height <= BOTTOM - TOP && y + height > BOTTOM) next();
        let offset = 0;
        while (offset < count) {
          let available = Math.floor((BOTTOM - y - 24) / LINE);
          if (available < 1) { next(); available = Math.floor((BOTTOM - y - 24) / LINE); }
          const take = Math.min(count - offset, available), rowHeight = take * LINE + 24;
          page.rows.push({ task, index, y, height: rowHeight, continued: offset > 0,
            title: title.slice(offset, offset + take), subject: subject.slice(offset, offset + take) });
          y += rowHeight; offset += take;
          if (offset < count) next();
        }
      });
    }
    return pages;
  }
  function draw(page, number, count, canvas) {
    const c = canvas.getContext("2d");
    c.setTransform(3, 0, 0, 3, 0, 0);
    c.fillStyle = "white"; c.fillRect(0, 0, WIDTH, HEIGHT);
    c.textBaseline = "top";
    const text = (value, x, y, size = 11, color = INK, bold = false) => {
      c.fillStyle = color; c.font = `${bold ? "600 " : ""}${size}px ${FONT}`; c.fillText(String(value), x, y);
    };
    const rule = y => { c.strokeStyle = "#d9dfe5"; c.lineWidth = .6; c.beginPath(); c.moveTo(36, y); c.lineTo(559, y); c.stroke(); };
    text("作业小计划", 36, 30, 10, GREEN, true);
    text("我的作业计划", 36, 51, 25, INK, true);
    const weekday = "日一二三四五六"[new Date(`${page.day.date}T12:00:00`).getDay()];
    text(`${page.day.date}  周${weekday}${page.continued ? " · 续页" : ""}`, 36, 96, 15, INK, true);
    const tasks = page.day.tasks;
    text(`${tasks.length} 项作业   ·   预计 ${tasks.reduce((n, t) => n + t.minutes, 0)} 分钟   ·   已完成 ${tasks.filter(t => t.status === "done").length} 项`, 36, 123, 10, MUTED);
    c.fillStyle = "#edf4f1"; c.fillRect(36, 146, 523, 22);
    [["序号", 40], ["科目", 72], ["作业内容", 120], ["预计用时", 426], ["完成状态", 499]].forEach(([t, x]) => text(t, x, 152, 9, GREEN, true));
    for (const row of page.rows) {
      const y = row.y + 12;
      text(row.continued ? "续" : row.index + 1, 42, y, 10, MUTED);
      row.subject.forEach((line, i) => text(line, 72, y + i * LINE));
      row.title.forEach((line, i) => text(line, 120, y + i * LINE));
      text(`${row.task.minutes} 分钟`, 426, y, 10);
      c.strokeStyle = GREEN; c.lineWidth = .8; c.strokeRect(486, y + 1, 9, 9);
      if (row.task.status === "done") { c.beginPath(); c.moveTo(488, y + 5); c.lineTo(490, y + 8); c.lineTo(494, y + 2); c.stroke(); }
      text(statusLabel(row.task.status), 499, y, 10, MUTED);
      rule(row.y + row.height);
    }
    if (!tasks.length) text("这一天还没有安排作业", 36, 190, 12, MUTED);
    const end = page.rows.length ? page.rows[page.rows.length - 1].y + page.rows[page.rows.length - 1].height : 224;
    if (end < 662) { text("备注", 36, end + 28, 10, MUTED); rule(end + 70); rule(end + 104); }
    rule(788);
    text("按顺序完成，做完一项打个勾。", 36, 803, 9, MUTED);
    text(`${number} / ${count}`, 516, 803, 9, MUTED);
  }
  async function sheets(days, consume) {
    await document.fonts.ready;
    const canvas = document.createElement("canvas"); canvas.width = WIDTH * 3; canvas.height = HEIGHT * 3;
    const c = canvas.getContext("2d");
    if (!c) throw Error("当前浏览器无法生成 PDF，请更换浏览器重试");
    c.font = `11px ${FONT}`;
    const pages = layout(days, text => c.measureText(text).width);
    try {
      for (let i = 0; i < pages.length; i++) {
        draw(pages[i], i + 1, pages.length, canvas);
        await consume(canvas.toDataURL("image/jpeg", .94), i, pages.length);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } finally { canvas.width = canvas.height = 0; }
  }
  async function pdf(days, progress = () => {}) {
    const doc = await root.PDFLib.PDFDocument.create();
    doc.setTitle(filename(days).replace(/\.pdf$/, "")); doc.setCreator("作业小计划");
    await sheets(days, async (data, index, count) => {
      const jpg = await doc.embedJpg(data);
      doc.addPage([WIDTH, HEIGHT]).drawImage(jpg, { x: 0, y: 0, width: WIDTH, height: HEIGHT });
      progress(index + 1, count);
    });
    return new Blob([await doc.save()], { type: "application/pdf" });
  }
  async function download(days, progress) {
    const blob = await pdf(days, progress), url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename(days); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  let printFrame = null;
  async function print(days, progress = () => {}) {
    const images = [];
    await sheets(days, (data, i, count) => { images.push(data); progress(i + 1, count); });
    printFrame?.remove();
    const frame = document.createElement("iframe"); printFrame = frame;
    frame.title = "作业计划打印"; frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0";
    const loaded = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("打印准备超时，请重试或下载 PDF 后打印")), 30000);
      frame.onload = () => { clearTimeout(timer); resolve(); };
    });
    // Only generated JPEG data enters this document. User text is painted, never parsed as HTML.
    frame.srcdoc = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${filename(days)}</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0}img{display:block;width:210mm;height:297mm;break-after:page;page-break-after:always}img:last-child{break-after:auto;page-break-after:auto}</style></head><body>${images.map(src => `<img src="${src}" alt="作业计划打印页">`).join("")}</body></html>`;
    document.body.append(frame);
    try {
      await loaded;
      await Promise.all(Array.from(frame.contentDocument.images, img => img.decode()));
      const cleanup = () => setTimeout(() => { frame.remove(); if (printFrame === frame) printFrame = null; }, 1000);
      frame.contentWindow.addEventListener("afterprint", cleanup, { once: true });
      frame.contentWindow.focus(); frame.contentWindow.print();
    } catch (error) { frame.remove(); if (printFrame === frame) printFrame = null; throw error; }
  }
  root.PlanExport = { snapshot, filename, layout, wrap, pdf, download, print };
  if (typeof module !== "undefined") module.exports = root.PlanExport;
})(globalThis);
