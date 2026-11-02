import SwiftUI
import UIKit

enum PlanPDF {
    /// Render only from a value snapshot; exporting never changes task state.
    static func make(state: LedgerState, dates: [String]) throws -> Data {
        guard !dates.isEmpty, dates.count <= 366 else { throw LedgerError("请选择有效的导出日期范围") }
        let bounds = CGRect(x: 0, y: 0, width: 595.28, height: 841.89)
        let renderer = UIGraphicsPDFRenderer(bounds: bounds)
        let bodyFont = UIFont.systemFont(ofSize: 12)
        let titleFont = UIFont.boldSystemFont(ofSize: 21)
        let paragraph = NSMutableParagraphStyle(); paragraph.lineBreakMode = .byWordWrapping; paragraph.lineSpacing = 4
        let attributes: [NSAttributedString.Key: Any] = [.font: bodyFont, .paragraphStyle: paragraph, .foregroundColor: UIColor.black]
        let width = bounds.width - 84, bottom = bounds.height - 58
        return renderer.pdfData { context in
            var y: CGFloat = 0, page = 0
            func newPage(_ date: String) {
                context.beginPage(); page += 1; y = 42
                ("作业小计划" as NSString).draw(at: CGPoint(x: 42, y: y), withAttributes: [.font: titleFont, .foregroundColor: UIColor.black])
                y += 34
                (date as NSString).draw(at: CGPoint(x: 42, y: y), withAttributes: attributes); y += 28
                ("第 \(page) 页" as NSString).draw(at: CGPoint(x: 42, y: bounds.height - 34), withAttributes: [.font: UIFont.systemFont(ofSize: 10), .foregroundColor: UIColor.gray])
            }
            // TextKit splits even a single task taller than one page without cutting off text.
            func drawText(_ text: String, date: String) {
                let storage = NSTextStorage(string: text, attributes: attributes)
                let manager = NSLayoutManager(); storage.addLayoutManager(manager)
                var previousEnd = 0
                while previousEnd < manager.numberOfGlyphs {
                    if bottom - y < 24 { newPage(date + " · 续") }
                    let container = NSTextContainer(size: CGSize(width: width, height: bottom - y))
                    container.lineFragmentPadding = 0; manager.addTextContainer(container)
                    let range = manager.glyphRange(for: container)
                    guard range.length > 0 else { break }
                    manager.drawBackground(forGlyphRange: range, at: CGPoint(x: 42, y: y))
                    manager.drawGlyphs(forGlyphRange: range, at: CGPoint(x: 42, y: y))
                    y += manager.usedRect(for: container).height + 14
                    previousEnd = NSMaxRange(range)
                    if previousEnd < manager.numberOfGlyphs { newPage(date + " · 续") }
                }
            }
            for date in dates {
                newPage(date)
                let tasks = state.tasks(date)
                drawText("共 \(tasks.count) 项 · 预计 \(tasks.reduce(0) { $0 + $1.estimatedMinutes }) 分钟", date: date)
                if tasks.isEmpty { drawText("这一天没有安排作业。", date: date) }
                for (index, task) in tasks.enumerated() {
                    let status = task.status == "done" ? "已完成" : task.status == "active" ? "进行中" : task.status == "paused" ? "已暂停" : "未开始"
                    drawText("\(index + 1). 【\(task.subject)】\(task.title)\n预计 \(task.estimatedMinutes) 分钟 · \(status)", date: date)
                }
            }
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    var items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController { UIActivityViewController(activityItems: items, applicationActivities: nil) }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) { }
}

struct PlanExportView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    let start: String
    let end: String
    let selected: String
    @State private var entire = false
    @State private var exporting = false
    @State private var sharing = false
    @State private var document = ExportDocument()
    @State private var shareURL: URL?
    @State private var temporaryDirectory: URL?
    var body: some View {
        NavigationStack {
            Form {
                Picker("导出范围", selection: $entire) { Text("当前一天 · \(selected)").tag(false); Text("整个计划 · \(start) 至 \(end)").tag(true) }
                Button("保存 PDF 文件") { if prepare() { exporting = true } }
                Button("打印 / 分享") {
                    guard prepare() else { return }
                    do {
                        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
                        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
                        let url = directory.appendingPathComponent("作业计划.pdf")
                        try document.data.write(to: url, options: .atomic)
                        temporaryDirectory = directory; shareURL = url; sharing = true
                    } catch { store.error = error.localizedDescription }
                }
                Text("使用系统分享菜单中的“打印”，选择打印机或保存文件。导出包含原有顺序、预计用时和任务状态，不会修改作业记录。")
                    .font(.caption).foregroundStyle(.secondary)
            }.navigationTitle("下载 / 打印").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("返回") { dismiss() } } }
        }
        .fileExporter(isPresented: $exporting, document: document, contentType: .pdf, defaultFilename: "作业计划-\(selected).pdf") { result in
            if case .failure(let error) = result { store.error = error.localizedDescription }
        }
        .sheet(isPresented: $sharing, onDismiss: cleanup) { if let url = shareURL { ShareSheet(items: [url]) } }
        .onDisappear { if !sharing { cleanup() } }
    }
    private func prepare() -> Bool {
        do { document = ExportDocument(data: try PlanPDF.make(state: store.state, dates: entire ? Day.range(start, end) : [selected])); return true }
        catch { store.error = error.localizedDescription; return false }
    }
    private func cleanup() {
        if let directory = temporaryDirectory { try? FileManager.default.removeItem(at: directory) }
        temporaryDirectory = nil; shareURL = nil
    }
}
