import SwiftUI

struct ExploreView: View {
    @State private var featuredEvents: [Event] = []
    @State private var tracks: [Track] = []
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                if isLoading {
                    LoadingView()
                        .padding(.top, 100)
                } else if let error = error {
                    ErrorView(message: error) {
                        Task { await loadData() }
                    }
                    .padding(.top, 100)
                } else {
                    VStack(alignment: .leading, spacing: 24) {
                        // Featured Events
                        if !featuredEvents.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Featured")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .padding(.horizontal)

                                ScrollView(.horizontal, showsIndicators: false) {
                                    LazyHStack(spacing: 16) {
                                        ForEach(featuredEvents) { event in
                                            NavigationLink(value: event) {
                                                FeaturedEventCard(event: event)
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                        }

                        // Tracks
                        if !tracks.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Explore by Track")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .padding(.horizontal)

                                LazyVGrid(
                                    columns: [
                                        GridItem(.flexible()),
                                        GridItem(.flexible())
                                    ],
                                    spacing: 12
                                ) {
                                    ForEach(tracks) { track in
                                        NavigationLink {
                                            EventListView()
                                        } label: {
                                            TrackCard(track: track)
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }

                        // All Events link
                        NavigationLink {
                            EventListView()
                        } label: {
                            HStack {
                                Label("Browse All Events", systemImage: "list.bullet")
                                    .fontWeight(.medium)
                                Spacer()
                                Image(systemName: "chevron.right")
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal)
                        .padding(.bottom, 20)
                    }
                    .padding(.top)
                }
            }
            .navigationTitle("SXSW")
            .refreshable {
                await loadData()
            }
            .task {
                await loadData()
            }
            .navigationDestination(for: Event.self) { event in
                EventDetailView(eventId: event.id)
            }
        }
    }

    private func loadData() async {
        isLoading = true
        error = nil

        do {
            async let featuredTask = EventService.shared.getFeatured()
            async let tracksTask: APIResponse<[Track]> = APIClient.shared.request(.tracks)

            featuredEvents = try await featuredTask
            tracks = try await tracksTask.data
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}

struct FeaturedEventCard: View {
    let event: Event

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let imageUrl = event.imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(.quaternary)
                        .overlay {
                            Image(systemName: "photo")
                                .foregroundStyle(.tertiary)
                        }
                }
                .frame(width: 280, height: 160)
                .clipped()
                .clipShape(RoundedRectangle(cornerRadius: 12))
            } else {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color(hex: event.track?.color ?? "333333").gradient)
                    .frame(width: 280, height: 160)
                    .overlay(alignment: .bottomLeading) {
                        VStack(alignment: .leading) {
                            if let track = event.track {
                                Text(track.name.uppercased())
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.white.opacity(0.8))
                            }
                        }
                        .padding(12)
                    }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .lineLimit(2)

                Text(event.formattedTimeRange)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                if let venue = event.venue {
                    Text(venue.name)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .frame(width: 280)
    }
}

struct TrackCard: View {
    let track: Track

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let icon = track.icon {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(.white)
            }

            Text(track.name)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .frame(height: 80)
        .background(track.swiftUIColor.gradient)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    ExploreView()
}
