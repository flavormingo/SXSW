import Foundation
import SwiftData

@Observable
final class EventListViewModel {
    var events: [Event] = []
    var isLoading = false
    var isLoadingMore = false
    var error: String?
    var searchQuery = ""
    var hasMore = false

    // Filters
    var selectedDay: String?
    var selectedTrackId: String?
    var selectedVenueId: String?
    var selectedEventType: EventType?
    var availableDays: [String] = []
    var availableTracks: [Track] = []

    private var nextCursor: String?
    private let eventService = EventService.shared

    var hasActiveFilters: Bool {
        selectedDay != nil || selectedTrackId != nil ||
        selectedVenueId != nil || selectedEventType != nil
    }

    func loadEvents() async {
        isLoading = true
        error = nil

        do {
            let response = try await eventService.listEvents(
                day: selectedDay,
                trackId: selectedTrackId,
                venueId: selectedVenueId,
                eventType: selectedEventType
            )
            events = response.data
            nextCursor = response.pagination?.nextCursor
            hasMore = response.pagination?.hasMore ?? false
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func loadMore() async {
        guard hasMore, !isLoadingMore, let cursor = nextCursor else { return }

        isLoadingMore = true

        do {
            let response = try await eventService.listEvents(
                day: selectedDay,
                trackId: selectedTrackId,
                venueId: selectedVenueId,
                eventType: selectedEventType,
                cursor: cursor
            )
            events.append(contentsOf: response.data)
            nextCursor = response.pagination?.nextCursor
            hasMore = response.pagination?.hasMore ?? false
        } catch {
            print("[Events] Load more failed: \(error)")
        }

        isLoadingMore = false
    }

    func search() async {
        guard !searchQuery.isEmpty else {
            await loadEvents()
            return
        }

        isLoading = true
        error = nil

        do {
            let response = try await eventService.search(query: searchQuery)
            events = response.data
            hasMore = false
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func loadFilters() async {
        do {
            availableDays = try await eventService.getDays()
        } catch {
            print("[Events] Failed to load days: \(error)")
        }

        do {
            let response: APIResponse<[Track]> = try await APIClient.shared.request(.tracks)
            availableTracks = response.data
        } catch {
            print("[Events] Failed to load tracks: \(error)")
        }
    }

    func clearFilters() {
        selectedDay = nil
        selectedTrackId = nil
        selectedVenueId = nil
        selectedEventType = nil
    }

    // MARK: - Offline

    func cacheForOffline(context: ModelContext) {
        let syncManager = SyncManager.shared
        syncManager.cacheEvents(events, day: selectedDay ?? "all", context: context)
    }

    func loadFromCache(context: ModelContext) {
        let syncManager = SyncManager.shared
        events = syncManager.loadCachedEvents(day: selectedDay, context: context)
    }
}
