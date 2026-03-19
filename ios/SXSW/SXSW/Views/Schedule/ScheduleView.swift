import SwiftUI

struct ScheduleView: View {
    @State private var viewModel = ScheduleViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if !viewModel.availableDays.isEmpty {
                    dayPicker
                }

                if viewModel.conflictCount > 0 {
                    ConflictBannerView(count: viewModel.conflictCount)
                }

                if viewModel.isLoading {
                    LoadingView()
                } else if let error = viewModel.error {
                    ErrorView(message: error) {
                        Task { await viewModel.loadSchedule() }
                    }
                } else if viewModel.eventsForSelectedDay.isEmpty {
                    EmptyStateView(
                        icon: "calendar",
                        title: "No Events Scheduled",
                        message: "Add events to your schedule from the Explore or Events tabs."
                    )
                } else {
                    scheduleList
                }
            }
            .navigationTitle("My Schedule")
            .refreshable {
                await viewModel.loadSchedule()
            }
            .task {
                await viewModel.loadSchedule()
            }
        }
    }

    private var dayPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(viewModel.availableDays, id: \.self) { day in
                    DayPill(
                        day: day,
                        isSelected: viewModel.selectedDay == day,
                        hasConflict: viewModel.conflicts.contains {
                            $0.existingEvent.day == day
                        }
                    ) {
                        viewModel.selectedDay = day
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(.ultraThinMaterial)
    }

    private var scheduleList: some View {
        List {
            ForEach(viewModel.eventsForSelectedDay) { event in
                NavigationLink(value: event) {
                    ScheduleItemRow(
                        event: event,
                        hasConflict: viewModel.conflicts.contains {
                            $0.existingEvent.id == event.id || $0.newEvent?.id == event.id
                        }
                    )
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    Button(role: .destructive) {
                        Task {
                            try? await viewModel.removeEvent(eventId: event.id)
                        }
                    } label: {
                        Label("Remove", systemImage: "trash")
                    }
                }
            }
        }
        .listStyle(.plain)
        .navigationDestination(for: Event.self) { event in
            EventDetailView(eventId: event.id)
        }
    }
}

struct DayPill: View {
    let day: String
    let isSelected: Bool
    let hasConflict: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Text(shortDay)
                    .font(.sxswDetailSmall)
                    .fontWeight(.medium)
                Text(dayNumber)
                    .font(.sxswHeadlineDefault)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? Color.sxswOrange : Color(.systemGray5))
            .foregroundStyle(isSelected ? .white : .primary)
            .clipShape(Capsule())
            .overlay {
                if hasConflict {
                    Circle()
                        .fill(.orange)
                        .frame(width: 8, height: 8)
                        .offset(x: 20, y: -14)
                }
            }
        }
    }

    private var shortDay: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: day) else { return "" }
        formatter.dateFormat = "EEE"
        return formatter.string(from: date).uppercased()
    }

    private var dayNumber: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: day) else { return "" }
        formatter.dateFormat = "d"
        return formatter.string(from: date)
    }
}

struct ScheduleItemRow: View {
    let event: Event
    let hasConflict: Bool

    var body: some View {
        HStack(spacing: 12) {
            // Time column
            VStack(alignment: .trailing, spacing: 2) {
                Text(startTimeString)
                    .font(.sxswDetail)
                    .fontWeight(.semibold)
                Text(endTimeString)
                    .font(.sxswDetailSmall)
                    .foregroundStyle(.secondary)
            }
            .frame(width: 60, alignment: .trailing)

            Rectangle()
                .fill(trackColor)
                .frame(width: 3)
                .clipShape(Capsule())

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.sxswBodyDefault)
                    .fontWeight(.medium)
                    .lineLimit(2)

                if let venue = event.venue {
                    Label(venue.name, systemImage: "mappin")
                        .font(.sxswDetail)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                if event.isHappeningNow {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(.red)
                            .frame(width: 6, height: 6)
                        Text("LIVE NOW")
                            .font(.sxswDetailSmall)
                            .fontWeight(.bold)
                            .foregroundStyle(.red)
                    }
                }
            }

            Spacer()

            if hasConflict {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.sxswDetail)
                    .foregroundStyle(.orange)
            }
        }
        .padding(.vertical, 4)
    }

    private var startTimeString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: event.startTime)
    }

    private var endTimeString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter.string(from: event.endTime)
    }

    private var trackColor: Color {
        if let color = event.track?.color {
            return Color(hex: color)
        }
        return .gray
    }
}

#Preview {
    ScheduleView()
}
