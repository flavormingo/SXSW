import SwiftUI

struct EventFilterView: View {
    @Bindable var viewModel: EventListViewModel
    let onApply: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Day") {
                    Picker("Day", selection: $viewModel.selectedDay) {
                        Text("All Days").tag(nil as String?)
                        ForEach(viewModel.availableDays, id: \.self) { day in
                            Text(formatDay(day)).tag(day as String?)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section("Track") {
                    Picker("Track", selection: $viewModel.selectedTrackId) {
                        Text("All Tracks").tag(nil as String?)
                        ForEach(viewModel.availableTracks) { track in
                            HStack {
                                Circle()
                                    .fill(track.swiftUIColor)
                                    .frame(width: 12, height: 12)
                                Text(track.name)
                            }
                            .tag(track.id as String?)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section("Event Type") {
                    Picker("Type", selection: $viewModel.selectedEventType) {
                        Text("All Types").tag(nil as EventType?)
                        ForEach(EventType.allCases, id: \.self) { type in
                            Text(type.displayName).tag(type as EventType?)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                if viewModel.hasActiveFilters {
                    Section {
                        Button("Clear All Filters", role: .destructive) {
                            viewModel.clearFilters()
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Apply") {
                        onApply()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    private func formatDay(_ day: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: day) else { return day }
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: date)
    }
}
