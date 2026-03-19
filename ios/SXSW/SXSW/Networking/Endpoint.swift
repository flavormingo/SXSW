import Foundation

struct EventQueryParams {
    var day: String?
    var trackId: String?
    var venueId: String?
    var eventType: String?
    var cursor: String?
    var limit: Int?
}

enum HTTPMethod: String {
    case GET
    case POST
    case PUT
    case DELETE
    case PATCH
}

enum Endpoint {
    // Auth
    case magicLink(email: String)
    case verifyMagicLink(token: String)
    case logout

    // Events
    case events(params: EventQueryParams)
    case eventDetail(id: String)
    case searchEvents(query: String)
    case eventDays
    case featuredEvents

    // Schedule
    case schedule(day: String?)
    case addToSchedule(eventId: String, forceAdd: Bool)
    case removeFromSchedule(eventId: String)
    case checkConflicts(eventId: String)

    // Favorites
    case favorites
    case addFavorite(eventId: String)
    case removeFavorite(eventId: String)

    // Recommendations
    case recommendations

    // Venues
    case venues
    case venueDetail(id: String)

    // Tracks
    case tracks

    // Push
    case registerPushToken(token: String)

    // User
    case currentUser
    case updateProfile(name: String)

    // Analytics
    case trackAnalytics(payload: Data)

    var path: String {
        switch self {
        case .magicLink:
            return "/api/auth/sign-in/magic-link"
        case .verifyMagicLink:
            return "/api/auth/magic-link/verify"
        case .logout:
            return "/api/auth/sign-out"
        case .events:
            return "/api/events"
        case .eventDetail(let id):
            return "/api/events/\(id)"
        case .searchEvents:
            return "/api/events/search"
        case .eventDays:
            return "/api/events/days"
        case .featuredEvents:
            return "/api/events/featured"
        case .schedule:
            return "/api/schedule"
        case .addToSchedule:
            return "/api/schedule"
        case .removeFromSchedule(let eventId):
            return "/api/schedule/\(eventId)"
        case .checkConflicts(let eventId):
            return "/api/schedule/conflicts/\(eventId)"
        case .favorites:
            return "/api/favorites"
        case .addFavorite:
            return "/api/favorites"
        case .removeFavorite(let eventId):
            return "/api/favorites/\(eventId)"
        case .recommendations:
            return "/api/recommendations"
        case .venues:
            return "/api/venues"
        case .venueDetail(let id):
            return "/api/venues/\(id)"
        case .tracks:
            return "/api/tracks"
        case .registerPushToken:
            return "/api/push/register"
        case .currentUser:
            return "/api/users/me"
        case .updateProfile:
            return "/api/users/me"
        case .trackAnalytics:
            return "/api/analytics/track"
        }
    }

    var method: HTTPMethod {
        switch self {
        case .magicLink, .verifyMagicLink, .addToSchedule, .addFavorite,
             .registerPushToken, .trackAnalytics:
            return .POST
        case .logout:
            return .POST
        case .removeFromSchedule, .removeFavorite:
            return .DELETE
        case .updateProfile:
            return .PATCH
        default:
            return .GET
        }
    }

    var queryItems: [URLQueryItem]? {
        switch self {
        case .events(let params):
            var items: [URLQueryItem] = []
            if let day = params.day { items.append(URLQueryItem(name: "day", value: day)) }
            if let trackId = params.trackId { items.append(URLQueryItem(name: "trackId", value: trackId)) }
            if let venueId = params.venueId { items.append(URLQueryItem(name: "venueId", value: venueId)) }
            if let eventType = params.eventType { items.append(URLQueryItem(name: "eventType", value: eventType)) }
            if let cursor = params.cursor { items.append(URLQueryItem(name: "cursor", value: cursor)) }
            if let limit = params.limit { items.append(URLQueryItem(name: "limit", value: String(limit))) }
            return items.isEmpty ? nil : items
        case .searchEvents(let query):
            return [URLQueryItem(name: "q", value: query)]
        case .schedule(let day):
            if let day = day {
                return [URLQueryItem(name: "day", value: day)]
            }
            return nil
        default:
            return nil
        }
    }

    var body: Data? {
        switch self {
        case .magicLink(let email):
            return try? JSONEncoder().encode(["email": email])
        case .verifyMagicLink(let token):
            return try? JSONEncoder().encode(["token": token])
        case .addToSchedule(let eventId, let forceAdd):
            return try? JSONSerialization.data(withJSONObject: [
                "eventId": eventId,
                "forceAdd": forceAdd
            ])
        case .addFavorite(let eventId):
            return try? JSONEncoder().encode(["eventId": eventId])
        case .registerPushToken(let token):
            return try? JSONEncoder().encode(["token": token, "platform": "ios"])
        case .updateProfile(let name):
            return try? JSONEncoder().encode(["name": name])
        case .trackAnalytics(let payload):
            return payload
        default:
            return nil
        }
    }

    func urlRequest() -> URLRequest {
        var components = URLComponents(string: AppConstants.apiBaseURL + path)!
        components.queryItems = queryItems

        var request = URLRequest(url: components.url!)
        request.httpMethod = method.rawValue
        request.httpBody = body

        return request
    }
}
