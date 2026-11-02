import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: LedgerStore
    @State private var lookup = false
    @State private var supplement = false
    @State private var editing: HomeworkTask?
    @State private var reorder = false
    private var pending: [HomeworkTask] { store.tasks.filter { $0.status != "done" } }
    private var completed: [HomeworkTask] { store.tasks.filter { $0.status == "done" } }
    private var confirmed: Bool { store.state.record(store.selectedDate).flag("tasksConfirmed") }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("每天进步一点点").font(.caption).foregroundStyle(.secondary)
                        Text("🌟 作业小计划").font(.largeTitle.bold())
                    }
                    Spacer()
                }
                if store.selectedDate != Day.key() {
                    Button { store.selectedDate = Day.key() } label: {
                        Label("正在查看 \(store.selectedDate) · 回到今天", systemImage: "calendar")
                    }.buttonStyle(.bordered)
                }
                Button { lookup = true } label: {
                    HStack { Text("字").font(.title.bold()); Text("查字").font(.headline); Text("看笔顺 · 跟着写").foregroundStyle(.secondary); Spacer(); Image(systemName: "chevron.right") }
                }.ledgerCard()
                VStack(alignment: .leading, spacing: 18) {
                    Button {
                        store.change { state in state.updateRecord(store.selectedDate) { $0.set("ledgerConfirmed", !$0.flag("ledgerConfirmed")) } }
                    } label: {
                        Label("核对钉钉并补全成长记录册", systemImage: store.state.record(store.selectedDate).flag("ledgerConfirmed") ? "checkmark.circle.fill" : "circle")
                            .font(.headline).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    Divider()
                    HStack { Text("习惯打卡").font(.headline); Spacer(); Text("已完成 \(LedgerState.habits.filter { store.state.habitDone($0.0, on: store.selectedDate) }.count) / 4").font(.caption).foregroundStyle(.secondary) }
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(LedgerState.habits, id: \.0) { field, label in
                            let done = store.state.habitDone(field, on: store.selectedDate)
                            Button { store.change { $0.toggleHabit(field, on: store.selectedDate, now: Date()) } } label: {
                                Label(label, systemImage: done ? "checkmark.circle.fill" : "circle")
                                    .frame(maxWidth: .infinity, alignment: .leading).padding(12)
                                    .background(done ? Theme.mint : Color.secondary.opacity(0.07), in: RoundedRectangle(cornerRadius: 12))
                            }.accessibilityLabel("\(label)，\(done ? "已完成，点击撤销打卡" : "待完成，点击打卡")")
                        }
                    }
                    DisclosureGroup("运动项目") {
                        ForEach(LedgerState.sports, id: \.self) { sport in
                            Toggle(sport, isOn: Binding(get: {
                                store.state.record(store.selectedDate).array("sportActivities").compactMap(\.string).contains(sport)
                            }, set: { enabled in
                                store.change { state in state.updateRecord(store.selectedDate) { r in
                                    var activities = r.array("sportActivities").compactMap(\.string)
                                    activities.removeAll { $0 == sport }; if enabled { activities.append(sport) }
                                    r["sportActivities"] = .array(activities.map(JSONValue.string)); r.set("sportDone", !activities.isEmpty)
                                } }
                            }))
                        }.padding(.top, 8)
                    }.font(.subheadline)
                }.ledgerCard()
                NavigationLink { PlanView(start: store.selectedDate) } label: {
                    HStack { Label("作业计划", systemImage: "list.bullet.clipboard").font(.title3.bold()); Spacer(); Text("录入 · 日期 · 顺序"); Image(systemName: "chevron.right") }
                        .padding(20).background(Theme.blue, in: RoundedRectangle(cornerRadius: 20)).foregroundStyle(.white)
                }
                let overdue = store.state.records.keys.sorted().filter { $0 < Day.key() && store.state.tasks($0).contains { $0.status != "done" } }
                if store.selectedDate == Day.key() && !overdue.isEmpty {
                    DisclosureGroup("之前未完成") {
                        ForEach(overdue, id: \.self) { date in
                            NavigationLink("\(date) · \(store.state.tasks(date).filter { $0.status != "done" }.count) 项") { PlanView(start: date) }
                                .padding(.vertical, 8)
                        }
                    }.ledgerCard()
                }
                if !store.tasks.isEmpty {
                    ProgressHeader(tasks: store.tasks, now: store.now)
                    if let first = pending.first {
                        VStack(spacing: 16) {
                            HStack {
                                TaskLabel(task: first)
                                if first.status == "pending" { Button { editing = first } label: { Image(systemName: "pencil") }.accessibilityLabel("修改当前作业") }
                            }
                            if confirmed {
                                Button(first.status == "paused" ? "继续这项作业" : "开始这项作业") { store.chooseStart(first, date: store.selectedDate) }
                                    .buttonStyle(.borderedProminent).controlSize(.large).disabled(store.selectedDate > Day.key())
                            } else { Text("确认作业计划后就可以开始啦").foregroundStyle(.secondary) }
                        }.ledgerCard().contextMenu {
                            if first.status == "pending" { Button("修改内容与用时") { editing = first } }
                        }
                        ForEach(Array(pending.dropFirst().prefix(2))) { task in
                            TaskLabel(task: task).ledgerCard().onTapGesture { if task.status == "pending" { editing = task } }
                        }
                        if pending.count > 3 {
                            DisclosureGroup("其余 \(pending.count - 3) 项") {
                                ForEach(Array(pending.dropFirst(3))) { TaskLabel(task: $0).padding(.vertical, 8) }
                            }.ledgerCard()
                        }
                        if pending.filter(\.untouched).count > 1 {
                            Button("调整未开始顺序") { reorder = true }
                        }
                    } else {
                        let remaining = LedgerState.habits.filter { !store.state.habitDone($0.0, on: store.selectedDate) }.map(\.1)
                        VStack(alignment: .leading, spacing: 10) {
                            Text(remaining.isEmpty ? "🎉 今天全部完成啦！" : "作业完成啦！").font(.title2.bold())
                            if !remaining.isEmpty { Text("还有：" + remaining.joined(separator: "、")) }
                            Text("预计 \(store.tasks.reduce(0) { $0 + $1.estimatedMinutes }) 分钟 · 实际 \(Int(store.tasks.reduce(0) { $0 + $1.elapsed(at: store.now) } / 60000)) 分钟")
                            if let reward = Reward.forRecord(store.state.record(store.selectedDate)) { Text(String(format: "今日结算 %+.2f 元", reward.amount)).font(.headline) }
                        }.ledgerCard()
                    }
                    if !completed.isEmpty {
                        DisclosureGroup("已完成 \(completed.count) 项") {
                            ForEach(completed) { task in
                                VStack(alignment: .leading) {
                                    TaskLabel(task: task)
                                    Button("撤销完成") { store.change { try $0.reopen(date: store.selectedDate, id: task.id) } }.font(.caption)
                                }.padding(.vertical, 8)
                            }
                        }.ledgerCard()
                    }
                    if confirmed && store.selectedDate == Day.key() { Button("＋ 补加作业") { supplement = true }.buttonStyle(.bordered) }
                }
                if store.undoCompletionAvailable { Button("已完成 · 撤销") { store.undoComplete() }.buttonStyle(.bordered) }
            }.padding(20).contentWidth()
        }
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                NavigationLink { HistoryView() } label: { Label("足迹", systemImage: "chart.bar") }
                NavigationLink { DictationView(audio: store.audio) } label: { Label("听写", systemImage: "speaker.wave.2") }
                NavigationLink { SettingsView() } label: { Label("设置", systemImage: "gearshape") }
            }
        }
        .sheet(isPresented: $lookup) { HanziView() }
        .sheet(isPresented: $supplement) { SupplementView() }
        .sheet(isPresented: $reorder) { OrderView(date: store.selectedDate, pendingOnly: true) }
        .sheet(item: $editing) { TaskEditView(task: $0, date: store.selectedDate) }
    }
}
