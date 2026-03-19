import Foundation

struct Recommendation: Codable, Identifiable {
    let id: String
    let event: Event
    let score: Double
    let reason: String
}
