import Foundation

struct LedgerState: Codable, Equatable {
    var raw: JSONObject
    init(raw: JSONObject? = nil) {
        self.raw = raw ?? ["records": .object([:]), "weekends": .object([:]), "holidays": .object([:]),
                           "planningVersion": .number(2), "dictationCustom": .object([:]),
                           "dictationLesson": .string("lesson-1"), "taskKeywords": .object(Self.defaultKeywords)]
    }
    init(from decoder: Decoder) throws { raw = try JSONObject(from: decoder) }
    func encode(to encoder: Encoder) throws { try raw.encode(to: encoder) }
    static let subjects = ["语文", "数学", "英语", "科学"]
    static let estimateOptions = [5, 10, 15, 20, 30, 35, 40, 45, 50, 60]
    static let sports = ["跳绳", "踢毽子", "坐位体前屈", "50米", "仰卧起坐"]
    static let habits = [("sportDone", "运动打卡"), ("readingDone", "中文阅读"),
                         ("mathThinkingDone", "数学思维"), ("englishReadingDone", "英文阅读")]
    static let defaultKeywords: JSONObject = {
        let labels = [["背诵", "默写", "生抄本", "作文", "小练习", "预习", "小古文", "订正", "朗读"],
                      ["口算", "课作本", "书本", "小练习", "订正"], ["校本", "预习课本", "复习"], []]
        var result: JSONObject = ["_defaultsVersion": .number(2)]
        for (i, subject) in subjects.enumerated() {
            result[subject] = .array(labels[i].enumerated().map { index, label in
                .object(["id": .string("builtin-\(i)-\(index)"), "label": .string(label), "visible": .bool(true)])
            })
        }
        return result
    }()

    var records: JSONObject { raw.object("records") }
    func record(_ date: String) -> JSONObject { records.object(date) }
    func tasks(_ date: String) -> [HomeworkTask] { record(date).array("tasks").compactMap { $0.object.map(HomeworkTask.init) } }
    mutating func updateRecord(_ date: String, _ change: (inout JSONObject) throws -> Void) rethrows {
        var records = self.records, record = records.object(date)
        try change(&record)
        records[date] = .object(record); raw["records"] = .object(records)
    }
    mutating func setTasks(_ date: String, _ tasks: [HomeworkTask]) {
        updateRecord(date) { $0["tasks"] = .array(tasks.map { .object($0.raw) }) }
    }
    func habitDone(_ field: String, on date: String) -> Bool {
        let r = record(date)
        guard field == "sportDone", r["sportDone"] == nil else { return r.flag(field) }
        if r["sportActivities"] != nil {
            return r.array("sportActivities").compactMap(\.string).contains { Self.sports.contains($0) || $0 == "50米跑" }
        }
        return r.flag("ropeDone")
    }
    mutating func toggleHabit(_ field: String, on date: String, now: Date) {
        let checked = !habitDone(field, on: date)
        updateRecord(date) { r in
            r.set(field, checked)
            if checked { r.set(field + "At", Day.time(now)) } else { r.removeValue(forKey: field + "At") }
        }
    }
    func planEnd(_ start: String) -> String {
        let matches = raw.object("holidays").values.compactMap(\.object)
            .filter { $0.text("planDate") <= start && start <= $0.text("end") }
            .sorted { $0.text("planDate") > $1.text("planDate") }
        return matches.first?.text("end") ?? start
    }
    mutating func setRange(start: String, count: Int) throws {
        guard Day.date(start) != nil, (1...366).contains(count) else { throw LedgerError("请选择 1 到 366 天") }
        var plans = raw.object("holidays"), plan = plans.object("plan-" + start)
        plan.set("id", "plan-" + start); plan.set("name", "作业计划")
        plan.set("start", start); plan.set("planDate", start); plan.set("end", Day.plus(start, count - 1))
        plan.set("unified", true); plans["plan-" + start] = .object(plan); raw["holidays"] = .object(plans)
    }
    static func clearSettlement(_ record: inout JSONObject) {
        for key in ["tasksFinishedAt", "finishTime", "ruleId", "legacyWeekendSettlement"] { record.removeValue(forKey: key) }
    }
    mutating func add(title: String, subject: String, minutes: Int, dates: [String], planStart: String, repeatTask: Bool, now: Date) throws {
        let drafts = TaskDraft.parse(title, subject: subject)
        guard !drafts.isEmpty, dates.allSatisfy({ Day.date($0) != nil }), !dates.isEmpty, Self.estimateOptions.contains(minutes) else {
            throw LedgerError("请填写作业、预计用时和有效日期")
        }
        let end = raw.object("holidays").object("plan-" + planStart).text("end", planStart)
        guard dates.allSatisfy({ planStart <= $0 && $0 <= end }) else { throw LedgerError("作业日期应在计划范围内") }
        for draft in drafts {
            let series = UUID().uuidString
            for (sequence, date) in Set(dates).sorted().enumerated() {
                let task: JSONObject = ["id": .string(UUID().uuidString), "title": .string(draft.title),
                    "subject": .string(draft.subject), "estimatedMinutes": .number(Double(minutes)),
                    "status": .string("pending"), "elapsedMs": .number(0), "addedAt": .number(Day.ms(now)),
                    "addedSequence": .number(Double(sequence)), "holidayId": .string("plan-" + planStart),
                    "holidaySeriesId": .string(repeatTask ? series : ""), "holidayOriginalDate": .string(date)]
                updateRecord(date) { record in
                    record["tasks"] = .array(record.array("tasks") + [.object(task)])
                    record.removeValue(forKey: "orderDraft"); Self.clearSettlement(&record)
                }
            }
        }
    }
    mutating func edit(date: String, id: String, title: String, minutes: Int, series: Bool = false, today: String = Day.key()) throws {
        var list = tasks(date)
        guard let index = list.firstIndex(where: { $0.id == id }), list[index].status == "pending",
              !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, Self.estimateOptions.contains(minutes) else {
            throw LedgerError("只能修改尚未开始的作业，请填写内容和预计用时")
        }
        let group = list[index].raw.text("holidaySeriesId"), plan = list[index].raw.text("holidayId")
        if series && !group.isEmpty {
            var count = 0
            for targetDate in records.keys.sorted() where targetDate >= date && targetDate >= today {
                var targets = tasks(targetDate)
                for index in targets.indices where targets[index].untouched && targets[index].raw.text("holidaySeriesId") == group && targets[index].raw.text("holidayId") == plan {
                    targets[index].raw.set("title", title.trimmingCharacters(in: .whitespacesAndNewlines))
                    targets[index].raw.set("estimatedMinutes", Double(minutes)); targets[index].raw.removeValue(forKey: "steps"); count += 1
                }
                setTasks(targetDate, targets)
            }
            guard count > 0 else { throw LedgerError("没有可修改的未来作业，可关闭批量修改后单独修改这一项") }
            return
        }
        list[index].raw.set("title", title.trimmingCharacters(in: .whitespacesAndNewlines))
        list[index].raw.set("estimatedMinutes", Double(minutes)); list[index].raw.removeValue(forKey: "steps")
        setTasks(date, list)
    }
    mutating func remove(date: String, id: String) throws -> (HomeworkTask, Int) {
        var list = tasks(date)
        guard let index = list.firstIndex(where: { $0.id == id }), list[index].untouched else {
            throw LedgerError("已开始或已完成的作业保留原记录")
        }
        let task = list.remove(at: index); setTasks(date, list)
        updateRecord(date) { $0.removeValue(forKey: "orderDraft") }
        return (task, index)
    }
    mutating func move(id: String, from: String, to: String) throws {
        guard from != to else { return }
        var source = tasks(from), target = tasks(to)
        guard Day.date(to) != nil, let index = source.firstIndex(where: { $0.id == id }),
              !["active", "done"].contains(source[index].status) else { throw LedgerError("请先暂停作业；已完成的记录不能改期") }
        let empty = target.isEmpty
        target.append(source.remove(at: index)); setTasks(from, source); setTasks(to, target)
        updateRecord(from) { $0.removeValue(forKey: "orderDraft") }
        updateRecord(to) {
            Self.clearSettlement(&$0); $0.removeValue(forKey: "orderDraft")
            if empty { $0.set("tasksConfirmed", true); $0.set("orderSaved", true) }
        }
    }
    mutating func order(date: String, ids: [String], pendingOnly: Bool) throws {
        var list = tasks(date)
        let eligible = list.filter { !pendingOnly || $0.untouched }
        guard ids.count == eligible.count, Set(ids).count == ids.count, Set(ids) == Set(eligible.map(\.id)) else {
            throw LedgerError("请依次选完全部可调整作业")
        }
        let lookup = Dictionary(uniqueKeysWithValues: eligible.map { ($0.id, $0) })
        var cursor = 0
        for index in list.indices where !pendingOnly || list[index].untouched {
            list[index] = lookup[ids[cursor]]!; cursor += 1
        }
        setTasks(date, list); updateRecord(date) { $0.set("orderSaved", true); $0.removeValue(forKey: "orderDraft") }
    }
    mutating func confirm(_ date: String) {
        updateRecord(date) { $0.set("tasksConfirmed", true); $0.set("orderSaved", true); $0.removeValue(forKey: "orderDraft") }
    }
    var activeTask: (date: String, task: HomeworkTask)? {
        for date in records.keys.sorted() { if let task = tasks(date).first(where: { $0.status == "active" }) { return (date, task) } }
        return nil
    }
    mutating func pause(date: String, id: String, now: Date) throws {
        var list = tasks(date)
        guard let index = list.firstIndex(where: { $0.id == id }), list[index].status == "active" else { throw LedgerError("这项作业没有正在计时") }
        list[index].raw.set("elapsedMs", list[index].elapsed(at: now)); list[index].raw.set("status", "paused")
        list[index].raw.removeValue(forKey: "activeSince"); setTasks(date, list)
    }
    mutating func start(date: String, id: String, now: Date) throws {
        guard date <= Day.key(now), record(date).flag("tasksConfirmed") else { throw LedgerError("请先确认清单，未来日期的作业到当天再开始") }
        if let active = activeTask { try pause(date: active.date, id: active.task.id, now: now) }
        var list = tasks(date)
        guard let index = list.firstIndex(where: { $0.id == id }), list[index].status != "done" else { throw LedgerError("未找到可开始的作业") }
        if list[index].raw.text("startedAt").isEmpty { list[index].raw.set("startedAt", Day.time(now)) }
        list[index].raw.set("status", "active"); list[index].raw.set("activeSince", Day.ms(now))
        list[index].raw.set("lastWorkedDate", Day.key(now)); setTasks(date, list)
        updateRecord(date) { if $0.text("startTime").isEmpty { $0.set("startTime", Day.time(now)) } }
    }
    mutating func complete(date: String, id: String, now: Date) throws -> HomeworkTask {
        var list = tasks(date)
        guard let index = list.firstIndex(where: { $0.id == id }), list[index].status != "done" else { throw LedgerError("未找到待完成的作业") }
        let previous = list[index]
        list[index].raw.set("elapsedMs", list[index].elapsed(at: now)); list[index].raw.set("status", "done")
        list[index].raw.removeValue(forKey: "activeSince")
        list[index].raw.set("completedAt", Day.time(now)); list[index].raw.set("completedDate", date)
        setTasks(date, list)
        if list.allSatisfy({ $0.status == "done" }) {
            updateRecord(date) { r in
                Self.clearSettlement(&r); r.set("tasksFinishedAt", Day.time(now)); r.set("finishTime", Day.time(now))
            }
        }
        return previous
    }
    mutating func undoCompletion(date: String, task: HomeworkTask) throws {
        var list = tasks(date)
        guard let index = list.firstIndex(where: { $0.id == task.id }), list[index].status == "done", activeTask == nil else {
            throw LedgerError("开始下一项后不能使用快捷撤销")
        }
        list[index] = task; setTasks(date, list)
        updateRecord(date) { Self.clearSettlement(&$0) }
    }
    mutating func reopen(date: String, id: String) throws {
        var list = tasks(date)
        guard let index = list.firstIndex(where: { $0.id == id }), list[index].status == "done" else { throw LedgerError("这项作业尚未完成") }
        list[index].raw.set("status", "paused")
        for key in ["completedAt", "completedDate", "activeSince"] { list[index].raw.removeValue(forKey: key) }
        setTasks(date, list); updateRecord(date) { Self.clearSettlement(&$0) }
    }
    func keywords(_ subject: String) -> [JSONObject] {
        let source = raw["taskKeywords"]?.object ?? Self.defaultKeywords
        return source.array(subject).enumerated().compactMap { index, value in
            if let object = value.object { return object }
            return value.string.map { ["id": .string("legacy-\(index)"), "label": .string($0), "visible": .bool(true)] }
        }
    }
    mutating func setKeywords(_ subject: String, _ list: [JSONObject]) {
        var keywords = raw["taskKeywords"]?.object ?? Self.defaultKeywords
        keywords[subject] = .array(list.map(JSONValue.object)); raw["taskKeywords"] = .object(keywords)
    }
    func customWords(_ lesson: String) -> [String] { raw.object("dictationCustom").array(lesson).compactMap(\.string) }
    mutating func normalizeKeywords() {
        let original = raw.object("taskKeywords")
        var result = original
        for subject in Self.subjects {
            let values = original[subject]?.array ?? Self.defaultKeywords.array(subject)
            var seen = Set<String>(), normalized: [JSONObject] = []
            for (index, value) in values.enumerated() {
                var keyword = value.object ?? ["label": .string(value.string ?? "")]
                let label = keyword.text("label").trimmingCharacters(in: .whitespacesAndNewlines)
                guard !label.isEmpty, seen.insert(label).inserted else { continue }
                keyword.set("label", label)
                if keyword.text("id").isEmpty { keyword.set("id", "keyword-\(subject)-\(index)") }
                keyword.set("visible", keyword["visible"]?.bool != false); normalized.append(keyword)
            }
            let missingDefault = subject == "数学" && original.number("_defaultsVersion") < 1 ? "订正" : subject == "英语" && original.number("_defaultsVersion") < 2 ? "复习" : ""
            if !missingDefault.isEmpty && !seen.contains(missingDefault) {
                normalized.append(["id": .string("migrated-" + subject), "label": .string(missingDefault), "visible": .bool(true)])
            }
            result[subject] = .array(normalized.map(JSONValue.object))
        }
        result.set("_defaultsVersion", 2.0); raw["taskKeywords"] = .object(result)
    }
    var meaningfulDates: [String] {
        records.keys.filter { date in
            let r = record(date)
            return !tasks(date).isEmpty || !r.array("sportActivities").isEmpty
                || ["sportDone", "ropeDone", "ledgerConfirmed", "readingDone", "mathThinkingDone", "englishReadingDone", "choresDone", "tasksConfirmed"].contains { r.flag($0) }
                || ["note", "ruleId", "startTime", "dinnerTime", "resumeTime", "finishTime"].contains { !r.text($0).isEmpty }
        }.sorted(by: >)
    }
}

enum TaskDraft {
    static func parse(_ input: String, subject: String) -> [(subject: String, title: String)] {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return [] }
        let pattern = #"(^|[\s；;])(?:（\s*(\d{1,2})\s*）|\(?(\d{1,2})\s*[.．、)])\s*"#
        let regex = try! NSRegularExpression(pattern: pattern, options: .anchorsMatchLines)
        let ns = text as NSString
        let matches = regex.matches(in: text, range: NSRange(location: 0, length: ns.length))
        var sequence: [NSTextCheckingResult] = []
        for match in matches {
            let range = match.range(at: match.range(at: 2).location == NSNotFound ? 3 : 2)
            let number = Int(ns.substring(with: range)) ?? 0
            if sequence.isEmpty && number != 1 { continue }
            if number != sequence.count + 1 { break }
            sequence.append(match)
        }
        let parts: [String]
        if sequence.isEmpty {
            let subjectExpression = try! NSRegularExpression(pattern: "(语文|数学|英语|科学|道法|体育|音乐|美术|其他)(?:作业)?")
            let normalized = subjectExpression.stringByReplacingMatches(in: text, range: NSRange(text.startIndex..., in: text), withTemplate: "\n$1：")
            parts = normalized.components(separatedBy: CharacterSet(charactersIn: "\n；;"))
        }
        else { parts = sequence.enumerated().map { index, match in
            let start = NSMaxRange(match.range), end = index + 1 < sequence.count ? sequence[index + 1].range.location : ns.length
            return ns.substring(with: NSRange(location: start, length: end - start))
        } }
        var selected = subject
        let subjects = LedgerState.subjects + ["道法", "体育", "音乐", "美术", "其他"]
        return parts.compactMap { part in
            var title = part.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines.union(CharacterSet(charactersIn: "，,")))
            if let label = subjects.first(where: { title.hasPrefix($0) }) {
                selected = label; title = String(title.dropFirst(label.count))
                if title.hasPrefix("作业") { title = String(title.dropFirst(2)) }
                title = title.trimmingCharacters(in: CharacterSet(charactersIn: " ：:、，,-\t"))
            }
            return title.isEmpty ? nil : (selected, title)
        }
    }
}
