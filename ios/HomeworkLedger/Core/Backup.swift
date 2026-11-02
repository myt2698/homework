import Foundation

struct Backup: Codable {
    var format = "homework-ledger-backup"
    var version = 3
    var exportedAt: String
    var state: LedgerState

    init(state: LedgerState, at date: Date = Date()) {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        exportedAt = formatter.string(from: date); self.state = state
    }
    func data() throws -> Data {
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try encoder.encode(self)
    }
    static func timestamp(_ string: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: string) { return date }
        formatter.formatOptions.insert(.withFractionalSeconds)
        return formatter.date(from: string)
    }
    static func read(_ data: Data, now: Date = Date()) throws -> LedgerState {
        guard data.count <= 32 * 1024 * 1024,
              let root = try JSONDecoder().decode(JSONValue.self, from: data).object else {
            throw LedgerError("备份文件无法识别或超过 32 MB")
        }
        let wrapped = root.text("format") == "homework-ledger-backup"
        if root["format"] != nil && !wrapped { throw LedgerError("不是作业小计划的备份文件") }
        if wrapped && ![1.0, 2.0, 3.0].contains(root.number("version")) { throw LedgerError("暂不支持这个备份版本") }
        let raw = wrapped ? root.object("state") : root
        guard raw["records"]?.object != nil, raw["weekends"]?.object != nil else { throw LedgerError("备份缺少记录数据") }
        for owner in Array(raw.object("records").values) + Array(raw.object("weekends").values) {
            guard let record = owner.object else { throw LedgerError("备份记录格式不正确") }
            if let tasks = record["tasks"] {
                guard let list = tasks.array, list.allSatisfy({ $0.object != nil }) else { throw LedgerError("备份作业格式不正确") }
                for value in list {
                    let task = value.object!
                    for key in ["elapsedMs", "activeSince"] {
                        let number = task.number(key)
                        guard number.isFinite, number >= 0, number <= (key == "activeSince" ? 253_402_300_799_999 : 3_155_760_000_000) else {
                            throw LedgerError("备份中的计时数值不正确")
                        }
                    }
                }
            }
        }
        var state = LedgerState(raw: raw)
        state.migrateLegacy()
        let captured = wrapped ? timestamp(root.text("exportedAt")) : nil
        state.raw = pauseClocks(.object(state.raw), captured: captured, now: now).object!
        var ids = Set<String>()
        for date in state.records.keys {
            guard Day.date(date) != nil else { throw LedgerError("备份中包含无效日期") }
            var tasks = state.tasks(date)
            for index in tasks.indices {
                if tasks[index].id.isEmpty { tasks[index].raw.set("id", UUID().uuidString) }
                guard ids.insert(tasks[index].id).inserted else { throw LedgerError("备份中存在重复作业编号") }
                guard ["pending", "paused", "done"].contains(tasks[index].status) else { throw LedgerError("备份包含无法识别的作业状态") }
            }
            state.setTasks(date, tasks)
        }
        return state
    }
    private static func pauseClocks(_ value: JSONValue, captured: Date?, now: Date) -> JSONValue {
        switch value {
        case .object(var object):
            if object["id"] != nil && object.text("status") == "active" {
                let delta = captured.map { max(0, min(Day.ms(now), Day.ms($0)) - object.number("activeSince")) } ?? 0
                object.set("elapsedMs", max(0, object.number("elapsedMs")) + (object.number("activeSince") > 0 ? delta : 0))
                object.set("status", "paused"); object.removeValue(forKey: "activeSince")
            }
            return .object(object.mapValues { pauseClocks($0, captured: captured, now: now) })
        case .array(let values): return .array(values.map { pauseClocks($0, captured: captured, now: now) })
        default: return value
        }
    }
}

extension LedgerState {
    mutating func migrateLegacy() {
        var known = Set(records.keys.flatMap { tasks($0).map(\.id) }.filter { !$0.isEmpty })
        var weekends = raw.object("weekends"), plans = raw.object("holidays")
        for key in weekends.keys.sorted() where Day.date(key) != nil {
            var weekend = weekends.object(key)
            guard !weekend.flag("datedTasksMigrated") else { continue }
            for date in Day.range(key, Day.plus(key, 2)) {
                if record(date)["finishTime"] != nil || record(date)["ruleId"] != nil {
                    updateRecord(date) { $0.set("legacyWeekendSettlement", true) }
                }
            }
            for value in weekend.array("tasks") {
                guard var task = value.object, !known.contains(task.text("id")) else { continue }
                if task.text("id").isEmpty { task.set("id", UUID().uuidString) }
                let planned = Day.plus(key, task.text("plannedDay") == "friday" ? 0 : task.text("plannedDay") == "sunday" ? 2 : 1)
                var date = planned
                if task.text("status") == "active" {
                    if Day.date(task.text("lastWorkedDate")) != nil { date = task.text("lastWorkedDate") }
                    else if task.number("activeSince") > 0 { date = Day.key(Date(timeIntervalSince1970: task.number("activeSince") / 1000)) }
                }
                if task.text("status") == "done", Day.date(task.text("completedDate")) != nil { date = task.text("completedDate") }
                task.set("legacyPlannedDate", planned); task.set("legacyWeekendKey", key)
                updateRecord(date) { r in
                    r["tasks"] = .array(r.array("tasks") + [.object(task)])
                    if weekend.flag("confirmed") || task.text("status", "pending") != "pending" { r.set("tasksConfirmed", true) }
                    if weekend.flag("orderSaved") || weekend.flag("planSaved") || task.text("status", "pending") != "pending" { r.set("orderSaved", true) }
                }
                known.insert(task.text("id"))
            }
            weekend.set("datedTasksMigrated", true); weekends[key] = .object(weekend)
            if !weekend.array("tasks").isEmpty {
                let id = "legacy-weekend-" + key
                if plans[id] == nil { plans[id] = .object(["id": .string(id), "name": .string("作业计划"), "start": .string(key),
                    "planDate": .string(key), "end": .string(Day.plus(key, 2)), "legacy": .bool(true)]) }
            }
        }
        raw["weekends"] = .object(weekends); raw["holidays"] = .object(plans); raw.set("planningVersion", 2.0)
        if raw["dictationCustom"]?.object == nil { raw["dictationCustom"] = .object([:]) }
        normalizeKeywords()
    }

    func dailyAmount(_ date: String) -> Double? {
        let r = record(date)
        if r.flag("legacyWeekendSettlement"), let parsed = Day.date(date) {
            let weekday = Day.calendar.component(.weekday, from: parsed)
            let friday = weekday == 6 ? date : weekday == 7 ? Day.plus(date, -1) : weekday == 1 ? Day.plus(date, -2) : ""
            let archived = raw.object("weekends").object(friday)
            let meaningful = !archived.array("tasks").isEmpty || !archived.text("allDoneDate").isEmpty
                || ["confirmed", "dailySeparated", "specialSeparated", "planSaved", "fridayDone", "saturdayMorningDone", "penaltyConfirmed"].contains { archived.flag($0) }
            if archived.flag("datedTasksMigrated") && meaningful { return nil }
        }
        return Reward.forRecord(r)?.amount
    }
    var archivedWeekendAmounts: [(date: String, amount: Double)] {
        raw.object("weekends").keys.sorted().compactMap { key in
            let weekend = raw.object("weekends").object(key), list = weekend.array("tasks").compactMap(\.object)
            let ordered = weekend.flag("orderSaved") || list.contains { $0.text("status", "pending") != "pending" }
            let planned = weekend.flag("planSaved") && ordered ? 0.5 : 0.0
            if weekend.flag("penaltyConfirmed") && weekend.text("allDoneDate").isEmpty { return (key, planned - 0.5) }
            guard !weekend.text("allDoneDate").isEmpty else { return nil }
            let followed = list.isEmpty ? weekend.text("allDoneDate") <= Day.plus(key, 1) : list.allSatisfy { task in
                let date = Day.plus(key, task.text("plannedDay") == "friday" ? 0 : task.text("plannedDay") == "sunday" ? 2 : 1)
                return task.text("status") == "done" && task.text("completedDate", weekend.text("allDoneDate")) <= date
            }
            return (key, planned + (followed ? 1 : 0.5))
        }
    }
    var balance: Double { records.keys.compactMap(dailyAmount).reduce(0, +) + archivedWeekendAmounts.map(\.amount).reduce(0, +) }
}

struct ReminderSession: Codable, Equatable, Identifiable {
    var id = UUID().uuidString
    var kind: String // start or rest
    var date: String
    var taskID: String
    var endAt: Date
    var startedAt: Date
    var extended = false
    var logID: String?
}

struct Snapshot: Codable {
    var savedAt: Date
    var state: LedgerState
}

struct DiskState: Codable {
    var version = 1
    var state = LedgerState()
    var session: ReminderSession?
    var snapshot: Snapshot?
}
