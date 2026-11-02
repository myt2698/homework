import SwiftUI

struct DictationView: View {
    @EnvironmentObject private var store: LedgerStore
    @ObservedObject var audio: AudioService
    @State private var customWord = ""
    @State private var deleteRecording: String?
    private var lesson: Lesson? { store.lessons.first { $0.id == store.state.raw.text("dictationLesson") } ?? store.lessons.first }
    private var words: [String] { lesson.map(store.words) ?? [] }
    var body: some View {
        List {
            if let lesson = lesson {
                Section {
                    Picker("选择课程", selection: Binding(get: { lesson.id }, set: { audio.stopAll(); store.selectLesson($0) })) {
                        ForEach(store.lessons) { Text($0.label).tag($0.id) }
                    }.disabled(audio.practicing || audio.recordingKey != nil)
                    HStack {
                        Button("上一课") { select(-1) }.disabled(store.lessons.first?.id == lesson.id)
                        Spacer(); Button("下一课") { select(1) }.disabled(store.lessons.last?.id == lesson.id)
                    }.disabled(audio.practicing || audio.recordingKey != nil)
                    Text("已录 \(words.filter(audio.hasRecording).count) / \(words.count) 个词语").foregroundStyle(.secondary)
                }
                if audio.practicing {
                    Section {
                        Text("听写进行中").font(.title2.bold())
                        ProgressView(value: Double(audio.progress), total: Double(max(1, words.count)))
                        Text("第 \(audio.progress) / \(words.count) 个词语")
                        Button("停止听写") { audio.stopAll() }
                    }
                } else {
                    Section {
                        Button("开始听写") { audio.practice(words) }
                            .disabled(audio.recordingKey != nil || words.isEmpty || !words.allSatisfy(audio.hasRecording))
                        Text("每个词读两遍。两遍间隔 1 秒，词语之间停顿 2 秒，四字词后停顿 3 秒。")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Section("词语录音") {
                        ForEach(Array(words.enumerated()), id: \.offset) { index, word in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack { Text("\(index + 1)").foregroundStyle(.secondary); Text(word).font(.headline); Spacer(); Text(audio.hasRecording(word) ? "已录音" : "未录音").font(.caption).foregroundStyle(.secondary) }
                                HStack {
                                    if audio.recordingKey == word { Button("停止并试听") { audio.finishRecording() }.tint(.red) }
                                    else { Button(audio.hasRecording(word) ? "重录" : "录音") { audio.record(word) }.disabled(audio.recordingKey != nil) }
                                    if audio.hasRecording(word) {
                                        Button("试听") { audio.preview(word) }.disabled(audio.recordingKey != nil)
                                        Button("删录音", role: .destructive) { deleteRecording = word }.disabled(audio.recordingKey != nil)
                                    }
                                    if store.state.customWords(lesson.id).contains(word) {
                                        Button("删词语", role: .destructive) {
                                            store.change { state in
                                                var custom = state.raw.object("dictationCustom")
                                                custom[lesson.id] = .array(state.customWords(lesson.id).filter { $0 != word }.map(JSONValue.string))
                                                state.raw["dictationCustom"] = .object(custom)
                                            }
                                        }.disabled(audio.recordingKey != nil)
                                    }
                                }.buttonStyle(.bordered).font(.caption)
                            }.padding(.vertical, 5)
                        }
                    }
                    Section("添加自定义词语") {
                        TextField("输入词语", text: $customWord)
                        Button("加入本课") { store.addWord(customWord, lesson: lesson); customWord = "" }.disabled(audio.recordingKey != nil)
                    }
                }
            } else { Text("内置词表未能读取，请检查安装资源。") }
        }
        .navigationTitle("听写练习").navigationBarTitleDisplayMode(.inline)
        .onDisappear { audio.stopAll() }
        .alert("录音或播放未完成", isPresented: Binding(get: { audio.error != nil }, set: { if !$0 { audio.error = nil } })) {
            Button("知道了") { audio.error = nil }
        } message: { Text(audio.error ?? "") }
        .confirmationDialog("删除这条录音？", isPresented: Binding(get: { deleteRecording != nil }, set: { if !$0 { deleteRecording = nil } })) {
            Button("删除录音", role: .destructive) { if let word = deleteRecording { audio.delete(word) }; deleteRecording = nil }
            Button("取消", role: .cancel) { deleteRecording = nil }
        }
    }
    private func select(_ offset: Int) {
        guard let lesson = lesson, let index = store.lessons.firstIndex(where: { $0.id == lesson.id }), store.lessons.indices.contains(index + offset) else { return }
        audio.stopAll(); store.selectLesson(store.lessons[index + offset].id)
    }
}
