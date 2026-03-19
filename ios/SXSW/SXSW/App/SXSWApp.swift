import SwiftUI
import SwiftData

@main
struct SXSWApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var authViewModel = AuthViewModel()

    let modelContainer: ModelContainer

    init() {
        modelContainer = OfflineStore.container
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authViewModel)
                .modelContainer(modelContainer)
                .onOpenURL { url in
                    handleDeepLink(url)
                }
                .task {
                    await syncPendingChanges()
                }
        }
    }

    private func handleDeepLink(_ url: URL) {
        guard url.scheme == AppConstants.appScheme else { return }

        if url.host == "verify",
           let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let token = components.queryItems?.first(where: { $0.name == "token" })?.value {
            Task {
                await authViewModel.verifyToken(token)
            }
        }
    }

    private func syncPendingChanges() async {
        let syncManager = SyncManager.shared
        let networkMonitor = NetworkMonitor.shared

        if networkMonitor.isConnected {
            let context = modelContainer.mainContext
            await syncManager.syncPendingChanges(context: context)
        }
    }
}
