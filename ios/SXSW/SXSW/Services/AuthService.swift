import Foundation

actor AuthService {
    static let shared = AuthService()

    private let client = APIClient.shared

    private init() {}

    private struct MagicLinkResponse: Codable {
        let status: Bool?
        let success: Bool?
    }

    func requestMagicLink(email: String) async throws {
        let _: MagicLinkResponse = try await client.request(
            .magicLink(email: email)
        )
    }

    func verifyMagicLink(token: String) async throws -> User {
        struct VerifyResponse: Codable {
            let token: String
            let user: User
        }

        let response: VerifyResponse = try await client.request(
            .verifyMagicLink(token: token)
        )

        await client.setAuthToken(response.token)
        return response.user
    }

    func logout() async throws {
        let _: SuccessResponse = try await client.request(.logout)
        await client.clearAuthToken()
    }

    func getCurrentUser() async throws -> User {
        let response: APIResponse<User> = try await client.request(.currentUser)
        return response.data
    }
}
