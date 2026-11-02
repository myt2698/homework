import XCTest
@testable import HomeworkLedgerCore

final class LedgerCoreTests: XCTestCase {
    private let day = "2026-11-02"
    private func instant(_ time: String) -> Date {
        let values = time.split(separator: ":").map { Int($0)! }
        return Day.calendar.date(bySettingHour: values[0], minute: values[1], second: 0, of: Day.date(day)!)!
    }
    private func populated(_ titles: String = "1. 口算 2. 阅读") throws -> LedgerState {
        var state = LedgerState()
        try state.setRange(start: day, count: 3)
        try state.add(title: titles, subject: "数学", minutes: 15, dates: [day], planStart: day, repeatTask: false, now: instant("18:00"))
        state.confirm(day)
        return state
    }
    func testRewardBoundaries() {
        for (time, amount) in [("20:30", 1.5), ("20:31", 1.0), ("20:40", 1.0), ("20:41", 0.0), ("21:30", 0.0), ("21:31", -0.5)] {
            XCTAssertEqual(Reward.forTime(time)?.amount, amount)
        }
        XCTAssertNil(Reward.forTime("25:60"))
    }
    func testPauseExcludesRestAndCompletingLastSettlesOnce() throws {
        var state = try populated()
        let first = state.tasks(day)[0].id, second = state.tasks(day)[1].id
        try state.start(date: day, id: first, now: instant("18:00"))
        try state.pause(date: day, id: first, now: instant("18:05"))
        try state.start(date: day, id: first, now: instant("18:15"))
        _ = try state.complete(date: day, id: first, now: instant("18:20"))
        XCTAssertEqual(state.tasks(day)[0].elapsed(), 600_000)
        XCTAssertNil(state.dailyAmount(day))
        try state.start(date: day, id: second, now: instant("20:25"))
        _ = try state.complete(date: day, id: second, now: instant("20:30"))
        XCTAssertEqual(state.dailyAmount(day), 1.5)
        state.toggleHabit("readingDone", on: day, now: instant("22:00"))
        XCTAssertEqual(state.dailyAmount(day), 1.5)
        XCTAssertThrowsError(try state.complete(date: day, id: second, now: instant("22:00")))
    }
    func testCompletionUndoAndSupplementClearSettlement() throws {
        var state = try populated("口算")
        let id = state.tasks(day)[0].id
        try state.start(date: day, id: id, now: instant("20:00"))
        let before = try state.complete(date: day, id: id, now: instant("20:30"))
        try state.undoCompletion(date: day, task: before)
        XCTAssertEqual(state.tasks(day)[0].status, "active")
        XCTAssertNil(state.dailyAmount(day))
        _ = try state.complete(date: day, id: id, now: instant("20:30"))
        try state.add(title: "订正", subject: "数学", minutes: 5, dates: [day], planStart: day, repeatTask: false, now: instant("20:35"))
        XCTAssertNil(state.dailyAmount(day)); XCTAssertEqual(state.tasks(day)[0].status, "done")
    }
    func testPendingOrderKeepsStartedTasksInPlace() throws {
        var state = try populated("1. a 2. b 3. c 4. d")
        let ids = state.tasks(day).map(\.id)
        try state.start(date: day, id: ids[1], now: instant("18:00"))
        try state.order(date: day, ids: [ids[3], ids[2], ids[0]], pendingOnly: true)
        XCTAssertEqual(state.tasks(day).map(\.id), [ids[3], ids[1], ids[2], ids[0]])
        XCTAssertEqual(state.activeTask?.task.id, ids[1])
        XCTAssertThrowsError(try state.order(date: day, ids: [ids[0], ids[0], ids[2]], pendingOnly: true))
    }
    func testRangeShrinkAndMovePreserveData() throws {
        var state = try populated()
        let id = state.tasks(day)[0].id, target = Day.plus(day, 2)
        try state.move(id: id, from: day, to: target)
        try state.setRange(start: day, count: 1)
        XCTAssertEqual(state.tasks(target).first?.id, id)
        XCTAssertTrue(state.record(target).flag("tasksConfirmed"))
        XCTAssertThrowsError(try state.setRange(start: day, count: 367))
        XCTAssertThrowsError(try state.start(date: target, id: id, now: instant("18:00")))
    }
    func testBackupPausesAtCaptureAndPreservesUnknownFields() throws {
        var state = try populated()
        state.raw["futureField"] = .object(["value": .string("keep me")])
        let id = state.tasks(day)[0].id
        try state.start(date: day, id: id, now: instant("18:00"))
        let restored = try Backup.read(Backup(state: state, at: instant("18:05")).data(), now: instant("20:00"))
        XCTAssertEqual(restored.tasks(day)[0].status, "paused")
        XCTAssertEqual(restored.tasks(day)[0].elapsed(), 300_000)
        XCTAssertEqual(restored.raw["futureField"], state.raw["futureField"])
        XCTAssertNil(restored.tasks(day)[0].raw["activeSince"])
        let again = try Backup.read(Backup(state: restored, at: instant("20:00")).data(), now: instant("21:00"))
        XCTAssertEqual(restored, again)
    }
    func testMalformedBackupIsRejected() throws {
        for json in ["{}", "[]", "{\"records\":[],\"weekends\":{}}", "{\"records\":{\"bad\":{}},\"weekends\":{}}",
                     "{\"format\":\"homework-ledger-backup\",\"version\":99,\"state\":{}}"] {
            XCTAssertThrowsError(try Backup.read(Data(json.utf8)))
        }
        var state = try populated(); let tasks = state.tasks(day)
        state.setTasks(day, [tasks[0], tasks[0]])
        XCTAssertThrowsError(try Backup.read(Backup(state: state).data()))
    }
    func testLegacyWeekendMigrationIsIdempotent() {
        var state = LedgerState()
        let friday = "2026-10-30"
        state.raw["weekends"] = .object([friday: .object(["confirmed": .bool(true), "planSaved": .bool(true), "orderSaved": .bool(true),
            "allDoneDate": .string("2026-10-31"), "tasks": .array([.object(["id": .string("legacy"), "title": .string("阅读"),
            "status": .string("done"), "plannedDay": .string("saturday"), "completedDate": .string("2026-10-31")])])])])
        state.updateRecord("2026-10-31") { $0.set("finishTime", "20:00") }
        state.migrateLegacy(); let once = state
        state.migrateLegacy(); XCTAssertEqual(state, once)
        XCTAssertEqual(state.tasks("2026-10-31").first?.id, "legacy")
        XCTAssertEqual(state.balance, 1.5)
    }
    func testNumberedInputKeepsPunctuationAndSubject() {
        let drafts = TaskDraft.parse("1. 语文：朗读课文。注意停顿。 2. 数学：口算", subject: "语文")
        XCTAssertEqual(drafts.count, 2)
        XCTAssertEqual(drafts[0].title, "朗读课文。注意停顿。")
        XCTAssertEqual(drafts[1].subject, "数学")
    }
    func testSportOverridePreservesLegacyActivities() {
        var state = LedgerState()
        state.updateRecord(day) { $0["sportActivities"] = .array([.string("跳绳")]) }
        XCTAssertTrue(state.habitDone("sportDone", on: day))
        state.toggleHabit("sportDone", on: day, now: instant("18:00"))
        XCTAssertFalse(state.habitDone("sportDone", on: day))
        XCTAssertEqual(state.record(day).array("sportActivities"), [.string("跳绳")])
    }
    func testSeriesEditPreservesPastAndStartedInstances() throws {
        var state = LedgerState()
        try state.setRange(start: day, count: 3)
        try state.add(title: "阅读", subject: "语文", minutes: 15, dates: Day.range(day, Day.plus(day, 2)), planStart: day, repeatTask: true, now: instant("18:00"))
        let first = state.tasks(day)[0].id
        try state.edit(date: day, id: first, title: "朗读", minutes: 20, series: true, today: Day.plus(day, 1))
        XCTAssertEqual(state.tasks(day)[0].title, "阅读")
        XCTAssertEqual(state.tasks(Day.plus(day, 1))[0].title, "朗读")
        XCTAssertEqual(state.tasks(Day.plus(day, 2))[0].estimatedMinutes, 20)
    }
    func testEmptyWeekendArchiveDoesNotHideDailyReward() {
        var state = LedgerState()
        state.raw["weekends"] = .object(["2026-10-30": .object([:])])
        state.updateRecord("2026-10-31") { $0.set("finishTime", "20:00") }
        state.migrateLegacy()
        XCTAssertEqual(state.dailyAmount("2026-10-31"), 1.5)
    }
    func testNormalUndoPreservesElapsedTime() throws {
        var state = try populated("口算")
        let id = state.tasks(day)[0].id
        try state.start(date: day, id: id, now: instant("18:00"))
        _ = try state.complete(date: day, id: id, now: instant("18:10"))
        try state.reopen(date: day, id: id)
        XCTAssertEqual(state.tasks(day)[0].elapsed(), 600_000)
        XCTAssertEqual(state.tasks(day)[0].status, "paused")
        XCTAssertNil(state.dailyAmount(day))
    }
}
