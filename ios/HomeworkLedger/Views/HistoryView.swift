import SwiftUI

struct HistoryView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    private var week: [String] {
        let offset = (Day.calendar.component(.weekday, from: store.now) + 5) % 7
        let monday = Day.plus(Day.key(store.now), -offset)
        return Day.range(monday, Day.plus(monday, 6))
    }
    private var onPlanDays: Int { week.filter { date in
        let tasks = store.state.tasks(date)
        return !tasks.isEmpty && tasks.allSatisfy { $0.status == "done" && $0.raw.text("completedDate", date) <= date }
    }.count }
    var body: some View {
        List {
            Section("成长足迹") {
                Text(String(format: "累计金额 ¥%.2f", store.state.balance)).font(.title.bold())
                let amounts = store.state.records.keys.compactMap { store.state.dailyAmount($0) } + store.state.archivedWeekendAmounts.map(\.amount)
                LabeledContent("记录天数", value: "\(store.state.meaningfulDates.count)")
                LabeledContent("奖励次数", value: "\(amounts.filter { $0 > 0 }.count)")
                LabeledContent("累计扣款", value: String(format: "¥%.2f", -amounts.filter { $0 < 0 }.reduce(0, +)))
            }
            Section("本周计划复盘") {
                LabeledContent("按计划完成", value: "\(onPlanDays) 天")
                let tasks = week.flatMap { store.state.tasks($0) }
                LabeledContent("预计用时", value: "\(tasks.reduce(0) { $0 + $1.estimatedMinutes }) 分钟")
                LabeledContent("实际用时", value: "\(Int(tasks.reduce(0) { $0 + $1.elapsed(at: store.now) } / 60000)) 分钟")
            }
            Section("每天的记录") {
                ForEach(store.state.meaningfulDates, id: \.self) { date in
                    NavigationLink { DayDetailView(date: date) } label: {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack { Text(date).font(.headline); Spacer(); if let amount = store.state.dailyAmount(date) { Text(String(format: "%+.2f 元", amount)) } }
                            let tasks = store.state.tasks(date)
                            Text("作业 \(tasks.filter { $0.status == "done" }.count)/\(tasks.count) · 打卡 \(LedgerState.habits.filter { store.state.habitDone($0.0, on: date) }.count)/4").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            if !store.state.archivedWeekendAmounts.isEmpty {
                Section("旧版周末结算") {
                    ForEach(store.state.archivedWeekendAmounts, id: \.date) { entry in
                        LabeledContent(entry.date, value: String(format: "%+.2f 元", entry.amount))
                    }
                }
            }
        }.navigationTitle("成长足迹").navigationBarTitleDisplayMode(.inline)
    }
}

struct DayDetailView: View {
    @EnvironmentObject private var store: LedgerStore
    let date: String
    @State private var manualTime = Date()
    @State private var correcting = false
    var body: some View {
        List {
            Section("作业记录") { ForEach(store.state.tasks(date)) { TaskLabel(task: $0) } }
            Section("习惯打卡") {
                ForEach(LedgerState.habits, id: \.0) { field, label in
                    Label(label, systemImage: store.state.habitDone(field, on: date) ? "checkmark.circle.fill" : "circle")
                }
            }
            Section("完成时间") {
                Text(store.state.record(date).text("finishTime", "未记录"))
                Button("补记或修正完成时间") { correcting = true }
            }
            Section { NavigationLink("查看或修改当天计划") { PlanView(start: date) } }
        }.navigationTitle(date)
        .sheet(isPresented: $correcting) {
            NavigationStack {
                Form {
                    DatePicker("完成时间", selection: $manualTime, displayedComponents: .hourAndMinute)
                    Text("由家长补记结算时间，不改变各项作业的计时和完成状态。")
                }.navigationTitle("修正完成时间")
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) { Button("取消") { correcting = false } }
                        ToolbarItem(placement: .confirmationAction) { Button("保存") {
                            if store.change({ state in state.updateRecord(date) { $0.set("finishTime", Day.time(manualTime)); $0.removeValue(forKey: "ruleId") } }) { correcting = false }
                        } }
                    }
            }
        }
    }
}
