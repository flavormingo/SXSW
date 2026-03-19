import Foundation
import SwiftData

@Observable
final class ScheduleViewModel {
    var scheduleByDay: [String: [Event]] = [:]
    var selectedDay: String?
    var isLoading = false
    var error: String?
    var conflicts: [ScheduleConflict] = []
    var availableDays: [String] = []

    private let scheduleService = ScheduleService.shared

    var eventsForSelectedDay: [Event] {
        guard let day = selectedDay else {
            return allEvents
        }
        return scheduleByDay[day] ?? []
    }

    var allEvents: [Event] {
        scheduleByDay.values.flatMap { $0 }.sorted { $0.startTime < $1.startTime }
    }

    var conflictCount: Int {
        conflicts.count
    }

    func loadSchedule() async {
        isLoading = true
        error = nil

        do {
            let events = try await scheduleService.getSchedule()
            groupEventsByDay(events)
            detectConflicts()
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func addEvent(eventId: String, forceAdd: Bool = false) async throws -> Event {
        let event = try await scheduleService.addToSchedule(eventId: eventId, forceAdd: forceAdd)

        let day = event.day
        if scheduleByDay[day] != nil {
            scheduleByDay[day]?.append(event)
            scheduleByDay[day]?.sort { $0.startTime < $1.startTime }
        } else {
            scheduleByDay[day] = [event]
        }

        updateAvailableDays()
        detectConflicts()
        return event
    }

    func removeEvent(eventId: String) async throws {
        try await scheduleService.removeFromSchedule(eventId: eventId)

        for (day, events) in scheduleByDay {
            scheduleByDay[day] = events.filter { $0.id != eventId }
            if scheduleByDay[day]?.isEmpty == true {
                scheduleByDay.removeValue(forKey: day)
            }
        }

        updateAvailableDays()
        detectConflicts()
    }

    func checkConflicts(eventId: String) async throws -> ConflictCheckResponse {
        return try await scheduleService.checkConflicts(eventId: eventId)
    }

    // MARK: - Offline

    func addEventOffline(event: Event, context: ModelContext) {
        let day = event.day
        if scheduleByDay[day] != nil {
            scheduleByDay[day]?.append(event)
            scheduleByDay[day]?.sort { $0.startTime < $1.startTime }
        } else {
            scheduleByDay[day] = [event]
        }

        updateAvailableDays()
        detectConflicts()

        SyncManager.shared.queueOfflineAction(
            eventId: event.id,
            action: "add",
            event: event,
            context: context
        )
    }

    func removeEventOffline(eventId: String, context: ModelContext) {
        for (day, events) in scheduleByDay {
            scheduleByDay[day] = events.filter { $0.id != eventId }
            if scheduleByDay[day]?.isEmpty == true {
                scheduleByDay.removeValue(forKey: day)
            }
        }

        updateAvailableDays()
        detectConflicts()

        SyncManager.shared.queueOfflineAction(
            eventId: eventId,
            action: "remove",
            event: nil,
            context: context
        )
    }

    func loadFromCache(context: ModelContext) {
        let events = SyncManager.shared.loadCachedSchedule(context: context)
        groupEventsByDay(events)
        detectConflicts()
    }

    // MARK: - Private

    private func groupEventsByDay(_ events: [Event]) {
        scheduleByDay = Dictionary(grouping: events) { $0.day }
        for (day, events) in scheduleByDay {
            scheduleByDay[day] = events.sorted { $0.startTime < $1.startTime }
        }
        updateAvailableDays()
    }

    private func updateAvailableDays() {
        availableDays = scheduleByDay.keys.sorted()
        if selectedDay == nil || !availableDays.contains(selectedDay ?? "") {
            selectedDay = availableDays.first
        }
    }

    private func detectConflicts() {
        var detected: [ScheduleConflict] = []

        for (_, events) in scheduleByDay {
            let sorted = events.sorted { $0.startTime < $1.startTime }
            for i in 0..<sorted.count {
                for j in (i + 1)..<sorted.count {
                    let a = sorted[i]
                    let b = sorted[j]

                    if a.endTime > b.startTime {
                        let overlapSeconds = a.endTime.timeIntervalSince(b.startTime)
                        let overlapMinutes = Int(overlapSeconds / 60)
                        detected.append(ScheduleConflict(
                            existingEvent: a,
                            newEvent: b,
                            overlapMinutes: overlapMinutes
                        ))
                    }
                }
            }
        }

        conflicts = detected
    }
}
