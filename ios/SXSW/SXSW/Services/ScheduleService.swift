import Foundation

actor ScheduleService {
    static let shared = ScheduleService()

    private let client = APIClient.shared

    private init() {}

    func getSchedule(day: String? = nil) async throws -> [Event] {
        let response: APIResponse<[Event]> = try await client.request(.schedule(day: day))
        return response.data
    }

    func addToSchedule(eventId: String, forceAdd: Bool = false) async throws -> Event {
        let response: APIResponse<Event> = try await client.request(
            .addToSchedule(eventId: eventId, forceAdd: forceAdd)
        )
        return response.data
    }

    func removeFromSchedule(eventId: String) async throws {
        let _: SuccessResponse = try await client.request(
            .removeFromSchedule(eventId: eventId)
        )
    }

    func checkConflicts(eventId: String) async throws -> ConflictCheckResponse {
        return try await client.request(.checkConflicts(eventId: eventId))
    }
}
