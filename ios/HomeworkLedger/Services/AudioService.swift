import AVFoundation
import Combine
import CryptoKit

@MainActor
final class AudioService: NSObject, ObservableObject {
    @Published private(set) var recordingKey: String?
    @Published private(set) var playing = false
    @Published private(set) var practicing = false
    @Published private(set) var progress = 0
    @Published private(set) var revision = 0
    @Published var error: String?
    private var recorder: AVAudioRecorder?
    private var player: AVAudioPlayer?
    private var recordingStarted: Date?
    private var recordingTarget: URL?
    private var recordingTemporary: URL?
    private var limitTask: Task<Void, Never>?
    private var playbackTask: Task<Void, Never>?
    private var permissionTask: Task<Void, Never>?
    private let speech = AVSpeechSynthesizer()
    private var interruptionToken: NSObjectProtocol?
    private var generation = UUID()
    private var playbackGeneration = UUID()
    static let alarmKey = "__break_alarm__"

    override init() {
        super.init()
        interruptionToken = NotificationCenter.default.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] _ in
            Task { @MainActor in self?.stopAll() }
        }
    }
    deinit { if let interruptionToken = interruptionToken { NotificationCenter.default.removeObserver(interruptionToken) } }

    static var soundURL: URL {
        FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Sounds", isDirectory: true).appendingPathComponent("homework-reminder.caf")
    }
    private func url(_ key: String) -> URL {
        if key == Self.alarmKey { return Self.soundURL }
        let digest = SHA256.hash(data: Data(key.utf8)).map { String(format: "%02x", $0) }.joined()
        return FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("HomeworkLedger/Recordings", isDirectory: true).appendingPathComponent(digest + ".m4a")
    }
    func hasRecording(_ key: String) -> Bool { FileManager.default.fileExists(atPath: url(key).path) }
    func record(_ key: String) {
        stopAll()
        let token = UUID(); generation = token
        permissionTask = Task { [weak self] in
            let allowed = await withCheckedContinuation { continuation in
                AVAudioSession.sharedInstance().requestRecordPermission { continuation.resume(returning: $0) }
            }
            guard let self = self, self.generation == token, !Task.isCancelled else { return }
            guard allowed else { self.error = "请在系统设置中允许作业小计划使用麦克风"; return }
            do {
                let session = AVAudioSession.sharedInstance()
                try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
                try session.setActive(true)
                let destination = self.url(key)
                try FileManager.default.createDirectory(at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
                let temporary = destination.deletingLastPathComponent().appendingPathComponent(UUID().uuidString + "." + destination.pathExtension)
                let settings: [String: Any] = key == Self.alarmKey
                    ? [AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: 16000, AVNumberOfChannelsKey: 1,
                       AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false, AVLinearPCMIsBigEndianKey: false]
                    : [AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: 44100, AVNumberOfChannelsKey: 1, AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue]
                let recorder = try AVAudioRecorder(url: temporary, settings: settings)
                guard recorder.prepareToRecord(), recorder.record() else { throw LedgerError("麦克风录音未能开始") }
                self.recorder = recorder; self.recordingKey = key; self.recordingStarted = Date()
                self.recordingTarget = destination; self.recordingTemporary = temporary
                self.limitTask = Task { [weak self] in
                    do { try await Task.sleep(nanoseconds: 10_000_000_000) } catch { return }
                    self?.finishRecording()
                }
            } catch { self.error = error.localizedDescription; self.cancelRecording() }
        }
    }
    func finishRecording() {
        guard let key = recordingKey, let temporary = recordingTemporary, let target = recordingTarget else { return }
        let duration = Date().timeIntervalSince(recordingStarted ?? Date())
        recorder?.stop(); recorder = nil; limitTask?.cancel(); limitTask = nil
        recordingKey = nil; recordingStarted = nil; recordingTarget = nil; recordingTemporary = nil
        defer { try? FileManager.default.removeItem(at: temporary) }
        do {
            guard duration >= 0.4 else { throw LedgerError("录音太短，请读完词语后再停止") }
            let data = try Data(contentsOf: temporary)
            let check = try AVAudioPlayer(data: data)
            guard check.duration >= 0.3 else { throw LedgerError("没有录到有效声音，请重试") }
            try data.write(to: target, options: .atomic)
            revision += 1; preview(key)
        } catch { self.error = error.localizedDescription; deactivate() }
    }
    private func cancelRecording() {
        recorder?.stop(); recorder = nil; limitTask?.cancel(); limitTask = nil
        if let temporary = recordingTemporary { try? FileManager.default.removeItem(at: temporary) }
        recordingKey = nil; recordingStarted = nil; recordingTarget = nil; recordingTemporary = nil
    }
    func delete(_ key: String) {
        stopAll()
        do { if hasRecording(key) { try FileManager.default.removeItem(at: url(key)); revision += 1 } }
        catch { self.error = error.localizedDescription }
    }
    func preview(_ key: String) {
        stopPlayback()
        let token = playbackGeneration
        playbackTask = Task { [weak self] in
            guard let self = self else { return }
            defer { self.finishPlayback(token) }
            do { try await self.playFile(self.url(key)) }
            catch is CancellationError { }
            catch { self.error = error.localizedDescription }
        }
    }
    func practice(_ words: [String]) {
        guard !words.isEmpty, words.allSatisfy(hasRecording) else { error = "本课词语全部录音后才能开始听写"; return }
        stopAll(); practicing = true; progress = 0
        let token = playbackGeneration
        playbackTask = Task { [weak self] in
            guard let self = self else { return }
            defer { self.finishPlayback(token) }
            do {
                for (index, word) in words.enumerated() {
                    try Task.checkCancellation(); self.progress = index + 1
                    try await self.playFile(self.url(word))
                    try await Task.sleep(nanoseconds: 1_000_000_000)
                    try await self.playFile(self.url(word))
                    if index + 1 < words.count { try await Task.sleep(nanoseconds: word.count == 4 ? 3_000_000_000 : 2_000_000_000) }
                }
            } catch is CancellationError { }
            catch { self.error = error.localizedDescription }
        }
    }
    private func playFile(_ url: URL) async throws {
        try Task.checkCancellation()
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default); try session.setActive(true)
        let player = try AVAudioPlayer(contentsOf: url)
        self.player = player; playing = true
        guard player.play() else { throw LedgerError("录音播放失败") }
        while player.isPlaying { try Task.checkCancellation(); try await Task.sleep(nanoseconds: 100_000_000) }
        try Task.checkCancellation(); playing = false
    }
    func playAlarm() {
        // Never interrupt a child's word recording or dictation practice.
        guard recordingKey == nil, !practicing, !playing else { return }
        stopAlarm()
        if hasRecording(Self.alarmKey) {
            let token = playbackGeneration
            playbackTask = Task { [weak self] in
                guard let self = self else { return }
                defer { self.finishPlayback(token) }
                do {
                    try await self.playFile(Self.soundURL)
                    try await Task.sleep(nanoseconds: 500_000_000)
                    try await self.playFile(Self.soundURL)
                } catch is CancellationError { }
                catch { self.error = error.localizedDescription }
            }
        } else {
            do {
                try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
                try AVAudioSession.sharedInstance().setActive(true)
                for _ in 0..<2 {
                    let phrase = AVSpeechUtterance(string: "作业时间到啦")
                    phrase.voice = AVSpeechSynthesisVoice(language: "zh-CN"); phrase.postUtteranceDelay = 0.5
                    speech.speak(phrase)
                }
            } catch { self.error = error.localizedDescription }
        }
    }
    func stopAlarm() {
        speech.stopSpeaking(at: .immediate)
        if !practicing && recordingKey == nil { stopPlayback() }
    }
    func stopPlayback() {
        playbackGeneration = UUID()
        playbackTask?.cancel(); playbackTask = nil; player?.stop(); player = nil; playing = false; practicing = false
    }
    private func finishPlayback(_ token: UUID) {
        guard token == playbackGeneration else { return }
        practicing = false; playing = false; deactivate()
    }
    func stopAll() {
        generation = UUID(); permissionTask?.cancel(); permissionTask = nil
        cancelRecording(); stopPlayback(); speech.stopSpeaking(at: .immediate); deactivate()
    }
    private func deactivate() { try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation) }
}
