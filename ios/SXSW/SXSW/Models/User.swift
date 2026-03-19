import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String?
    let avatarUrl: String?
    let role: String?
    let createdAt: Date?
}
