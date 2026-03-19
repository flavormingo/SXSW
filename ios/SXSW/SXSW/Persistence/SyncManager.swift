import Foundation
import SwiftData

@Observable
final class SyncManager {
    static let shared = SyncManager()

    var isSyncing = false
    var lastSyncDate: Date?

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    private init() {}

    // MARK: - Events

    func cacheEvents(_ events: [Event], day: String, context: ModelContext) {
        for event in events {
            guard let jsonData = try? encoder.encode(event) else { continue }

            let descriptor = FetchDescriptor<CachedEvent>(
                predicate: #Predicate { $0.eventId == event.id }
            )

            if let existing = try? context.fetch(descriptor).first {
                existing.jsonData = jsonData
                existing.day = day
                existing.lastFetched = Date()
            } else {
                let cached = CachedEvent(eventId: event.id, jsonData: jsonData, day: day)
                context.insert(cached)
            }
        }

        try? context.save()
    }

    func loadCachedEvents(day: String? = nil, context: ModelContext) -> [Event] {
        var descriptor = FetchDescriptor<CachedEvent>()
        if let day = day {
            descriptor.predicate = #Predicate { $0.day == day }
        }

        guard let cached = try? context.fetch(descriptor) else { return [] }

        return cached.compactMap { item in
            try? decoder.decode(Event.self, from: item.jsonData)
        }
    }

    // MARK: - Schedule

    func cacheSchedule(_ events: [Event], context: ModelContext) {
        for event in events {
            guard let jsonData = try? encoder.encode(event) else { continue }

            let descriptor = FetchDescriptor<CachedScheduleItem>(
                predicate: #Predicate { $0.eventId == event.id }
            )

            if let existing = try? context.fetch(descriptor).first {
                existing.jsonData = jsonData
                existing.lastFetched = Date()
                existing.pendingAction = nil
            } else {
                let cached = CachedScheduleItem(eventId: event.id, jsonData: jsonData)
                context.insert(cached)
            }
        }

        try? context.save()
    }

    func loadCachedSchedule(context: ModelContext) -> [Event] {
        let descriptor = FetchDescriptor<CachedScheduleItem>(
            predicate: #Predicate { $0.pendingAction != "remove" }
        )

        guard let cached = try? context.fetch(descriptor) else { return [] }

        return cached.compactMap { item in
            try? decoder.decode(Event.self, from: item.jsonData)
        }
    }

    // MARK: - Offline Queue

    func queueOfflineAction(eventId: String, action: String, event: Event?, context: ModelContext) {
        let descriptor = FetchDescriptor<CachedScheduleItem>(
            predicate: #Predicate { $0.eventId == eventId }
        )

        if action == "add", let event = event {
            if let jsonData = try? encoder.encode(event) {
                if let existing = try? context.fetch(descriptor).first {
                    existing.pendingAction = "add"
                    existing.jsonData = jsonData
                } else {
                    let cached = CachedScheduleItem(
                        eventId: eventId,
                        jsonData: jsonData,
                        pendingAction: "add"
                    )
                    context.insert(cached)
                }
            }
        } else if action == "remove" {
            if let existing = try? context.fetch(descriptor).first {
                if existing.pendingAction == "add" {
                    context.delete(existing)
                } else {
                    existing.pendingAction = "remove"
                }
            }
        }

        try? context.save()
    }

    // MARK: - Sync

    func syncPendingChanges(context: ModelContext) async {
        guard !isSyncing else { return }

        await MainActor.run { isSyncing = true }

        defer {
            Task { @MainActor in
                isSyncing = false
                lastSyncDate = Date()
            }
        }

        let descriptor = FetchDescriptor<CachedScheduleItem>(
            predicate: #Predicate { $0.pendingAction != nil }
        )

        guard let pendingItems = try? context.fetch(descriptor) else { return }

        for item in pendingItems {
            guard let action = item.pendingAction else { continue }

            do {
                if action == "add" {
                    let _ = try await ScheduleService.shared.addToSchedule(
                        eventId: item.eventId,
                        forceAdd: true
                    )
                    await MainActor.run { item.pendingAction = nil }
                } else if action == "remove" {
                    try await ScheduleService.shared.removeFromSchedule(eventId: item.eventId)
                    await MainActor.run { context.delete(item) }
                }
            } catch {
                print("[SyncManager] Failed to sync \(action) for \(item.eventId): \(error)")
            }
        }

        try? context.save()
    }
}
