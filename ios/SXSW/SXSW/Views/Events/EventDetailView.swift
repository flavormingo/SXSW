import SwiftUI

struct EventDetailView: View {
    let eventId: String
    @State private var viewModel = EventDetailViewModel()

    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                LoadingView()
                    .padding(.top, 100)
            } else if let error = viewModel.error, viewModel.event == nil {
                ErrorView(message: error) {
                    Task { await viewModel.loadEvent(id: eventId) }
                }
                .padding(.top, 100)
            } else if let event = viewModel.event {
                eventContent(event)
            }
        }
        .navigationTitle("Event Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await viewModel.toggleFavorite() }
                } label: {
                    Image(systemName: viewModel.isFavorite ? "heart.fill" : "heart")
                        .foregroundStyle(viewModel.isFavorite ? .red : .primary)
                }
            }
        }
        .alert("Schedule Conflict", isPresented: $viewModel.showConflictAlert) {
            Button("Add Anyway") {
                Task { await viewModel.addToSchedule(forceAdd: true) }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            if let conflicts = viewModel.conflictCheck?.conflictingEvents {
                let names = conflicts.map(\.title).joined(separator: ", ")
                Text("This event overlaps with: \(names). Add anyway?")
            }
        }
        .task {
            await viewModel.loadEvent(id: eventId)
        }
    }

    @ViewBuilder
    private func eventContent(_ event: Event) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            // Image
            if let imageUrl = event.imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 200)
                        .clipped()
                } placeholder: {
                    Rectangle()
                        .fill(.quaternary)
                        .frame(height: 200)
                        .overlay {
                            Image(systemName: "photo")
                                .font(.sxswLargeTitle)
                                .foregroundStyle(.tertiary)
                        }
                }
            }

            VStack(alignment: .leading, spacing: 16) {
                // Track & Type
                HStack {
                    if let track = event.track {
                        TrackBadge(name: track.name, color: Color(hex: track.color ?? "888888"))
                    }
                    Text(event.eventType.displayName)
                        .font(.sxswDetail)
                        .foregroundStyle(.secondary)
                    Spacer()
                    if event.isFeatured {
                        Label("Featured", systemImage: "star.fill")
                            .font(.sxswDetail)
                            .foregroundStyle(.yellow)
                    }
                }

                // Title
                Text(event.title)
                    .font(.sxswTitle2)

                // Time & Venue
                VStack(alignment: .leading, spacing: 8) {
                    Label(event.formattedTimeRange, systemImage: "clock")
                        .font(.sxswDetailLarge)
                    Label(event.formattedDay, systemImage: "calendar")
                        .font(.sxswDetailLarge)
                    if let venue = event.venue {
                        Label(venue.name, systemImage: "mappin.circle")
                            .font(.sxswDetailLarge)
                        if let address = venue.address {
                            Text(address)
                                .font(.sxswDetail)
                                .foregroundStyle(.secondary)
                                .padding(.leading, 28)
                        }
                    }
                }

                // Description
                if let description = event.description {
                    Text(description)
                        .font(.sxswBodyDefault)
                        .foregroundStyle(.secondary)
                }

                // Speakers
                if let speakers = event.speakers, !speakers.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Speakers")
                            .font(.sxswHeadlineDefault)

                        ForEach(speakers) { speaker in
                            HStack(spacing: 12) {
                                if let imageUrl = speaker.imageUrl, let url = URL(string: imageUrl) {
                                    AsyncImage(url: url) { image in
                                        image.resizable()
                                            .aspectRatio(contentMode: .fill)
                                    } placeholder: {
                                        Circle().fill(.quaternary)
                                    }
                                    .frame(width: 44, height: 44)
                                    .clipShape(Circle())
                                } else {
                                    Image(systemName: "person.circle.fill")
                                        .font(.system(size: 44))
                                        .foregroundStyle(.quaternary)
                                }

                                VStack(alignment: .leading) {
                                    Text(speaker.name)
                                        .font(.sxswBodyDefault)
                                        .fontWeight(.medium)
                                    if let title = speaker.title {
                                        Text(title)
                                            .font(.sxswDetail)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                }

                // Schedule Button
                Divider()

                if viewModel.isInSchedule {
                    Button(role: .destructive) {
                        Task { await viewModel.removeFromSchedule() }
                    } label: {
                        Label("Remove from Schedule", systemImage: "calendar.badge.minus")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                    .buttonStyle(.bordered)
                } else {
                    Button {
                        Task { await viewModel.addToSchedule() }
                    } label: {
                        Label("Add to Schedule", systemImage: "calendar.badge.plus")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.sxswOrange)
                }
            }
            .padding()
        }
    }
}

#Preview {
    NavigationStack {
        EventDetailView(eventId: "test-event-1")
    }
}
