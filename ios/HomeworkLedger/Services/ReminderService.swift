import Foundation
import UserNotifications
import Combine

@MainActor
final class ReminderService: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    @Published var permissionText = "尚未开启"
    @Published var error: String?
    private var current: ReminderSession?
    private var revision = 0
    private var scheduling: Task<Void, Never>?
    private let center = UNUserNotificationCenter.current()
    private let identifiers = (0..<48).map { "homework-reminder-\($0)" }
    func configure() { center.delegate = self; readPermission() }
    func readPermission() {
        center.getNotificationSettings { [weak self] settings in
            Task { @MainActor in
                self?.permissionText = settings.authorizationStatus == .authorized || settings.authorizationStatus == .provisional ? "已开启" : "未开启，可在系统设置中允许通知"
            }
        }
    }
    func requestPermission() {
        Task {
            do { _ = try await center.requestAuthorization(options: [.alert, .sound]); readPermission(); refresh(current) }
            catch { self.error = "通知授权失败：\(error.localizedDescription)" }
        }
    }
    func refresh(_ session: ReminderSession?) {
        current = session; revision += 1
        let token = revision
        let previous = scheduling
        // Serialize cancellation and enqueueing so a stale async add cannot resurrect a cancelled reminder.
        scheduling = Task {
            await previous?.value
            guard token == revision else { return }
            center.removePendingNotificationRequests(withIdentifiers: identifiers)
            center.removeDeliveredNotifications(withIdentifiers: identifiers)
            guard let session = session else { return }
            let sound: UNNotificationSound = FileManager.default.fileExists(atPath: AudioService.soundURL.path)
                ? UNNotificationSound(named: UNNotificationSoundName(rawValue: "homework-reminder.caf")) : .default
            // iOS has a bounded pending-notification queue. Refill on every foreground entry.
            let start = session.endAt > Date() ? session.endAt : Date().addingTimeInterval(1)
            for index in 0..<48 {
                guard token == revision else { return }
                let content = UNMutableNotificationContent()
                content.title = "作业时间到啦"; content.body = session.kind == "rest" ? "休息结束，回来继续这一项吧。" : "准备好了吗？开始下一项作业吧。"
                content.sound = sound; content.threadIdentifier = "homework-timer"
                let interval = max(1, start.addingTimeInterval(Double(index) * 300).timeIntervalSinceNow)
                let request = UNNotificationRequest(identifier: identifiers[index], content: content,
                    trigger: UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false))
                do {
                    try await center.add(request)
                    if token != revision { return }
                } catch { self.error = "提醒安排失败：\(error.localizedDescription)"; return }
            }
        }
    }
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        // The foreground timer plays the recorded phrase twice; avoid duplicate system sound.
        completionHandler([.banner])
    }
}
