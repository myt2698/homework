import Foundation
import Combine

struct StartChoice: Identifiable {
    var id: String
    var date: String
}

@MainActor
final class LedgerStore: ObservableObject {
    @Published private(set) var disk = DiskState()
    @Published var selectedDate = Day.key()
    @Published var error: String?
    @Published var startChoice: StartChoice?
    @Published var now = Date()
    @Published private(set) var undoCompletionAvailable = false
    @Published private(set) var undoDeleteAvailable = false
    let lessons: [Lesson]
    let audio = AudioService()
    let reminders = ReminderService()
    private let fileURL: URL
    private var loadFailed = false
    private var lastAlarm: Date?
    private var completedUndo: (date: String, task: HomeworkTask, expires: Date)?
    private var deletedUndo: (date: String, task: HomeworkTask, index: Int, expires: Date)?
    var state: LedgerState { disk.state }
    var tasks: [HomeworkTask] { state.tasks(selectedDate) }

    init() {
        let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("HomeworkLedger", isDirectory: true)
        fileURL = directory.appendingPathComponent("ledger.json")
        do {
            guard let url = Bundle.main.url(forResource: "lessons", withExtension: "json") else { throw LedgerError("内置词表缺失") }
            lessons = try JSONDecoder().decode([Lesson].self, from: Data(contentsOf: url))
        } catch { lessons = []; self.error = "内置词表读取失败：\(error.localizedDescription)" }
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            if FileManager.default.fileExists(atPath: fileURL.path) {
                disk = try JSONDecoder().decode(DiskState.self, from: Data(contentsOf: fileURL))
                guard disk.version == 1 else { throw LedgerError("本机数据版本不支持") }
            }
            if let active = state.activeTask { selectedDate = active.date }
            else if let session = disk.session { selectedDate = session.date }
        } catch {
            loadFailed = true
            self.error = "本机数据读取失败，原文件已保留。请在设置中恢复有效备份。\(error.localizedDescription)"
        }
        reminders.configure()
        reminders.refresh(disk.session)
    }

    @discardableResult
    func change(_ update: (inout LedgerState) throws -> Void) -> Bool {
        transaction { try update(&$0.state) }
    }
    @discardableResult
    func transaction(recover: Bool = false, _ update: (inout DiskState) throws -> Void) -> Bool {
        guard !loadFailed || recover else { error = "请先通过设置恢复备份，原数据文件暂不覆盖"; return false }
        var next = disk
        do {
            try update(&next)
            let data = try JSONEncoder().encode(next)
            if loadFailed {
                let recovery = fileURL.deletingPathExtension().appendingPathExtension("unreadable-\(UUID().uuidString).json")
                if FileManager.default.fileExists(atPath: fileURL.path) { try FileManager.default.copyItem(at: fileURL, to: recovery) }
            }
            try data.write(to: fileURL, options: .atomic)
            let changedSession = next.session != disk.session
            disk = next; loadFailed = false
            if changedSession { lastAlarm = nil; audio.stopAlarm(); reminders.refresh(next.session) }
            return true
        } catch { self.error = "保存失败，当前记录未替换。\(error.localizedDescription)"; return false }
    }
    func tick() {
        now = Date()
        undoCompletionAvailable = completedUndo.map { now < $0.expires } ?? false
        undoDeleteAvailable = deletedUndo.map { now < $0.expires } ?? false
        if let session = disk.session, session.endAt <= now,
           lastAlarm == nil || now.timeIntervalSince(lastAlarm!) >= 300 {
            lastAlarm = now; audio.playAlarm()
        }
    }
    func becameActive() { tick(); reminders.refresh(disk.session) }
    func chooseStart(_ task: HomeworkTask, date: String) { startChoice = StartChoice(id: task.id, date: date) }
    func start(_ id: String, date: String) {
        let stamp = Date()
        if transaction({ next in
            Self.finishRest(&next, now: stamp)
            try next.state.start(date: date, id: id, now: stamp); next.session = nil
        }) {
            selectedDate = date; startChoice = nil; completedUndo = nil; undoCompletionAvailable = false
        }
    }
    func schedule(_ id: String, date: String, at end: Date) {
        if end <= Date() { start(id, date: date); return }
        let stamp = Date()
        if transaction({ next in
            guard next.state.tasks(date).contains(where: { $0.id == id && $0.status != "done" }), date <= Day.key(),
                  next.state.record(date).flag("tasksConfirmed"), next.state.activeTask == nil else {
                throw LedgerError("请先确认清单，并完成或暂停正在做的作业")
            }
            next.session = ReminderSession(kind: "start", date: date, taskID: id, endAt: end, startedAt: stamp)
        }) { startChoice = nil; reminders.requestPermission() }
    }
    func beginRest(until end: Date, kind: String = "short") {
        guard let active = state.activeTask else { return }
        let stamp = Date(), logID = UUID().uuidString
        if transaction({ next in
            guard end > stamp else { throw LedgerError("请选择晚于现在的返回时间") }
            try next.state.pause(date: active.date, id: active.task.id, now: stamp)
            next.state.updateRecord(active.date) { record in
                let log: JSONObject = ["id": .string(logID), "kind": .string(kind), "taskId": .string(active.task.id),
                    "sourceTaskId": .string(active.task.id), "nextTaskId": .string(active.task.id), "trigger": .string("pause"),
                    "kindLabel": .string(kind == "dinner" ? "吃饭" : "休息"), "startedAt": .number(Day.ms(stamp)),
                    "plannedEndAt": .number(Day.ms(end)), "plannedMinutes": .number(ceil(end.timeIntervalSince(stamp) / 60)),
                    "plannedReturnAt": .string(Day.time(end)), "status": .string("resting"), "extended": .bool(false)]
                record["breaks"] = .array(record.array("breaks") + [.object(log)])
            }
            next.session = ReminderSession(kind: "rest", date: active.date, taskID: active.task.id,
                                           endAt: end, startedAt: stamp, logID: logID)
        }) { reminders.requestPermission() }
    }
    private static func finishRest(_ next: inout DiskState, now: Date) {
        guard let session = next.session, session.kind == "rest", let id = session.logID else { return }
        next.state.updateRecord(session.date) { record in
            record["breaks"] = .array(record.array("breaks").map { value in
                guard var log = value.object, log.text("id") == id else { return value }
                let actual = max(1, ceil(now.timeIntervalSince(session.startedAt) / 60))
                log.set("actualEndAt", Day.ms(now)); log.set("actualMinutes", actual)
                log.set("actualReturnAt", Day.time(now)); log.set("overtimeMinutes", max(0, actual - log.number("plannedMinutes")))
                log.set("status", "returned"); log.set("extended", session.extended)
                return .object(log)
            })
        }
    }
    func extendRest() {
        transaction { next in
            guard var session = next.session, session.kind == "rest", !session.extended else { throw LedgerError("本次休息已经延长过了") }
            session.endAt = max(session.endAt, Date()).addingTimeInterval(180); session.extended = true
            next.session = session
            next.state.updateRecord(session.date) { record in
                record["breaks"] = .array(record.array("breaks").map { value in
                    guard var log = value.object, log.text("id") == session.logID else { return value }
                    log.set("plannedEndAt", Day.ms(session.endAt)); log.set("extended", true)
                    log.set("plannedReturnAt", Day.time(session.endAt))
                    log.set("plannedMinutes", ceil(session.endAt.timeIntervalSince(session.startedAt) / 60))
                    return .object(log)
                })
            }
        }
    }
    func cancelSchedule() { transaction { $0.session = nil } }
    func skip() {
        guard let active = state.activeTask else { return }
        let list = state.tasks(active.date), after = list.firstIndex(where: { $0.id == active.task.id }) ?? 0
        let rotated = Array(list.dropFirst(after + 1)) + Array(list.prefix(after))
        guard let nextTask = rotated.first(where: { $0.status != "done" }) else { return }
        start(nextTask.id, date: active.date)
    }
    func complete() {
        guard let active = state.activeTask else { return }
        let stamp = Date()
        var previous: HomeworkTask?
        if transaction({ next in previous = try next.state.complete(date: active.date, id: active.task.id, now: stamp); next.session = nil }), let task = previous {
            completedUndo = (active.date, task, stamp.addingTimeInterval(8)); undoCompletionAvailable = true
            if let next = state.tasks(active.date).first(where: { $0.status != "done" }) { chooseStart(next, date: active.date) }
        }
    }
    func undoComplete() {
        guard let undo = completedUndo, Date() < undo.expires else { return }
        if transaction({ next in try next.state.undoCompletion(date: undo.date, task: undo.task); next.session = nil }) {
            completedUndo = nil; undoCompletionAvailable = false; startChoice = nil
        }
    }
    func deleteTask(_ task: HomeworkTask, date: String) {
        var removed: (HomeworkTask, Int)?
        if change({ removed = try $0.remove(date: date, id: task.id) }), let removed = removed {
            deletedUndo = (date, removed.0, removed.1, Date().addingTimeInterval(15)); undoDeleteAvailable = true
        }
    }
    func undoDelete() {
        guard let undo = deletedUndo, Date() < undo.expires else { return }
        if change({ state in
            var tasks = state.tasks(undo.date)
            guard !tasks.contains(where: { $0.id == undo.task.id }) else { throw LedgerError("这项作业已存在") }
            tasks.insert(undo.task, at: min(undo.index, tasks.count)); state.setTasks(undo.date, tasks)
        }) { deletedUndo = nil; undoDeleteAvailable = false }
    }
    func restore(_ data: Data) {
        do {
            let restored = try Backup.read(data)
            if transaction(recover: true, { next in
                next.snapshot = Snapshot(savedAt: Date(), state: next.state)
                next.state = restored; next.session = nil
            }) { resetAfterImport() }
        } catch { self.error = error.localizedDescription }
    }
    func restoreSnapshot() {
        guard let snapshot = disk.snapshot else { return }
        do {
            let restored = try Backup.read(Backup(state: snapshot.state, at: snapshot.savedAt).data())
            if transaction({ $0.state = restored; $0.session = nil }) { resetAfterImport() }
        } catch { self.error = error.localizedDescription }
    }
    private func resetAfterImport() {
        selectedDate = Day.key(); startChoice = nil; completedUndo = nil; deletedUndo = nil
        undoCompletionAvailable = false; undoDeleteAvailable = false; audio.stopAll()
    }
    func words(_ lesson: Lesson) -> [String] { lesson.words + state.customWords(lesson.id) }
    func selectLesson(_ id: String) { change { $0.raw.set("dictationLesson", id) } }
    func addWord(_ text: String, lesson: Lesson) {
        let word = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !word.isEmpty, word.count <= 40 else { error = "请输入 1 到 40 个字"; return }
        change { state in
            guard !(lesson.words + state.customWords(lesson.id)).contains(word) else { throw LedgerError("这个词语已经有了") }
            var custom = state.raw.object("dictationCustom")
            custom[lesson.id] = .array(state.customWords(lesson.id).map(JSONValue.string) + [.string(word)])
            state.raw["dictationCustom"] = .object(custom)
        }
    }
}
