import Foundation

struct ScheduleConflict: Codable, Identifiable {
    var id: String { existingEvent.id + (newEvent?.id ?? "") }
    let existingEvent: Event
    let newEvent: Event?
    let overlapMinutes: Int?

    var description: String {
        guard let newEvent = newEvent else {
            return "Conflict with \(existingEvent.title)"
        }
        return "\"\(newEvent.title)\" overlaps with \"\(existingEvent.title)\""
    }
}

struct ConflictCheckResponse: Codable {
    let hasConflict: Bool
    let conflictingEvents: [Event]?
}
