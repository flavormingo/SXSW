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

    func sendMagicLink() async {
        guard !email.isEmpty else {
            state = .error("Please enter your email address")
            return
        }

        state = .sendingLink
        do {
            try await authService.requestMagicLink(email: email)
            state = .linkSent(email: email)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func verifyToken(_ token: String) async {
        state = .verifying
        do {
            let user = try await authService.verifyMagicLink(token: token)
            currentUser = user
            state = .authenticated(user)
        } catch {
            state = .error("Verification failed: \(error.localizedDescription)")
        }
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
        do {
            try await authService.logout()
        } catch {
            print("[Auth] Logout API call failed: \(error)")
        }

        await APIClient.shared.clearAuthToken()
        currentUser = nil
        state = .idle
        email = ""
    }

    var isAuthenticated: Bool {
        if case .authenticated = state { return true }
        return false
    }
}
