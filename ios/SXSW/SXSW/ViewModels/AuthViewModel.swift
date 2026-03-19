import Foundation

@Observable
final class AuthViewModel {
    enum AuthState {
        case idle
        case sendingLink
        case linkSent(email: String)
        case verifying
        case authenticated(User)
        case error(String)
    }

    var state: AuthState = .idle
    var email: String = ""
    var currentUser: User?

    private let authService = AuthService.shared
    private var pollingTask: Task<Void, Never>?

    func sendMagicLink() async {
        guard !email.isEmpty else {
            state = .error("Please enter your email address")
            return
        }

        state = .sendingLink
        do {
            try await authService.requestMagicLink(email: email)
            state = .linkSent(email: email)
            startPolling()
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// Happy path: deep link opens app with token
    func verifyToken(_ token: String) async {
        stopPolling()
        state = .verifying
        do {
            let user = try await authService.verifyMagicLink(token: token)
            currentUser = user
            state = .authenticated(user)
        } catch {
            state = .error("Verification failed: \(error.localizedDescription)")
        }
    }

    /// Fallback: poll the server to check if session was created (e.g. verified in browser)
    private func startPolling() {
        stopPolling()
        let emailToCheck = email
        pollingTask = Task {
            // Wait a few seconds before first poll
            try? await Task.sleep(for: .seconds(3))

            while !Task.isCancelled {
                // Only poll while we're on the linkSent screen
                guard case .linkSent = state else { return }

                do {
                    let response = try await authService.pollSession(email: emailToCheck)
                    if response.authenticated, let token = response.token, let user = response.user {
                        APIClient.shared.setAuthToken(token)
                        currentUser = user
                        state = .authenticated(user)
                        return
                    }
                } catch {
                    // Not authenticated yet — keep polling
                }

                try? await Task.sleep(for: .seconds(4))
            }
        }
    }

    private func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func checkSession() async {
        guard KeychainService.loadString(forKey: "auth_token") != nil else {
            state = .idle
            return
        }

        do {
            let user = try await authService.getCurrentUser()
            currentUser = user
            state = .authenticated(user)
        } catch {
            state = .idle
        }
    }

    func logout() async {
        stopPolling()
        do {
            try await authService.logout()
        } catch {
            print("[Auth] Logout API call failed: \(error)")
        }

        APIClient.shared.clearAuthToken()
        currentUser = nil
        state = .idle
        email = ""
    }

    var isGuestMode = false

    func skipAuth() {
        isGuestMode = true
    }

    var isAuthenticated: Bool {
        if case .authenticated = state { return true }
        return false
    }

    var shouldShowMainApp: Bool {
        isAuthenticated || isGuestMode
    }
}
