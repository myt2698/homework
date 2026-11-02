import SwiftUI

enum Theme {
    static let blue = Color(red: 0.19, green: 0.35, blue: 0.66)
    static let background = Color(red: 0.97, green: 0.97, blue: 0.94)
    static let mint = Color(red: 0.88, green: 0.96, blue: 0.91)
    static func subject(_ name: String) -> Color {
        switch name {
        case "语文": return Color(red: 0.82, green: 0.36, blue: 0.30)
        case "数学": return Color(red: 0.20, green: 0.48, blue: 0.72)
        case "英语": return Color(red: 0.32, green: 0.58, blue: 0.40)
        default: return Color(red: 0.63, green: 0.43, blue: 0.69)
        }
    }
}
extension View {
    func ledgerCard() -> some View { padding(18).background(.background, in: RoundedRectangle(cornerRadius: 20)).overlay(RoundedRectangle(cornerRadius: 20).stroke(.primary.opacity(0.05))) }
    func contentWidth() -> some View { frame(maxWidth: 900).frame(maxWidth: .infinity) }
}

struct TaskLabel: View {
    let task: HomeworkTask
    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 3).fill(Theme.subject(task.subject)).frame(width: 5)
            VStack(alignment: .leading, spacing: 5) {
                Text(task.subject).font(.caption.weight(.semibold)).foregroundStyle(Theme.subject(task.subject))
                Text(task.title).font(.headline).strikethrough(task.status == "done").fixedSize(horizontal: false, vertical: true)
                Text("预计 \(task.estimatedMinutes) 分钟" + (task.elapsed() > 0 ? " · 已用 \(Day.clock(task.elapsed()))" : ""))
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            if task.status == "done" { Image(systemName: "checkmark.circle.fill").foregroundStyle(.green) }
            else if task.status == "paused" { Image(systemName: "pause.circle").foregroundStyle(.secondary) }
        }.fixedSize(horizontal: false, vertical: true)
    }
}

struct ProgressHeader: View {
    let tasks: [HomeworkTask]
    let now: Date
    private var completed: Int { tasks.filter { $0.status == "done" }.count }
    private var remaining: Int {
        tasks.filter { $0.status != "done" }.reduce(0) { $0 + max(0, $1.estimatedMinutes - Int(floor($1.elapsed(at: now) / 60000))) }
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack { Text("已完成 \(completed) / \(tasks.count)"); Spacer(); Text("预计还需 \(remaining) 分钟") }
                .font(.caption).foregroundStyle(.secondary)
            ProgressView(value: Double(completed), total: Double(max(1, tasks.count)))
        }
    }
}

struct EstimatePicker: View {
    @Binding var minutes: Int
    var body: some View {
        Picker("预计用时", selection: $minutes) {
            ForEach(LedgerState.estimateOptions, id: \.self) {
                Text("\($0) 分钟").tag($0)
            }
        }.pickerStyle(.menu)
    }
}
