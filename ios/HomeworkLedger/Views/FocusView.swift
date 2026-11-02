import SwiftUI

struct FocusView: View {
    @EnvironmentObject private var store: LedgerStore
    @State private var lookup = false
    @State private var supplement = false
    @State private var rest = false
    @State private var ordering = false
    private var date: String { store.state.activeTask?.date ?? store.disk.session?.date ?? store.selectedDate }
    private var tasks: [HomeworkTask] { store.state.tasks(date) }
    private var task: HomeworkTask? { store.state.activeTask?.task ?? tasks.first { $0.id == store.disk.session?.taskID } }
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                ProgressHeader(tasks: tasks, now: store.now)
                if date != Day.key() { Text("\(date) 的作业").font(.caption).foregroundStyle(.secondary) }
                if let task = task {
                    if let session = store.disk.session {
                        Text(session.kind == "rest" ? "☕ 休息一下" : "准备开始下一项").font(.title.bold())
                        Text(session.endAt <= store.now ? "时间到啦" : Day.clock(session.endAt.timeIntervalSince(store.now) * 1000))
                            .font(.system(size: 64, weight: .bold, design: .monospaced)).minimumScaleFactor(0.5).lineLimit(1)
                        Text("\(Day.time(session.endAt)) 返回").foregroundStyle(.secondary)
                        if session.kind == "rest" {
                            let remaining = Double(task.estimatedMinutes) * 60000 - task.elapsed(at: store.now)
                            Text(remaining >= 0 ? "距估时还剩 \(Day.clock(remaining))" : "已超时 \(Day.clock(-remaining))").foregroundStyle(.secondary)
                        }
                        TaskLabel(task: task).ledgerCard()
                        Button(session.kind == "rest" || task.status == "paused" ? "现在继续" : "现在开始") { store.start(task.id, date: date) }
                            .buttonStyle(.borderedProminent).controlSize(.large)
                        if session.kind == "rest" {
                            Button(session.extended ? "本次已延长 3 分钟" : "再休息 3 分钟") { store.extendRest() }.disabled(session.extended)
                        } else {
                            HStack {
                                Button("调整开始时间") { store.chooseStart(task, date: date) }
                                Button("取消安排") { store.cancelSchedule() }
                            }
                        }
                    } else {
                        Text(task.subject).font(.headline).foregroundStyle(Theme.subject(task.subject))
                        Text(task.title).font(.largeTitle.bold()).multilineTextAlignment(.center)
                        Text("首次开始 \(task.raw.text("startedAt")) · 预计 \(task.estimatedMinutes) 分钟").foregroundStyle(.secondary)
                        Divider()
                        Text(Day.clock(task.elapsed(at: store.now))).font(.system(size: 72, weight: .semibold, design: .monospaced))
                            .foregroundStyle(Theme.blue).minimumScaleFactor(0.5).lineLimit(1)
                        Text("专注用时").foregroundStyle(.secondary)
                        Divider()
                        Button("完成这项") { store.complete() }.buttonStyle(.borderedProminent).controlSize(.large)
                        Button("休息一下") { rest = true }.buttonStyle(.bordered).controlSize(.large)
                        Button("跳过，开始下一项") { store.skip() }.disabled(!tasks.contains { $0.id != task.id && $0.status != "done" })
                    }
                    if tasks.filter(\.untouched).count > 1 { Button("调整未开始顺序") { ordering = true } }
                    if date == Day.key() { Button("＋ 补加作业") { supplement = true } }
                } else {
                    Text("原来的作业已不在清单中")
                    Button("返回首页") { store.cancelSchedule() }
                }
            }.padding(28).frame(maxWidth: 720).frame(maxWidth: .infinity)
        }
        .background(store.disk.session?.kind == "rest" ? Theme.mint : Color(uiColor: .systemBackground))
        .navigationTitle(store.disk.session?.kind == "rest" ? "休息" : "专注时间").navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .navigationBarTrailing) { Button("查字") { lookup = true } } }
        .sheet(isPresented: $lookup) { HanziView() }
        .sheet(isPresented: $supplement) { SupplementView() }
        .sheet(isPresented: $ordering) { OrderView(date: date, pendingOnly: true) }
        .sheet(isPresented: $rest) { RestChoiceView() }
    }
}

struct RestChoiceView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    @State private var returnAt = Date().addingTimeInterval(1800)
    var body: some View {
        NavigationStack {
            Form {
                Section("休息多久？") {
                    ForEach([5, 10, 15], id: \.self) { minutes in
                        Button("休息 \(minutes) 分钟") {
                            store.beginRest(until: Date().addingTimeInterval(Double(minutes) * 60))
                            if store.disk.session?.kind == "rest" { dismiss() }
                        }
                    }
                }
                Section("吃饭后回来") {
                    DatePicker("返回时间", selection: $returnAt, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                    Button("确定返回时间") { store.beginRest(until: returnAt, kind: "dinner"); if store.disk.session?.kind == "rest" { dismiss() } }
                }
            }.navigationTitle("休息一下").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("返回") { dismiss() } } }
        }
    }
}

struct StartTimeView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    let choice: StartChoice
    @State private var startAt = Date()
    private var task: HomeworkTask? { store.state.tasks(choice.date).first { $0.id == choice.id } }
    var body: some View {
        NavigationStack {
            Form {
                if let task = task { TaskLabel(task: task) }
                Section("我准备什么时候开始？") {
                    DatePicker("开始时间", selection: $startAt, displayedComponents: [.date, .hourAndMinute])
                    HStack {
                        Button("现在") { startAt = Date() }
                        Spacer(); Button("5分钟后") { startAt = Date().addingTimeInterval(300) }
                        Spacer(); Button("10分钟后") { startAt = Date().addingTimeInterval(600) }
                    }
                    Button(startAt <= store.now ? (task?.status == "paused" ? "现在继续" : "现在开始") : "确定开始时间") {
                        store.schedule(choice.id, date: choice.date, at: startAt)
                    }.buttonStyle(.borderedProminent)
                }
                ProgressHeader(tasks: store.state.tasks(choice.date), now: store.now)
                if store.undoCompletionAvailable { Button("撤销刚才的完成") { store.undoComplete() } }
            }.navigationTitle("开始安排").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("返回") { dismiss() } } }
        }
    }
}
