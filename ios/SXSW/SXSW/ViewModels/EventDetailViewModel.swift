import Foundation

@Observable
final class EventDetailViewModel {
    var event: Event?
    var isLoading = false
    var error: String?
    var isFavorite = false
    var isInSchedule = false
    var conflictCheck: ConflictCheckResponse?
    var showConflictAlert = false

    private let eventService = EventService.shared
    private let scheduleService = ScheduleService.shared

    func loadEvent(id: String) async {
        isLoading = true
        error = nil

        do {
            event = try await eventService.getEvent(id: id)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func toggleFavorite() async {
        guard let event = event else { return }

        do {
            if isFavorite {
                let _: SuccessResponse = try await APIClient.shared.request(
                    .removeFavorite(eventId: event.id)
                )
                isFavorite = false
            } else {
                let _: SuccessResponse = try await APIClient.shared.request(
                    .addFavorite(eventId: event.id)
                )
                isFavorite = true
            }
        } catch {
            print("[Favorites] Toggle failed: \(error)")
        }
    }

    func addToSchedule(forceAdd: Bool = false) async {
        guard let event = event else { return }

        if !forceAdd {
            do {
                let check = try await scheduleService.checkConflicts(eventId: event.id)
                if check.hasConflict {
                    conflictCheck = check
                    showConflictAlert = true
                    return
                }
            } catch {
                print("[Schedule] Conflict check failed: \(error)")
            }
        }

        do {
            let _ = try await scheduleService.addToSchedule(
                eventId: event.id,
                forceAdd: forceAdd
            )
            isInSchedule = true
            showConflictAlert = false
        } catch {
            self.error = error.localizedDescription
        }
    }

    func removeFromSchedule() async {
        guard let event = event else { return }

        do {
            try await scheduleService.removeFromSchedule(eventId: event.id)
            isInSchedule = false
        } catch {
            self.error = error.localizedDescription
        }
    }
}
