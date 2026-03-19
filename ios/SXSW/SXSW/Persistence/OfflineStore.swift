import Foundation
import SwiftData

@Model
final class CachedEvent {
    @Attribute(.unique) var eventId: String
    var jsonData: Data
    var day: String
    var lastFetched: Date

    var isStale: Bool {
        Date().timeIntervalSince(lastFetched) > AppConstants.eventCacheTTL
    }

    init(eventId: String, jsonData: Data, day: String, lastFetched: Date = Date()) {
        self.eventId = eventId
        self.jsonData = jsonData
        self.day = day
        self.lastFetched = lastFetched
    }
}

@Model
final class CachedScheduleItem {
    @Attribute(.unique) var eventId: String
    var jsonData: Data
    var pendingAction: String?
    var lastFetched: Date

    init(eventId: String, jsonData: Data, pendingAction: String? = nil, lastFetched: Date = Date()) {
        self.eventId = eventId
        self.jsonData = jsonData
        self.pendingAction = pendingAction
        self.lastFetched = lastFetched
    }
}

@Model
final class CachedVenue {
    @Attribute(.unique) var venueId: String
    var jsonData: Data
    var lastFetched: Date

    var isStale: Bool {
        Date().timeIntervalSince(lastFetched) > AppConstants.venueCacheTTL
    }

    init(venueId: String, jsonData: Data, lastFetched: Date = Date()) {
        self.venueId = venueId
        self.jsonData = jsonData
        self.lastFetched = lastFetched
    }
}

enum OfflineStore {
    static var container: ModelContainer {
        let schema = Schema([
            CachedEvent.self,
            CachedScheduleItem.self,
            CachedVenue.self
        ])
        let configuration = ModelConfiguration(
            "SXSWOfflineStore",
            schema: schema,
            isStoredInMemoryOnly: false
        )
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }
}
