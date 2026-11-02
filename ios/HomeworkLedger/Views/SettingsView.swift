import SwiftUI
import UniformTypeIdentifiers

struct ExportDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json, .pdf] }
    var data: Data
    init(data: Data = Data()) { self.data = data }
    init(configuration: ReadConfiguration) throws { data = configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

struct SettingsView: View {
    @EnvironmentObject private var store: LedgerStore
    var body: some View {
        Form {
            Section("查看日期") {
                DatePicker("当前日期", selection: Binding(get: { Day.date(store.selectedDate) ?? Date() }, set: { store.selectedDate = Day.key($0) }), displayedComponents: .date)
                Button("回到今天") { store.selectedDate = Day.key() }
            }
            Section {
                NavigationLink("作业关键词") { KeywordSettingsView() }
                NavigationLink("休息结束提醒") { AlarmSettingsView(audio: store.audio, reminders: store.reminders) }
                NavigationLink("数据备份") { BackupView() }
            }
            Section("奖罚规则") {
                LabeledContent("20:30 及以前", value: "+¥1.50")
                LabeledContent("20:30 后至 20:40", value: "+¥1.00")
                LabeledContent("20:40 后至 21:30", value: "¥0.00")
                LabeledContent("21:30 以后", value: "−¥0.50")
                Text("按最后一项作业的完成时间结算，习惯打卡不改变结算金额。所有日期使用同一规则。")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Section("本机数据") {
                Text("作业和录音保存在这台设备，不会自动同步到其他设备。删除应用会同时删除这些数据。")
                NavigationLink("管理历史记录") { RecordManagementView() }
            }
        }.navigationTitle("设置").navigationBarTitleDisplayMode(.inline)
    }
}

struct BackupView: View {
    @EnvironmentObject private var store: LedgerStore
    @State private var importing = false
    @State private var exporting = false
    @State private var document = ExportDocument()
    @State private var pendingImport: Data?
    @State private var confirmingImport = false
    @State private var confirmingSnapshot = false
    var body: some View {
        Form {
            Section("本地 JSON 备份") {
                Button("导出全部记录") {
                    do { document = ExportDocument(data: try Backup(state: store.state).data()); exporting = true }
                    catch { store.error = error.localizedDescription }
                }
                Button("从文件恢复备份") { importing = true }
                Text("与网页版和安卓使用相同备份格式，包含作业、计划、打卡和自定义词语。听写录音与休息提示音不包含在内。")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Section("导入前快照") {
                if let snapshot = store.disk.snapshot {
                    Text("保存于 \(snapshot.savedAt.formatted(date: .abbreviated, time: .shortened))")
                    Button("恢复到上次导入前") { confirmingSnapshot = true }
                } else { Text("每次导入前自动保存，只保留最近一份。") }
            }
        }.navigationTitle("数据备份")
        .fileExporter(isPresented: $exporting, document: document, contentType: .json, defaultFilename: "作业小计划备份-\(Day.key()).json") { result in
            if case .failure(let error) = result { store.error = error.localizedDescription }
        }
        .fileImporter(isPresented: $importing, allowedContentTypes: [.json]) { result in
            do {
                let url = try result.get(), access = url.startAccessingSecurityScopedResource()
                defer { if access { url.stopAccessingSecurityScopedResource() } }
                let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
                guard size <= 32 * 1024 * 1024 else { throw LedgerError("备份文件超过 32 MB") }
                let data = try Data(contentsOf: url)
                _ = try Backup.read(data); pendingImport = data; confirmingImport = true
            } catch { store.error = error.localizedDescription }
        }
        .confirmationDialog("恢复备份会替换当前全部记录，导入前会保存一份快照。继续吗？", isPresented: $confirmingImport, titleVisibility: .visible) {
            Button("恢复备份", role: .destructive) { if let data = pendingImport { store.restore(data) }; pendingImport = nil }
            Button("取消", role: .cancel) { pendingImport = nil }
        }
        .confirmationDialog("恢复到上次导入前会替换当前记录。继续吗？", isPresented: $confirmingSnapshot, titleVisibility: .visible) {
            Button("恢复快照", role: .destructive) { store.restoreSnapshot() }
            Button("取消", role: .cancel) { }
        }
    }
}

struct AlarmSettingsView: View {
    @EnvironmentObject private var store: LedgerStore
    @ObservedObject var audio: AudioService
    @ObservedObject var reminders: ReminderService
    @Environment(\.openURL) private var openURL
    var body: some View {
        Form {
            Section("自定义提示音") {
                Text(audio.hasRecording(AudioService.alarmKey) ? "已保存自定义提示音" : "未录音时提示“作业时间到啦”")
                if audio.recordingKey != nil { Button("停止并试听") { audio.finishRecording() } }
                else { Button(audio.hasRecording(AudioService.alarmKey) ? "重新录制" : "开始录音") { audio.record(AudioService.alarmKey) } }
                Button("试听提醒") { audio.playAlarm() }.disabled(audio.recordingKey != nil)
                if audio.hasRecording(AudioService.alarmKey) { Button("删除提示音", role: .destructive) { audio.delete(AudioService.alarmKey) } }
                Text("最长录制 10 秒，停止后自动试听。离开本页会停止录音和试听。")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Section("锁屏提醒") {
                Text(reminders.permissionText)
                Button("允许通知提醒") { reminders.requestPermission() }
                Button("打开系统设置") { if let url = URL(string: UIApplication.openSettingsURLString) { openURL(url) } }
                Text("通知声音受系统静音和专注模式影响。未录制自定义提示音时，锁屏使用系统提示音；应用内会读出提醒。")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }.navigationTitle("休息结束提醒")
        .onAppear { reminders.readPermission() }
        .onDisappear { audio.stopAll(); reminders.refresh(store.disk.session) }
        .alert("录音或提醒未完成", isPresented: Binding(get: { audio.error != nil || reminders.error != nil }, set: { if !$0 { audio.error = nil; reminders.error = nil } })) {
            Button("知道了") { audio.error = nil; reminders.error = nil }
        } message: { Text(audio.error ?? reminders.error ?? "") }
    }
}

struct KeywordSettingsView: View {
    @EnvironmentObject private var store: LedgerStore
    @State private var subject = "语文"
    @State private var label = ""
    var body: some View {
        List {
            Picker("科目", selection: $subject) { ForEach(LedgerState.subjects, id: \.self) { Text($0) } }.pickerStyle(.segmented)
            ForEach(Array(store.state.keywords(subject).enumerated()), id: \.offset) { index, keyword in
                HStack {
                    Text(keyword.text("label")); Spacer()
                    Button(keyword["visible"]?.bool == false ? "已隐藏" : "显示中") {
                        update { $0[index].set("visible", $0[index]["visible"]?.bool == false) }
                    }
                    Button { update { $0.swapAt(index, index - 1) } } label: { Image(systemName: "arrow.up") }.disabled(index == 0)
                    Button { update { $0.swapAt(index, index + 1) } } label: { Image(systemName: "arrow.down") }.disabled(index + 1 == store.state.keywords(subject).count)
                }.buttonStyle(.borderless)
            }.onDelete { offsets in update { list in for index in offsets.sorted(by: >) { list.remove(at: index) } } }
            HStack {
                TextField("添加关键词", text: $label)
                Button("添加") {
                    let text = label.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !text.isEmpty else { return }
                    if store.state.keywords(subject).contains(where: { $0.text("label") == text }) { store.error = "这个关键词已经有了"; return }
                    update { $0.append(["id": .string(UUID().uuidString), "label": .string(text), "visible": .bool(true)]) }; label = ""
                }
            }
        }.navigationTitle("作业关键词")
    }
    private func update(_ change: (inout [JSONObject]) -> Void) {
        var keywords = store.state.keywords(subject); change(&keywords)
        store.change { $0.setKeywords(subject, keywords) }
    }
}

struct RecordManagementView: View {
    @EnvironmentObject private var store: LedgerStore
    @State private var deleting: String?
    var body: some View {
        List {
            Text("删除某天会同时删除该天作业、打卡和结算。建议先导出备份。")
            ForEach(store.state.records.keys.sorted(by: >), id: \.self) { date in
                HStack { Text(date); Spacer(); Button("删除", role: .destructive) { deleting = date } }
            }
        }.navigationTitle("管理历史记录")
        .confirmationDialog("删除这一天的记录？", isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } })) {
            Button("删除", role: .destructive) {
                if let date = deleting { store.transaction { next in
                    guard next.state.activeTask?.date != date, next.session?.date != date else { throw LedgerError("请先结束这一天的计时或提醒") }
                    var records = next.state.records; records.removeValue(forKey: date); next.state.raw["records"] = .object(records)
                } }; deleting = nil
            }
            Button("取消", role: .cancel) { deleting = nil }
        }
    }
}
