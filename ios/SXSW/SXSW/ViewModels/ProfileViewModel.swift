import Foundation

@Observable
final class ProfileViewModel {
    var user: User?
    var isLoading = false
    var error: String?
    var notificationsEnabled = false
    var editedName: String = ""
    var isSaving = false

    private let authService = AuthService.shared

    func loadProfile() async {
        isLoading = true
        error = nil

        do {
            let currentUser = try await authService.getCurrentUser()
            user = currentUser
            editedName = currentUser.name ?? ""

            let settings = await UNUserNotificationCenter.current().notificationSettings()
            notificationsEnabled = settings.authorizationStatus == .authorized
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func updateName() async {
        guard !editedName.isEmpty else { return }

        isSaving = true

        do {
            let response: APIResponse<User> = try await APIClient.shared.request(
                .updateProfile(name: editedName)
            )
            user = response.data
        } catch {
            self.error = error.localizedDescription
        }

        isSaving = false
    }

    func requestNotificationPermission() async {
        let granted = await NotificationService.shared.requestPermission()
        notificationsEnabled = granted
    }

    var appVersion: String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }
}

import UserNotifications
