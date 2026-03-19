import Foundation

struct Speaker: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let title: String?
    let company: String?
    let bio: String?
    let imageUrl: String?
}

struct VenueSummary: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let address: String?
}

struct TrackSummary: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let color: String?
}

enum EventType: String, Codable, CaseIterable, Hashable {
    case session
    case panel
    case workshop
    case screening
    case performance
    case meetup
    case party
    case other

    var displayName: String {
        switch self {
        case .session: return "Session"
        case .panel: return "Panel"
        case .workshop: return "Workshop"
        case .screening: return "Screening"
        case .performance: return "Performance"
        case .meetup: return "Meetup"
        case .party: return "Party"
        case .other: return "Other"
        }
    }
}

struct Event: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let description: String?
    let shortDescription: String?
    let startTime: Date
    let endTime: Date
    let day: String
    let venueId: String?
    let trackId: String?
    let eventType: EventType
    let imageUrl: String?
    let tags: [String]?
    let speakers: [Speaker]?
    let rsvpUrl: String?
    let isFeatured: Bool
    let isCancelled: Bool
    let capacity: Int?
    let attendeeCount: Int?
    let venue: VenueSummary?
    let track: TrackSummary?
    var notify: Bool?
    var addedAt: Date?

    var isHappeningNow: Bool {
        let now = Date()
        return now >= startTime && now <= endTime
    }

    var formattedTimeRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return "\(formatter.string(from: startTime)) - \(formatter.string(from: endTime))"
    }

    var formattedDay: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: startTime)
    }

    static func == (lhs: Event, rhs: Event) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
