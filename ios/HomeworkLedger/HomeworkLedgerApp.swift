import SwiftUI

@main
struct HomeworkLedgerApp: App {
    @StateObject private var store = LedgerStore()
    var body: some Scene {
        WindowGroup {
            RootView().environmentObject(store).tint(Theme.blue)
                .environment(\.locale, Locale(identifier: "zh_CN"))
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var store: LedgerStore
    @Environment(\.scenePhase) private var scenePhase
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    var body: some View {
        NavigationStack {
            Group {
                if store.state.activeTask != nil || store.disk.session != nil { FocusView() }
                else { HomeView() }
            }
            .background(Theme.background)
        }
        .id(store.state.activeTask?.task.id ?? store.disk.session?.id ?? "home")
        .sheet(item: $store.startChoice) { choice in StartTimeView(choice: choice).environmentObject(store) }
        .alert("操作未完成", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
            Button("知道了") { store.error = nil }
        } message: { Text(store.error ?? "") }
        .onReceive(timer) { _ in if scenePhase == .active { store.tick() } }
        .onChange(of: scenePhase) { phase in
            if phase == .active { store.becameActive() }
            else if phase == .background { store.audio.stopAll() }
        }
    }
}
