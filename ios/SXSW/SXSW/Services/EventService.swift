import Foundation

@MainActor
final class EventService {
    static let shared = EventService()

    private let client = APIClient.shared

    private init() {}

    func listEvents(
        day: String? = nil,
        trackId: String? = nil,
        venueId: String? = nil,
        eventType: EventType? = nil,
        cursor: String? = nil,
        limit: Int = 20
    ) async throws -> APIResponse<[Event]> {
        let params = EventQueryParams(
            day: day,
            trackId: trackId,
            venueId: venueId,
            eventType: eventType?.rawValue,
            cursor: cursor,
            limit: limit
        )
        return try await client.request(.events(params: params))
    }

    func getEvent(id: String) async throws -> Event {
        let response: APIResponse<Event> = try await client.request(.eventDetail(id: id))
        return response.data
    }

    func search(query: String) async throws -> APIResponse<[Event]> {
        return try await client.request(.searchEvents(query: query))
    }

    func getDays() async throws -> [String] {
        let response: APIResponse<[String]> = try await client.request(.eventDays)
        return response.data
    }

    func getFeatured() async throws -> [Event] {
        let response: APIResponse<[Event]> = try await client.request(.featuredEvents)
        return response.data
    }
}
