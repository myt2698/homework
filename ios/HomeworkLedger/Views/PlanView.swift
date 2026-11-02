import SwiftUI

struct PlanView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    let start: String
    @State private var date: String
    @State private var count = 1
    @SceneStorage("plan.subject") private var subject = "语文"
    @SceneStorage("plan.title") private var title = ""
    @SceneStorage("plan.minutes") private var minutes = 15
    @State private var repeating = false
    @State private var repeatDates = Set<String>()
    @State private var editing: HomeworkTask?
    @State private var moving: HomeworkTask?
    @State private var ordering = false
    @State private var orderConfirmed = false
    @State private var exporting = false
    init(start: String) { self.start = start; _date = State(initialValue: start) }
    private var dates: [String] { Day.range(start, Day.plus(start, count - 1)) }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                DisclosureGroup("安排天数 · 共 \(count) 天") {
                    Stepper("包含开始当天", value: $count, in: 1...366)
                    HStack { Text("总天数"); TextField("天数", value: $count, format: .number).keyboardType(.numberPad).textFieldStyle(.roundedBorder).frame(width: 90) }
                    Button("保存范围") { _ = store.change { try $0.setRange(start: start, count: count) } }.buttonStyle(.bordered)
                }.ledgerCard()
                ScrollView(.horizontal) {
                    HStack {
                        ForEach(Array(dates.enumerated()), id: \.element) { index, day in
                            Button { date = day } label: {
                                VStack { Text(index == 0 ? "今天" : index == 1 ? "明天" : "第\(index + 1)天"); Text("\(store.state.tasks(day).count) 项").font(.caption) }
                                    .padding(12).background(date == day ? Theme.blue : Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                                    .foregroundStyle(date == day ? .white : .primary)
                            }
                        }
                    }
                }
                HStack {
                    Text("\(date) · 预计 \(store.state.tasks(date).reduce(0) { $0 + $1.estimatedMinutes }) 分钟").font(.subheadline).foregroundStyle(.secondary)
                    Spacer(); Button { exporting = true } label: { Label("下载 / 打印", systemImage: "square.and.arrow.up") }
                }
                if store.state.tasks(date).isEmpty { Text("还没有作业，在下方添加第一项吧。").foregroundStyle(.secondary).padding(.vertical, 30) }
                ForEach(store.state.tasks(date)) { task in
                    VStack(spacing: 12) {
                        TaskLabel(task: task)
                        HStack {
                            if task.status == "pending" { Button { editing = task } label: { Label("修改", systemImage: "pencil") } }
                            Spacer()
                            if !["active", "done"].contains(task.status) { Button { moving = task } label: { Label("改期", systemImage: "calendar") } }
                            if task.untouched { Button(role: .destructive) { store.deleteTask(task, date: date) } label: { Image(systemName: "trash") }.accessibilityLabel("删除\(task.title)") }
                        }.font(.subheadline)
                    }.ledgerCard()
                }
                if store.undoDeleteAvailable { Button("撤销刚才的删除") { store.undoDelete() } }
            }.padding(20).contentWidth()
        }
        .background(Theme.background)
        .navigationTitle("作业计划").navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .navigationBarTrailing) {
                Button("调整顺序") {
                    if title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { orderConfirmed = false; ordering = true }
                    else { store.error = "还有未添加的作业，请先点加号或清空输入框" }
                }.disabled(store.state.tasks(date).count < 2)
                Button("确定", action: confirmPlan).fontWeight(.bold).disabled(store.state.tasks(date).isEmpty)
            }
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: 8) {
                HStack {
                    Picker("科目", selection: $subject) { ForEach(LedgerState.subjects, id: \.self) { Text($0) } }.pickerStyle(.menu)
                    Spacer(); EstimatePicker(minutes: $minutes)
                }
                ScrollView(.horizontal) {
                    HStack {
                        ForEach(Array(store.state.keywords(subject).filter { $0["visible"]?.bool != false }.enumerated()), id: \.offset) { _, keyword in
                            Button(keyword.text("label")) { title += (title.isEmpty ? "" : " ") + keyword.text("label") }.buttonStyle(.bordered)
                        }
                    }
                }
                if count > 1 {
                    Toggle("按所选日期重复", isOn: $repeating).font(.caption)
                    if repeating {
                        ScrollView(.horizontal) { HStack {
                            ForEach(dates, id: \.self) { day in
                                Button { if repeatDates.contains(day) { repeatDates.remove(day) } else { repeatDates.insert(day) } } label: {
                                    Label(day, systemImage: repeatDates.contains(day) ? "checkmark.circle.fill" : "circle")
                                }.buttonStyle(.bordered)
                            }
                        } }
                    }
                }
                HStack(alignment: .bottom) {
                    TextField("请输入作业，可按 1. 2. 3. 分项", text: $title, axis: .vertical).lineLimit(1...4).textFieldStyle(.roundedBorder)
                    Button { add() } label: { Image(systemName: "plus").font(.title3.bold()).padding(8) }
                        .buttonStyle(.borderedProminent).accessibilityLabel("加入\(subject)作业")
                }
            }.padding().contentWidth().background(.regularMaterial)
        }
        .onAppear { count = max(1, Day.range(start, store.state.planEnd(start)).count) }
        .onChange(of: count) { value in
            if (1...366).contains(value), !dates.contains(date) { date = start }
        }
        .sheet(item: $editing) { TaskEditView(task: $0, date: date) }
        .sheet(item: $moving) { MoveTaskView(task: $0, from: date) }
        .sheet(isPresented: $ordering, onDismiss: { if orderConfirmed { orderConfirmed = false; confirmPlan() } }) {
            OrderView(date: date, pendingOnly: store.state.tasks(date).contains { !$0.untouched }, onSaved: { orderConfirmed = true })
        }
        .sheet(isPresented: $exporting) { PlanExportView(start: start, end: Day.plus(start, count - 1), selected: date) }
    }
    private func add() {
        let selected = repeating ? repeatDates.intersection(dates).sorted() : [date]
        if store.change({ state in
            try state.setRange(start: start, count: count)
            try state.add(title: title, subject: subject, minutes: minutes, dates: selected, planStart: start, repeatTask: repeating, now: Date())
        }) { title = "" }
    }
    private func confirmPlan() {
        guard title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { store.error = "还有未添加的作业，请先点加号或清空输入框"; return }
        guard !store.state.tasks(date).isEmpty else { return }
        if store.change({ state in try state.setRange(start: start, count: count); state.confirm(date) }) {
            store.selectedDate = date; dismiss()
            if date <= Day.key(), let next = store.state.tasks(date).first(where: { $0.status != "done" }) { store.chooseStart(next, date: date) }
        }
    }
}

struct TaskEditView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    let task: HomeworkTask
    let date: String
    @State private var title: String
    @State private var minutes: Int
    @State private var series = false
    init(task: HomeworkTask, date: String) { self.task = task; self.date = date; _title = State(initialValue: task.title); _minutes = State(initialValue: task.estimatedMinutes) }
    var body: some View {
        NavigationStack {
            Form {
                TextField("作业内容", text: $title, axis: .vertical); EstimatePicker(minutes: $minutes)
                if !task.raw.text("holidaySeriesId").isEmpty { Toggle("同时修改未来未开始的同系列作业", isOn: $series) }
            }
                .navigationTitle("修改作业").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) { Button("保存") {
                        if store.change({ try $0.edit(date: date, id: task.id, title: title, minutes: minutes, series: series) }) { dismiss() }
                    } }
                }
        }
    }
}

struct MoveTaskView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    let task: HomeworkTask
    let from: String
    @State private var target = Date()
    var body: some View {
        NavigationStack {
            Form { Text(task.title); DatePicker("安排到", selection: $target, displayedComponents: .date).datePickerStyle(.graphical) }
                .navigationTitle("调整日期").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) { Button("确定") {
                        if store.change({ try $0.move(id: task.id, from: from, to: Day.key(target)) }) { dismiss() }
                    } }
                }.onAppear { target = Day.date(from) ?? Date() }
        }
    }
}

struct OrderView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    let date: String
    let pendingOnly: Bool
    var onSaved: (() -> Void)? = nil
    @State private var selected: [String] = []
    @State private var editing: HomeworkTask?
    private var eligible: [HomeworkTask] { store.state.tasks(date).filter { !pendingOnly || $0.untouched } }
    var body: some View {
        NavigationStack {
            List {
                Section { Text("按想做的先后顺序，依次点选。作业卡片会保留原位。") }
                ForEach(eligible) { task in
                    HStack {
                        Button {
                            if !selected.contains(task.id) { selected.append(task.id); saveDraft() }
                        } label: {
                            HStack { Text(selected.firstIndex(of: task.id).map { "\($0 + 1)" } ?? "○").font(.title2.monospacedDigit()).frame(width: 35); TaskLabel(task: task) }
                        }.buttonStyle(.plain)
                        if task.status == "pending" { Button { editing = task } label: { Image(systemName: "pencil") }.buttonStyle(.borderless).accessibilityLabel("修改\(task.title)用时") }
                    }
                }
                Section("最终顺序预览") {
                    ForEach(selected, id: \.self) { id in
                        if let task = eligible.first(where: { $0.id == id }) { TaskLabel(task: task).onTapGesture { editing = task } }
                    }
                }
                HStack {
                    Button("撤销一步") { if !selected.isEmpty { selected.removeLast(); saveDraft() } }.disabled(selected.isEmpty)
                    Spacer(); Button("重新选择") { selected = []; saveDraft() }
                }
            }
            .navigationTitle(pendingOnly ? "调整未开始顺序" : "调整顺序").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("返回") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("确定") {
                    if store.change({ try $0.order(date: date, ids: selected, pendingOnly: pendingOnly) }) { onSaved?(); dismiss() }
                }.disabled(selected.count != eligible.count) }
            }
            .onAppear {
                let saved = store.state.record(date).object("orderDraft").array("selectedIds").compactMap(\.string)
                selected = saved.filter { id in eligible.contains { $0.id == id } }
            }
            .sheet(item: $editing) { TaskEditView(task: $0, date: date) }
        }
    }
    private func saveDraft() {
        store.change { state in state.updateRecord(date) { $0["orderDraft"] = .object(["selectedIds": .array(selected.map(JSONValue.string))]) } }
    }
}

struct SupplementView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.dismiss) private var dismiss
    @State private var subject = "语文"
    @State private var title = ""
    @State private var minutes = 15
    var body: some View {
        NavigationStack {
            Form {
                Section { Text("老师又布置作业啦？加到今天清单末尾。") }
                Picker("科目", selection: $subject) { ForEach(LedgerState.subjects, id: \.self) { Text($0) } }
                EstimatePicker(minutes: $minutes)
                TextField("作业内容", text: $title, axis: .vertical)
            }.navigationTitle("补加作业").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) { Button("加入今天") {
                        if store.change({ state in
                            try state.add(title: title, subject: subject, minutes: minutes, dates: [Day.key()], planStart: Day.key(), repeatTask: false, now: Date())
                            state.confirm(Day.key())
                        }) { dismiss() }
                    }.disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) }
                }
        }
    }
}
